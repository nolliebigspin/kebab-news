import { describe, expect, it, vi } from "vitest";

describe("env validation (INFRA-09)", () => {
  it("throws when DATABASE_URL is missing", async () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    delete process.env.SKIP_ENV_VALIDATION;
    vi.resetModules();
    try {
      await expect(import("@/lib/env")).rejects.toThrow();
    } finally {
      if (original !== undefined) process.env.DATABASE_URL = original;
      vi.resetModules();
    }
  });
});
