import { beforeEach, describe, expect, it } from "vitest";

import { _resetRateLimit, rateLimit } from "../apps/web/lib/rate-limit";

beforeEach(() => {
  _resetRateLimit();
});

describe("rateLimit", () => {
  it("allows up to `limit` calls within the window", () => {
    for (let i = 0; i < 3; i++) {
      expect(rateLimit("k", 3, 1000).ok).toBe(true);
    }
  });

  it("blocks the (limit + 1)-th call within the window", () => {
    for (let i = 0; i < 3; i++) rateLimit("k", 3, 1000);
    const result = rateLimit("k", 3, 1000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.retryAfterMs).toBeGreaterThanOrEqual(0);
  });

  it("scopes counters per key", () => {
    for (let i = 0; i < 3; i++) rateLimit("a", 3, 1000);
    expect(rateLimit("a", 3, 1000).ok).toBe(false);
    expect(rateLimit("b", 3, 1000).ok).toBe(true);
  });

  it("allows new calls after the window elapses", async () => {
    for (let i = 0; i < 2; i++) rateLimit("k", 2, 50);
    expect(rateLimit("k", 2, 50).ok).toBe(false);
    await new Promise((r) => setTimeout(r, 80));
    expect(rateLimit("k", 2, 50).ok).toBe(true);
  });
});
