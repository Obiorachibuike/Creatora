"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/drizzle/schema";
import { getMembershipsForUser, requireUser } from "@/lib/auth-server";
import { newId, slugify } from "@/lib/auth-utils";

function slugFrom(name: string, id: string) {
  return slugify(`${name}-${id.slice(0, 8)}`);
}

export async function createProject(
  formData: FormData
): Promise<{ ok: boolean; error?: string; projectId?: string }> {
  const name = (formData.get("name") as string | null)?.trim();
  const type = (formData.get("type") as string | null) ?? "video";
  if (!name) return { ok: false, error: "name_required" };

  const user = await requireUser();
  const memberships = await getMembershipsForUser(user.id);
  const workspaceId = memberships[0]?.workspaceId;
  if (!workspaceId) return { ok: false, error: "no_workspace" };

  const [existing] = await db
    .select({ slug: projects.slug })
    .from(projects)
    .where(eq(projects.name, name));
  const slug = existing ? `${slugFrom(name, existing.slug)}-${Date.now().toString(36)}` : slugFrom(name, newId());

  const [project] = await db
    .insert(projects)
    .values({
      id: newId(),
      workspaceId,
      userId: user.id,
      name,
      slug,
      type,
    })
    .returning();
  return { ok: true, projectId: project.id };
}

export async function deleteProject(id: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const [project] = await db
    .select().from(projects)
    .where(eq(projects.id, id))
    .limit(1);
  if (!project) return { ok: false };
  if (project.userId && project.userId !== user.id) return { ok: false };
  await db.delete(projects).where(eq(projects.id, id));
  return { ok: true };
}
