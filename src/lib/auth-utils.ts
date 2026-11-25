import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { creditAccounts, memberships, users, workspaces } from "@/drizzle/schema";

export const AUTH_CODE = {
  USERNAME_TAKEN: "username_taken",
  EMAIL_TAKEN: "email_taken",
  PASSWORD_TOO_SHORT: "password_too_short",
  UNAUTHORIZED: "unauthorized",
  NOT_FOUND: "not_found",
  FORBIDDEN: "forbidden",
} as const;

export function newId() {
  return randomUUID();
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "workspace";
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function findUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);
  return user ?? null;
}

export async function emailExists(email: string) {
  return (await findUserByEmail(email)) !== null;
}

export async function createAccount({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name?: string;
}) {
  const cleanEmail = email.trim().toLowerCase();
  if (await emailExists(cleanEmail)) return null;
  if (!password || password.length < 6) return null;

  const id = newId();
  const [user] = await db
    .insert(users)
    .values({
      id,
      name: name?.trim() || null,
      email: cleanEmail,
      passwordHash: await hashPassword(password),
    })
    .returning();

  if (!user) return null;

  const [workspace] = await db
    .insert(workspaces)
    .values({
      id: newId(),
      name: name?.trim() || cleanEmail.split("@")[0],
      slug: slugify(`${id}-${new Date().getTime()}`),
      isPersonal: true,
      createdBy: id,
    })
    .returning();

  await db.insert(memberships).values({
    id: newId(),
    userId: id,
    workspaceId: workspace.id,
    role: "owner",
    acceptedAt: new Date(),
  });

  await db.insert(creditAccounts).values({
    id: newId(),
    workspaceId: workspace.id,
    ownerId: id,
    balance: "5",
    creditsUsed: "0",
    totalSpent: "0",
  });

  return user;
}

/** Used by NextAuth credentials provider. Returns a serializable user for the session. */
export async function authorizeUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const user = await findUserByEmail(email);
  if (!user?.passwordHash) return null;
  if (!(await verifyPassword(password, user.passwordHash))) return null;
  return {
    id: user.id,
    name: user.name ?? user.email,
    email: user.email,
  };
}

/** Returns the user row + membership info. Server-side app authorization helper. */
export async function requireUser() {
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await findUserByEmail(session.user.email);
  return user;
}
