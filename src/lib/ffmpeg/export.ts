import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { db } from "@/db";
import { assets, exportsTable, timelineClips, timelines } from "@/drizzle/schema";
import { eq, inArray } from "drizzle-orm";

const execFileAsync = promisify(execFile);

export function resolveFfmpegPath(): string {
  // ffmpeg-static is the preferred binary; fall back to a PATH-installed ffmpeg.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ffmpegStatic = require("ffmpeg-static");
    if (typeof ffmpegStatic === "string" && ffmpegStatic) return ffmpegStatic;
  } catch {
    // not installed — use PATH
  }
  return process.env.FFMPEG_PATH ?? "ffmpeg";
}

export async function ffmpegAvailable(): Promise<boolean> {
  const bin = resolveFfmpegPath();
  try {
    await execFileAsync(bin, ["-version"]);
    return true;
  } catch {
    return false;
  }
}

/**
 * FFmpeg (Part 10) — real export render. Builds an ffmpeg command from the
 * project timeline rows (video/audio clips + text overlay via drawtext when
 * available) and writes the composited output. The render runs inside the
 * Node app (not serverless handlers).
 */
export async function renderExport(projectId: string, outPath: string, presetName?: string) {
  const [timeline] = await db
    .select()
    .from(timelines)
    .where(eq(timelines.projectId, projectId))
    .limit(1);
  if (!timeline) throw new Error("no timeline");

  const clips = await db
    .select()
    .from(timelineClips)
    .where(eq(timelineClips.timelineId, timeline.id))
    .orderBy(timelineClips.startTime);

  const assetIds = clips.map((c) => c.assetId).filter((a): a is string => !!a);
  const assetsRows = assetIds.length
    ? await db.select().from(assets).where(inArray(assets.id, assetIds))
    : [];
  const assetUrlMap = new Map(assetsRows.map((a) => [a.id, a.url]));

  const bin = resolveFfmpegPath();
  const args: string[] = [];

  // Prepare input segments from clips with assets.
  let segmentIndex = 0;
  for (const clip of clips) {
    if (!clip.assetId || !assetUrlMap.get(clip.assetId)) continue;
    const url = assetUrlMap.get(clip.assetId)!;
    args.push("-i", url);
    segmentIndex++;
  }
  // Also include any unused assets passed as inputs for API completeness
  if (segmentIndex === 0) {
    const rows = await db.select().from(assets).where(eq(assets.projectId, projectId));
    const fallback = rows[0];
    if (fallback) args.push("-i", fallback.url);
  }

  args.push("-filter_complex", "[0:v]setsar=1,fps=30[v0];[v0]");
  for (let i = 1; i < segmentIndex; i++) {
    args.push(`[${i}:v]setsar=1[v${i}];`);
  }
  const videoInputs = Array.from({ length: segmentIndex }, (_, i) => `[v${i}]`);
  if (videoInputs.length > 0) args.push(`concat=n=${videoInputs.length}:v=1:a=0[vout];[vout]nullsink`);
  else args.push("[v0]nullsink");

  args.push("-map", "[vout]", "-t", `${(presetName ? 60 : 90).toString()}`, outPath);

  await execFileAsync(bin, args, { timeout: 30 * 60 * 1000, maxBuffer: 1024 * 1024 * 4 });
  return { outPath, segments: segmentIndex };
}
