import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { exportsTable, projects } from "@/drizzle/schema";
import { requireUser } from "@/lib/auth-server";
import { newId } from "@/lib/auth-utils";
import { ffmpegAvailable, renderExport } from "@/lib/ffmpeg/export";
import { z } from "zod";

const schema = z.object({
  projectId: z.string().min(1),
  platform: z.string().optional(),
  presetName: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await requireUser();
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, parsed.data.projectId))
    .limit(1);
  if (!project) return NextResponse.json({ error: "project_not_found" }, { status: 404 });
  if (project.workspaceId === undefined) {
    // Require workspace membership when present
  }

  if (!(await ffmpegAvailable())) {
    return NextResponse.json(
      { error: "ffmpeg_missing", message: "This render needs ffmpeg on PATH or FFMPEG_PATH." },
      { status: 500 }
    );
  }

  const outPath = `/tmp/creatora-export-${newId()}.mp4`;
  const [exp] = await db
    .insert(exportsTable)
    .values({
      id: newId(),
      workspaceId: project.workspaceId,
      projectId: project.id,
      userId: user.id,
      status: "processing",
      platform: parsed.data.platform,
      presetName: parsed.data.presetName,
    })
    .returning();

  try {
    const { outPath: finalPath, segments } = await renderExport(project.id, outPath, parsed.data.presetName);
    await db
      .update(exportsTable)
      .set({ status: "completed", fileUrl: finalPath, completedAt: new Date() })
      .where(eq(exportsTable.id, exp.id));
    return NextResponse.json({ export: { ...exp, status: "completed", fileUrl: finalPath, segments } });
  } catch (err) {
    await db
      .update(exportsTable)
      .set({ status: "failed", error: err instanceof Error ? err.message : "render_failed" })
      .where(eq(exportsTable.id, exp.id));
    return NextResponse.json({ error: "render_failed", export: exp }, { status: 500 });
  }
}
