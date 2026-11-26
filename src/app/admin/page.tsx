import { count, desc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { assets, auditLogs, generations, subscriptions, users, workspaces } from "@/drizzle/schema";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireUser } from "@/lib/auth-server";
import { ffmpegAvailable } from "@/lib/ffmpeg/export";
import { getProviders } from "@/lib/ai/registry";

export default async function AdminPage() {
  const user = await requireUser();
  if (user.role !== "admin") {
    return (
      <div className="rounded-xl border border-(--error) bg-(--error)/10 p-4 text-sm text-(--error)">
        Admins only. You are not an administrator.
      </div>
    );
  }

  const userCount = await db.select({ value: count() }).from(users);
  const wsCount = await db.select({ value: count() }).from(workspaces);
  const genCount = await db.select({ value: count() }).from(generations);
  const assetCount = await db.select({ value: count() }).from(assets);

  const recentGens = await db
    .select()
    .from(generations)
    .orderBy(desc(generations.createdAt))
    .limit(5);
  const recentAudit = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(5);
  const subPlans = await db.select({ plan: subscriptions.plan, value: count() }).from(subscriptions).groupBy(subscriptions.plan);

  const providers = await getProviders();
  const ffmpegOK = await ffmpegAvailable();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Administration</h1>
          <p className="text-sm text-(--foreground-muted)">Users, providers, generation monitoring, subscriptions, audit.</p>
        </div>
        <Button asChild><Link href="/projects">Dashboard</Link></Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Users" value={userCount[0]?.value ?? 0} />
        <StatCard title="Workspaces" value={wsCount[0]?.value ?? 0} />
        <StatCard title="Generations" value={genCount[0]?.value ?? 0} />
        <StatCard title="Assets" value={assetCount[0]?.value ?? 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>AI Providers & Models</CardTitle><CardDescription>Part 5 registry (from ai_providers/ai_models)</CardDescription></CardHeader>
          <ul className="space-y-2 text-sm">
            {providers.map((p) => (
              <li key={p.id} className="rounded-lg border border-(--border) p-2">
                <span className="font-medium">{p.slug}</span> <span className="text-(--foreground-muted)">({p.name})</span>
              </li>
            ))}
            {providers.length === 0 && <li className="text-(--foreground-muted)">No providers configured.</li>}
          </ul>
          <p className="mt-2 text-xs text-(--foreground-muted)">FFmpeg available: {ffmpegOK ? "yes" : "no"}</p>
        </Card>

        <Card>
          <CardHeader><CardTitle>Subscriptions</CardTitle><CardDescription>Plans (Free/Creator/Pro/Business/Agency)</CardDescription></CardHeader>
          <table className="w-full text-left text-sm">
            <thead className="text-(--foreground-muted)"><tr><th className="py-1">Plan</th><th className="py-1">Count</th></tr></thead>
            <tbody>
              {subPlans.map((r) => (
                <tr key={r.plan}><td className="py-1">{r.plan}</td><td className="py-1">{r.value}</td></tr>
              ))}
              {subPlans.length === 0 && <tr><td>none</td><td>0</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Generation monitoring</CardTitle><CardDescription>Recent generations across the workspace</CardDescription></CardHeader>
          <div className="space-y-2">
            {recentGens.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm">
                <span className="truncate">{g.model} · {g.prompt?.slice(0, 40) ?? "Untitled"}</span>
                <Badge variant={g.status === "completed" ? "green" : g.status === "failed" ? "red" : "orange"}>{g.status}</Badge>
              </div>
            ))}
            {recentGens.length === 0 && <p className="text-sm text-(--foreground-muted)">No generations.</p>}
          </div>
        </Card>
        <Card>
          <CardHeader><CardTitle>Audit log</CardTitle><CardDescription>Latest activity</CardDescription></CardHeader>
          <div className="space-y-2">
            {recentAudit.map((l) => (
              <div key={l.id} className="rounded-lg border border-(--border) px-2 py-2 text-xs">
                <p>{l.action}</p>
                <p className="text-(--foreground-muted)">{l.resourceId?.slice(0, 8)} · {l.createdAt.toLocaleString("en-US")}</p>
              </div>
            ))}
            {recentAudit.length === 0 && <p className="text-sm text-(--foreground-muted)">No audit entries.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-(--foreground-muted)">{title}</p>
      <p className="font-display text-2xl font-bold">{value}</p>
    </Card>
  );
}
