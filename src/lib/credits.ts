import { eq } from "drizzle-orm";
import { db } from "@/db";
import { creditAccounts, creditTransactions } from "@/drizzle/schema";
import { newId } from "@/lib/auth-utils";

/** Minimal decimal-string helpers for the credit system (Part 8). */
export function toDecimalString(value: number, dp = 6) {
  return value.toFixed(dp);
}

export function parseDecimal(value: string | null | undefined): number {
  return parseFloat(value ?? "0") || 0;
}

export function formatCredits(value: string | number | null | undefined) {
  return `${toDecimalString(parseDecimal(value as string | null | undefined))} credits`;
}

export async function getOrCreateAccount(workspaceId: string, ownerId: string) {
  const [existing] = await db
    .select()
    .from(creditAccounts)
    .where(eq(creditAccounts.workspaceId, workspaceId))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(creditAccounts)
    .values({ id: newId(), workspaceId, ownerId, balance: "10", creditsUsed: "0", totalSpent: "0" })
    .returning();
  return created;
}

export async function reserveCredits(
  account: { id: string; balance: string; workspaceId: string },
  amount: number,
  context: { generationId?: string; reason: string }
): Promise<boolean> {
  const balance = parseDecimal(account.balance);
  if (balance < amount) return false;
  await db
    .insert(creditTransactions)
    .values({
      id: newId(),
      accountId: account.id,
      type: "debited",
      amount: toDecimalString(amount),
      reason: context.reason,
      generationId: context.generationId,
    })
    .onConflictDoNothing();
  return true;
}

export async function settleCredits(
  account: { id: string; balance: string; creditsUsed: string; workspaceId: string },
  amount: number
): Promise<void> {
  if (amount <= 0) return;
  await db
    .update(creditAccounts)
    .set({
      balance: toDecimalString(parseDecimal(account.balance) - amount),
      creditsUsed: toDecimalString(parseDecimal(account.creditsUsed) + amount),
      updatedAt: new Date(),
    })
    .where(eq(creditAccounts.id, account.id));
}

export async function refundCredits(account: { id: string }, amount: number, reason: string) {
  if (amount <= 0) return;
  await db
    .insert(creditTransactions)
    .values({
      id: newId(),
      accountId: account.id,
      type: "refunded",
      amount: toDecimalString(amount),
      reason,
    })
    .onConflictDoNothing();
  const accountRow = await db
    .select()
    .from(creditAccounts)
    .where(eq(creditAccounts.id, account.id))
    .limit(1)
    .then((r) => r[0]);
  if (accountRow) {
    await db
      .update(creditAccounts)
      .set({ balance: toDecimalString(parseDecimal(accountRow.balance) + amount) })
      .where(eq(creditAccounts.id, account.id));
  }
}
