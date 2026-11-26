import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { exportsTable } from "@/drizzle/schema";
import { Badge } from "@/components/ui/Badge";
import { getMembershipsForUser, requireUser } from "@/lib/auth-server";

export default async function ExportsPage() {
  const user = await requireUser();
  const memberships = await getMembershipsForUser(user.id);
  const rows = memberships[0]
    ? await db
        .select()
        .from(exportsTable)
        .where(eq(exportsTable.workspaceId, memberships[0].workspaceId))
        .orderBy(desc(exportsTable.createdAt))
        .limit(20)
    : [];
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Exports</h1>
      {rows.length === 0 ? (
        <p className="text-sm text-(--foreground-muted)">No exports yet.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-(--border) text-(--foreground-muted)">
            <tr>
              <th className="py-2 pr-4">Project</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">File</th>
              <th className="py-2">Platform</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-(--border)">
                <td className="py-2 pr-4">{r.projectId.slice(0, 8)}</td>
                <td className="py-2 pr-4"><Badge>{r.status}</Badge></td>
                <td className="py-2 pr-4">{r.fileUrl ?? "-"}</td>
                <td className="py-2">{r.platform ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
