import { aiUsage, db } from "@kebab/db";
import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  completeAiUsage,
  getAiBudgetStatus,
  reserveAiBudget,
} from "../../apps/worker/src/ai-budget";

const TASK = "__ai_budget_test__";
const NOW = new Date("2099-07-27T12:00:00Z");

async function cleanup() {
  await db.delete(aiUsage).where(eq(aiUsage.task, TASK));
}

beforeEach(cleanup);
afterAll(cleanup);

describe("daily AI budget", () => {
  it("reserves atomically and releases unused capacity after actual usage is known", async () => {
    const first = await reserveAiBudget(
      {
        provider: "google",
        task: TASK,
        model: "test-model",
        maximumCostMicroUsd: 120_000,
      },
      { now: NOW, dailyBudgetMicroUsd: 200_000 }
    );
    expect(first).not.toBeNull();

    const blocked = await reserveAiBudget(
      {
        provider: "google",
        task: TASK,
        model: "test-model",
        maximumCostMicroUsd: 90_000,
      },
      { now: NOW, dailyBudgetMicroUsd: 200_000 }
    );
    expect(blocked).toBeNull();

    await completeAiUsage(first?.id as string, {
      inputTokens: 100,
      outputTokens: 25,
      costMicroUsd: 20_000,
    });

    const second = await reserveAiBudget(
      {
        provider: "anthropic",
        task: TASK,
        model: "test-model",
        maximumCostMicroUsd: 90_000,
      },
      { now: NOW, dailyBudgetMicroUsd: 200_000 }
    );
    expect(second).not.toBeNull();

    await expect(getAiBudgetStatus({ now: NOW, dailyBudgetMicroUsd: 200_000 })).resolves.toEqual({
      budgetMicroUsd: 200_000,
      committedMicroUsd: 110_000,
      remainingMicroUsd: 90_000,
    });
  });
});
