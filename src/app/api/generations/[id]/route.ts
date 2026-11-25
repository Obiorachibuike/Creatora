import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { generationEvents, generations } from "@/drizzle/schema";
import { newId } from "@/lib/auth-utils";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const generation = await db
    .select()
    .from(generations)
    .where(eq(generations.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!generation) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const events = await db
    .select()
    .from(generationEvents)
    .where(eq(generationEvents.generationId, id))
    .orderBy(generationEvents.createdAt);
  return NextResponse.json({ generation, events });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [generation] = await db
    .select()
    .from(generations)
    .where(eq(generations.id, id))
    .limit(1);
  if (!generation) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await db
    .update(generations)
    .set({ status: "cancelled" })
    .where(eq(generations.id, id));
  return NextResponse.json({ ok: true });
}

export async function emitEvent(generationId: string, type: string, message?: string) {
  await db.insert(generationEvents).values({ id: newId(), generationId, eventType: type, message });
}
