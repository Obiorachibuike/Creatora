import { count, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { assets, exportsTable, generations, projects } from "@/drizzle/schema";
import { formatCredits, parseDecimal } from "@/lib/credits";

import { getMembershipsForUser, requireUser } from "@/lib/auth-server";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDistanceToNow } from "@/lib/utils-date";

export default async function DashboardPage() {
  const user = await requireUser();
  const memberships = await getMembershipsForUser(user.id);
  const workspaceId = memberships[0]?.workspaceId;
  if (!workspaceId) return <p>No workspace found.</p>;

  const [projectCount] = await db
    .select({ value: count() })
    .from(projects)
    .where(eq(projects.workspaceId, workspaceId));
  const [genCount] = await db
    .select({ value: count() })
    .from(generations)
    .where(eq(generations.workspaceId, workspaceId));
  const [assetCount] = await db
    .select({ value: count() })
    .from(assets)
    .where(eq(assets.workspaceId, workspaceId));

  const [recentProjects, recentGenerations, recentExports] = await Promise.all([
    db
      .select()
      .from(projects)
      .where(eq(projects.workspaceId, workspaceId))
      .orderBy(desc(projects.updatedAt))
      .limit(5),
    db
      .select()
      .from(generations)
      .where(eq(generations.workspaceId, workspaceId))
      .orderBy(desc(generations.updatedAt))
      .limit(5),
    db
      .select()
      .from(exportsTable)
      .where(eq(exportsTable.workspaceId, workspaceId))
      .orderBy(desc(exportsTable.createdAt))
      .limit(5),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Projects" value={projectCount?.value ?? 0} href="/projects" />
        <StatCard title="Generations" value={genCount?.value ?? 0} href="/video-studio" />
        <StatCard title="Assets" value={assetCount?.value ?? 0} href="/ai-image" />
        <StatCard title="Exports" value={recentExports.length} href="/projects" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent projects</CardTitle><CardDescription>Latest creations in your workspace</CardDescription></CardHeader>
          <div className="space-y-3">
            {recentProjects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="block">
                <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-(--surface-muted)">
                  <span className="truncate font-medium">{p.name}</span>
                  <Badge>{p.status}</Badge>
                </div>
              </Link>
            ))}
            {recentProjects.length === 0 && <p className="text-sm text-(--foreground-muted)">No projects yet.</p>}
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Generation activity</CardTitle><CardDescription>Recent AI generations</CardDescription></CardHeader>
          <div className="space-y-3">
            {recentGenerations.map((g) => (
              <div key={g.id} className="rounded-lg px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-medium">{g.prompt?.slice(0, 40) ?? "Untitled"}</span>
                  <Badge variant="orange">{g.status}</Badge>
                </div>
                <p className="text-xs text-(--foreground-muted)">
                  {g.model} · {g.updatedAt.toLocaleString("en-US")}
                </p>
              </div>
            ))}
            {recentGenerations.length === 0 && <p className="text-sm text-(--foreground-muted)">No generations yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, href }: { title: string; value: number; href?: string }) {
  return (
    <Link href={href ?? "/"} className="block">
      <Card className="transition-colors hover:border-(--brand-primary)">
        <p className="text-xs uppercase tracking-wide text-(--foreground-muted)">{title}</p>
        <p className="mt-1 font-display text-3xl font-bold">{value}</p>
      </Card>
    </Link>
  );
}
