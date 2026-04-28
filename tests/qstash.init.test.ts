import { describe, expect, it } from "vitest";

describe("QStash client init (INFRA-08)", () => {
  it("imports without throwing on missing token", async () => {
    const original = process.env.QSTASH_TOKEN;
    process.env.QSTASH_TOKEN = "";
    process.env.SKIP_ENV_VALIDATION = "1";
    try {
      await expect(import("@/lib/qstash")).resolves.toBeDefined();
    } finally {
      process.env.QSTASH_TOKEN = original;
      delete process.env.SKIP_ENV_VALIDATION;
    }
  });
});
