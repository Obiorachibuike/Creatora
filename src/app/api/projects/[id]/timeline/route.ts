import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { timelineClips, timelineTracks, timelines } from "@/drizzle/schema";
import { requireUser } from "@/lib/auth-server";
import { newId } from "@/lib/auth-utils";
import { z } from "zod";

const trackSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  trackType: z.enum(["video", "audio", "image", "text", "overlay"]),
  order: z.number().optional(),
});

const clipSchema = z.object({
  id: z.string().optional(),
  trackId: z.string(),
  assetId: z.string().optional(),
  generationId: z.string().optional(),
  startTime: z.number().default(0),
  duration: z.number().default(0),
  order: z.number().default(0),
  opacity: z.number().default(1),
  text: z.string().optional(),
  voiceoverId: z.string().optional(),
  transitions: z.array(z.string()).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const [timeline] = await db
    .select()
    .from(timelines)
    .where(eq(timelines.projectId, id))
    .limit(1);
  const tracks = timeline ? await db.select().from(timelineTracks).where(eq(timelineTracks.timelineId, timeline.id)) : [];
  const clips = timeline ? await db.select().from(timelineClips).where(eq(timelineClips.timelineId, timeline.id)) : [];
  return NextResponse.json({ timeline, tracks, clips });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const body = z
    .object({
      width: z.string().optional(),
      aspectRatio: z.string().optional(),
      tracks: z.array(trackSchema),
      clips: z.array(clipSchema),
    })
    .safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const [timeline] = await db
    .select()
    .from(timelines)
    .where(eq(timelines.projectId, id))
    .limit(1);

  if (!timeline) return NextResponse.json({ error: "no_timeline" }, { status: 404 });

  // Upsert tracks
  const savedTracks = await Promise.all(
    body.data.tracks.map(async (t, idx) => {
      const payload = {
        timelineId: timeline.id,
        name: t.name,
        trackType: t.trackType,
        order: t.order ?? idx,
      };
      if (t.id) {
        const [row] = await db
          .update(timelineTracks)
          .set(payload)
          .where(eq(timelineTracks.id, t.id))
          .returning();
        if (row) return row;
      }
      return db.insert(timelineTracks).values({ id: newId(), ...payload }).returning().then((r) => r[0]);
    })
  );

  // Save clips for the timeline
  const savedClips = await Promise.all(
    body.data.clips.map(async (c) => {
      const payload = {
        timelineId: timeline.id,
        trackId: c.trackId,
        assetId: c.assetId,
        generationId: c.generationId,
        startTime: c.startTime,
        duration: c.duration,
        order: c.order,
        opacity: c.opacity,
        text: c.text,
        voiceoverId: c.voiceoverId,
        transitions: c.transitions ?? null,
      };
      if (c.id) {
        const [row] = await db
          .update(timelineClips)
          .set(payload)
          .where(eq(timelineClips.id, c.id))
          .returning();
        if (row) return row;
      }
      return db.insert(timelineClips).values({ id: newId(), ...payload }).returning().then((r) => r[0]);
    })
  );

  return NextResponse.json({ tracks: savedTracks, clips: savedClips });
}
