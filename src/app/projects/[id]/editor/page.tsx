import { eq } from "drizzle-orm";
import { db } from "@/db";
import { timelineClips, timelineTracks, timelines } from "@/drizzle/schema";
import { EditorClient } from "@/components/editor/EditorClient";
import { requireUser } from "@/lib/auth-server";

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const [timeline] = await db.select().from(timelines).where(eq(timelines.projectId, id)).limit(1);
  const tracks = timeline
    ? await db.select().from(timelineTracks).where(eq(timelineTracks.timelineId, timeline.id))
    : [];
  const clips = timeline ? await db.select().from(timelineClips).where(eq(timelineClips.timelineId, timeline.id)) : [];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Video Editor</h1>
      <EditorClient projectId={id} tracks={tracks} clips={clips} />
    </div>
  );
}
