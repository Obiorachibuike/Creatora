import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { assets, generations, projects } from "@/drizzle/schema";
import { getFirstModelByCapability, getProvider } from "@/lib/ai/registry";
import { mockProvider } from "@/lib/ai/providers";
import { requireUser, type UserRow } from "@/lib/auth-server";
import { newId } from "@/lib/auth-utils";
import { auditLog } from "@/lib/auth-server";
import { getOrCreateAccount, reserveCredits, settleCredits } from "@/lib/credits";
import { z } from "zod";

const schema = z.object({
  kind: z.enum(["video", "image", "audio"]),
  prompt: z.string().min(1).max(3000),
  projectId: z.string().optional(),
  model: z.string().optional(),
  providerSlug: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  aspectRatio: z.string().optional(),
  duration: z.number().optional(),
  voice: z.string().optional(),
});

async function getWorkspaceOf(user: UserRow, projectId?: string) {
  if (projectId) {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    if (project) return project.workspaceId;
  }
  const { getMembershipsForUser } = await import("@/lib/auth-server");
  const memberships = await getMembershipsForUser(user.id);
  if (memberships.length > 0) return memberships[0].workspaceId;
  return null;
}

export async function POST(request: Request) {
  const user = await requireUser();
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const capability =
    parsed.data.kind === "video" ? "text-to-video" : parsed.data.kind === "image" ? "text-to-image" : "text-to-speech";
  const selected = await getFirstModelByCapability(capability);
  const providerSlug = parsed.data.providerSlug ?? selected?.provider.slug ?? "mock";
  const provider = (await getProvider(providerSlug)) ?? mockProvider;
  const modelName = selected?.modelName ?? provider.slug;

  const workspaceId = await getWorkspaceOf(user, parsed.data.projectId);
  if (!workspaceId) return NextResponse.json({ error: "no_workspace" }, { status: 400 });

  const account = await getOrCreateAccount(workspaceId, user.id);
  const estimated = parsed.data.kind === "video" ? 1.5 : parsed.data.kind === "image" ? 0.5 : 0.25;
  if (!(await reserveCredits(account, estimated, { reason: "generation" }))) {
    return NextResponse.json({ error: "insufficient_credits" }, { status: 402 });
  }

  const [generation] = await db
    .insert(generations)
    .values({
      id: newId(),
      workspaceId,
      projectId: parsed.data.projectId ?? null,
      userId: user.id,
      provider: provider.slug,
      model: modelName,
      kind: parsed.data.kind,
      prompt: parsed.data.prompt,
      status: "generating",
      estimatedCredits: estimated,
      startedAt: new Date(),
    })
    .returning();

  await auditLog({
    userId: user.id,
    workspaceId,
    action: "generation.start",
    resource: "generation",
    resourceId: generation.id,
    details: { kind: parsed.data.kind, provider: provider.slug, model: modelName },
  });

  try {
    const result =
      parsed.data.kind === "video"
        ? await provider.generateVideo({
            prompt: parsed.data.prompt,
            model: modelName,
            width: parsed.data.width,
            height: parsed.data.height,
            aspectRatio: parsed.data.aspectRatio,
            duration: parsed.data.duration,
          })
        : parsed.data.kind === "image"
          ? await provider.generateImage({
              prompt: parsed.data.prompt,
              model: modelName,
              width: parsed.data.width,
              height: parsed.data.height,
              aspectRatio: parsed.data.aspectRatio,
            })
          : await provider.generateAudio({
              text: parsed.data.prompt,
              model: modelName,
              voice: parsed.data.voice,
              language: parsed.data.duration ? "en" : undefined,
            });

    const assetId = newId();
    await db.insert(assets).values({
      id: assetId,
      workspaceId,
      projectId: parsed.data.projectId ?? null,
      ownerId: user.id,
      kind: parsed.data.kind === "video" ? "video" : parsed.data.kind === "image" ? "image" : "audio",
      url: result.url,
      isGenerated: true,
      duration: (result.metadata?.duration as number | undefined) ?? undefined,
      metadata: { provider: provider.slug, model: modelName, ...result.metadata },
    });

    await db
      .update(generations)
      .set({
        status: "completed",
        resultUrl: result.url,
        resultAssetId: assetId,
        creditsUsed: result.estimatedCost ?? estimated,
        completedAt: new Date(),
      })
      .where(eq(generations.id, generation.id));
    await settleCredits(account, result.estimatedCost ?? estimated);

    return NextResponse.json({ generation, asset: { id: assetId, url: result.url } }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "generation_failed";
    await db
      .update(generations)
      .set({ status: "failed", error: message, completedAt: new Date() })
      .where(eq(generations.id, generation.id));
    return NextResponse.json({ error: "generation_failed", generation }, { status: 500 });
  }
}
