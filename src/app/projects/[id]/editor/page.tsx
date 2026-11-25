import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { timelineClips, timelineTracks, timelines } from "@/drizzle/schema";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { requireUser } from "@/lib/auth-server";

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const [timeline] = await db.select().from(timelines).where(eq(timelines.projectId, id)).limit(1);
  const tracks = timeline ? await db.select().from(timelineTracks).where(eq(timelineTracks.timelineId, timeline.id)).orderBy(timelineTracks.order) : [];
  const clips = timeline ? await db.select().from(timelineClips).where(eq(timelineClips.timelineId, timeline.id)).orderBy(desc(timelineClips.startTime)) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold">Video Editor</h1>
        <Button variant="outline">Undo</Button>
        <Button variant="outline">Redo</Button>
        <Button variant="outline">Zoom out</Button>
        <Button variant="outline">Zoom in</Button>
        <Button variant="outline">Export</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Timeline</CardTitle><CardDescription>Tracks: video, audio, text — drag to reorder via API.</CardDescription></CardHeader>
        <div className="space-y-2">
          {tracks.map((t) => (
            <div key={t.id} className="rounded border border-(--border) p-3">
              <div className="flex items-center gap-3">
                <span className="font-medium">{t.name}</span>
                <span className="text-xs text-(--foreground-muted)">{t.trackType} · order {t.order}</span>
              </div>
            </div>
          ))}
          {tracks.length === 0 && <p className="text-sm text-(--foreground-muted)">No tracks yet.</p>}
        </div>

        <div className="mt-4 space-y-2">
          <Label>Clips</Label>
          {clips.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded border border-(--border) p-3">
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {c.text ? `Text: ${c.text}` : c.assetId ? `Asset ${c.assetId.slice(0, 8)}` : "Clip"}
                </p>
                <p className="text-xs text-(--foreground-muted)">
                  start {c.startTime.toFixed(1)}s · duration {c.duration.toFixed(1)}s · opacity {c.opacity}
                </p>
              </div>
              <Button variant="outline" size="sm">Play</Button>
            </div>
          ))}
          {clips.length === 0 && <p className="text-sm text-(--foreground-muted)">No clips yet.</p>}
        </div>
      </Card>
    </div>
  );
}
