import { and, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { memberships, projects, users, workspaces } from "@/drizzle/schema";

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
  }
}

export async function requireUser(): Promise<UserRow> {
  const { auth } = await import("@/auth");
  const session = await auth();
  const user = session?.user?.email
    ? await db
        .select()
        .from(users)
        .where(eq(users.email, session.user.email))
        .limit(1)
        .then((r) => r[0])
    : null;
  if (!user) {
    throw new AuthError("Unauthorized", "UNAUTHORIZED");
  }
  return user;
}

export type UserRow = typeof users.$inferSelect;

export async function getMembershipsForUser(userId: string) {
  return db.select().from(memberships).where(eq(memberships.userId, userId));
}

export async function getMembership(userId: string, workspaceId: string) {
  const [row] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.workspaceId, workspaceId)))
    .limit(1);
  return row;
}

export async function requireMembership(userId: string, workspaceId: string) {
  const m = await getMembership(userId, workspaceId);
  if (!m) throw new AuthError("Forbidden", "FORBIDDEN");
  return m;
}

export async function getWorkspace(workspaceId: string) {
  const [ws] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);
  return ws;
}

export async function getWorkspaceProjects(workspaceId: string, userId?: string) {
  const cond = userId
    ? or(eq(projects.userId, userId), eq(projects.workspaceId, workspaceId))
    : undefined;
  return db.select().from(projects).where(cond ?? eq(projects.workspaceId, workspaceId));
}

export function isOwnerOrAdmin(m: { role: string }) {
  return ["owner", "admin"].includes(m.role);
}

export async function auditLog(entry: {
  userId?: string;
  workspaceId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ip?: string;
}) {
  const { newId } = await import("@/lib/auth-utils");
  const { auditLogs } = await import("@/drizzle/schema");
  await db
    .insert(auditLogs)
    .values({ id: newId(), ...entry })
    .catch(() => undefined); // audit failures must not break the app
}
