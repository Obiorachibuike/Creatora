import { count, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { generations, projects, timelineClips, timelineTracks, timelines } from "@/drizzle/schema";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth-server";
import { newId } from "@/lib/auth-utils";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);
  if (!project) return <p className="text-sm text-(--error)">Project not found.</p>;

  const [timeline] = project.timelineId
    ? await db.select().from(timelines).where(eq(timelines.id, project.timelineId)).limit(1)
    : [];
  const trackCount = timeline
    ? (
        await db
          .select({ value: count() })
          .from(timelineTracks)
          .where(eq(timelineTracks.timelineId, timeline.id))
          .limit(1)
      )[0] ?? { value: 0 }
    : { value: 0 };
  const gens = await db
    .select()
    .from(generations)
    .where(eq(generations.projectId, id))
    .orderBy(desc(generations.createdAt))
    .limit(10);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/projects"><Button variant="outline">← Projects</Button></Link>
        <h1 className="font-display text-3xl font-bold">{project.name}</h1>
        <Badge variant="orange">{project.status}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Timeline</CardTitle><CardDescription>Your edits. Your music. Your story.</CardDescription></CardHeader>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-(--foreground-muted)">Aspect ratio</span>
              <span>{timeline?.aspectRatio ?? "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-(--foreground-muted)">Resolution</span>
              <span>{timeline?.width ?? "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-(--foreground-muted)">Tracks</span>
              <span>{trackCount?.value ?? 0}</span>
            </div>
          </div>
          <Button asChild className="mt-4">
            <Link href={`/projects/${id}/editor`}>Open editor</Link>
          </Button>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent generations</CardTitle><CardDescription>AI generations linked to this project</CardDescription></CardHeader>
          <div className="space-y-3">
            {gens.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-(--surface-muted)">
                <span className="truncate text-sm">{g.prompt?.slice(0, 50) ?? "Untitled"}</span>
                <Badge variant="orange">{g.status}</Badge>
              </div>
            ))}
            {gens.length === 0 && <p className="text-sm text-(--foreground-muted)">No generations yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
