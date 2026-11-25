import { count, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { generations, projects } from "@/drizzle/schema";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { NewProjectButton } from "@/components/NewProjectButton";
import { Button } from "@/components/ui/Button";
import { getMembershipsForUser, requireUser } from "@/lib/auth-server";

export default async function ProjectsPage() {
  const user = await requireUser();
  const memberships = await getMembershipsForUser(user.id);
  const workspaceId = memberships[0]?.workspaceId;

  let list: typeof projects.$inferSelect[] = [];
  if (workspaceId) {
    list = await db
      .select()
      .from(projects)
      .where(eq(projects.workspaceId, workspaceId))
      .orderBy(desc(projects.updatedAt));
  }

  const genCounts = workspaceId
    ? await db
        .select({ projectId: generations.projectId, value: count() })
        .from(generations)
        .where(eq(generations.workspaceId, workspaceId))
        .groupBy(generations.projectId)
    : [];
  const countMap = new Map(genCounts.map((g) => [g.projectId ?? "", g.value ?? 0]));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Projects</h1>
          <p className="text-sm text-(--foreground-muted)">Organize and manage your creative work.</p>
        </div>
        <NewProjectButton />
      </div>

      {list.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No projects yet</CardTitle>
            <CardDescription>
              Create your first project to start generating AI video, images and more.
            </CardDescription>
          </CardHeader>
          <Button asChild className="mx-auto block">
            <Link href="/video-studio">Start generating</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="group block">
              <Card className="transition-colors hover:border-(--brand-primary)">
                <CardHeader>
                  <CardTitle>{p.name}</CardTitle>
                  <CardDescription>{p.type.toUpperCase()} · {p.status}</CardDescription>
                </CardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-(--foreground-muted)">
                    {countMap.get(p.id) ?? 0} generations · {p.updatedAt.toLocaleDateString("en-US")}
                  </span>
                  <Badge variant={p.status === "archived" ? "muted" : "orange"}>{p.status}</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
