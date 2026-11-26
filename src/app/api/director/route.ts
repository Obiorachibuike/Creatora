import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { generations, memberships } from "@/drizzle/schema";
import { getFirstModelByCapability, getProvider } from "@/lib/ai/registry";
import { mockProvider } from "@/lib/ai/providers";
import { getMembershipsForUser, requireUser } from "@/lib/auth-server";
import { newId } from "@/lib/auth-utils";
import { z } from "zod";

const schema = z.object({ brief: z.string().min(1).max(2000) });

export async function POST(req: Request) {
  const user = await requireUser();
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const membershipsRows = await getMembershipsForUser(user.id);
  const workspaceId = membershipsRows[0]?.workspaceId ?? null;
  if (!workspaceId) return NextResponse.json({ error: "no_workspace" }, { status: 400 });

  const steps: string[] = [];

  // Step 1: storyboard — image generation (Part 9: identify target + scenes)
  const videoSel = await getFirstModelByCapability("text-to-video");
  const provider = (await getProvider(videoSel?.provider.slug ?? "mock")) ?? mockProvider;
  const storyboard = await provider.generateImage({
    prompt: `Storyboard for: ${parsed.data.brief}`,
  });
  steps.push(`Storyboard image generated via ${storyboard.provider} (${storyboard.model})`);

  // Step 2: video generation — persistent record + provider call
  const [videoGen] = await db
    .insert(generations)
    .values({
      id: newId(),
      workspaceId,
      userId: user.id,
      provider: provider.slug,
      model: videoSel?.modelName ?? provider.slug,
      kind: "video",
      prompt: parsed.data.brief,
      status: "generating",
    })
    .returning();
  const videoResult = await provider.generateVideo({ prompt: parsed.data.brief });
  await db
    .update(generations)
    .set({ status: "completed", resultUrl: videoResult.url, completedAt: new Date() })
    .where(eq(generations.id, videoGen.id));
  steps.push(`Video scene generated via ${videoResult.provider} (${videoResult.model})`);

  return NextResponse.json({ ok: true, steps, generationIds: [videoGen.id] });
}
