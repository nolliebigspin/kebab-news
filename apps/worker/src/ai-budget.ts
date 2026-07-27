import { aiUsage, db } from "@kebab/db";
import { env } from "@kebab/env";
import { and, eq, gte, lt, sql } from "drizzle-orm";

export type AiBudgetRequest = {
  provider: "google" | "anthropic";
  task: string;
  model: string;
  maximumCostMicroUsd: number;
};

export type AiBudgetReservation = {
  id: string;
  maximumCostMicroUsd: number;
};

type BudgetOptions = {
  now?: Date;
  dailyBudgetMicroUsd?: number;
};

function utcDay(now: Date): { start: Date; end: Date } {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function configuredBudgetMicroUsd(): number {
  return Math.floor(env.AI_DAILY_BUDGET_USD * 1_000_000);
}

function resolveOptions(options: BudgetOptions): {
  now: Date;
  dailyBudgetMicroUsd: number;
} {
  return {
    now: options.now ?? new Date(),
    dailyBudgetMicroUsd: options.dailyBudgetMicroUsd ?? configuredBudgetMicroUsd(),
  };
}

function validateMoney(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer number of micro-USD`);
  }
}

/**
 * Atomically reserve the maximum cost of a paid model request. Postgres'
 * transaction-scoped advisory lock serializes reservations across worker and
 * operator processes without introducing a singleton budget row.
 */
export async function reserveAiBudget(
  request: AiBudgetRequest,
  options: BudgetOptions = {}
): Promise<AiBudgetReservation | null> {
  validateMoney(request.maximumCostMicroUsd, "maximumCostMicroUsd");
  const { now, dailyBudgetMicroUsd } = resolveOptions(options);
  validateMoney(dailyBudgetMicroUsd, "dailyBudgetMicroUsd");
  const { start, end } = utcDay(now);

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('kebab-news-ai-budget'))`);

    const [row] = await tx
      .select({
        committedMicroUsd: sql<number>`coalesce(sum(coalesce(${aiUsage.actualCostMicroUsd}, ${aiUsage.reservedCostMicroUsd})), 0)::int`,
      })
      .from(aiUsage)
      .where(and(gte(aiUsage.createdAt, start), lt(aiUsage.createdAt, end)));
    const committedMicroUsd = Number(row?.committedMicroUsd ?? 0);
    if (committedMicroUsd + request.maximumCostMicroUsd > dailyBudgetMicroUsd) return null;

    const [inserted] = await tx
      .insert(aiUsage)
      .values({
        provider: request.provider,
        task: request.task,
        model: request.model,
        reservedCostMicroUsd: request.maximumCostMicroUsd,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: aiUsage.id });

    return { id: inserted.id, maximumCostMicroUsd: request.maximumCostMicroUsd };
  });
}

export async function completeAiUsage(
  reservationId: string,
  usage: { inputTokens: number; outputTokens: number; costMicroUsd: number }
): Promise<void> {
  validateMoney(usage.inputTokens, "inputTokens");
  validateMoney(usage.outputTokens, "outputTokens");
  validateMoney(usage.costMicroUsd, "costMicroUsd");
  await db
    .update(aiUsage)
    .set({
      status: "completed",
      actualCostMicroUsd: usage.costMicroUsd,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      updatedAt: new Date(),
    })
    .where(eq(aiUsage.id, reservationId));
}

export async function failAiUsageReservation(reservationId: string): Promise<void> {
  await db
    .update(aiUsage)
    .set({ status: "failed", updatedAt: new Date() })
    .where(eq(aiUsage.id, reservationId));
}

export async function getAiBudgetStatus(options: BudgetOptions = {}): Promise<{
  budgetMicroUsd: number;
  committedMicroUsd: number;
  remainingMicroUsd: number;
}> {
  const { now, dailyBudgetMicroUsd } = resolveOptions(options);
  const { start, end } = utcDay(now);
  const [row] = await db
    .select({
      committedMicroUsd: sql<number>`coalesce(sum(coalesce(${aiUsage.actualCostMicroUsd}, ${aiUsage.reservedCostMicroUsd})), 0)::int`,
    })
    .from(aiUsage)
    .where(and(gte(aiUsage.createdAt, start), lt(aiUsage.createdAt, end)));
  const committedMicroUsd = Number(row?.committedMicroUsd ?? 0);
  return {
    budgetMicroUsd: dailyBudgetMicroUsd,
    committedMicroUsd,
    remainingMicroUsd: Math.max(0, dailyBudgetMicroUsd - committedMicroUsd),
  };
}
