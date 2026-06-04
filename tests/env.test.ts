import { describe, expect, it, vi } from "vitest";

describe("env validation (INFRA-09)", () => {
  it("throws when DATABASE_URL is missing", async () => {
    const original = process.env.DATABASE_URL;
    // @kebab/env loads the repo-root .env on import; dotenv won't overwrite a
    // var that is already present. Set it to "" (present but empty) so the
    // reload can't refill it — emptyStringAsUndefined then treats it as missing.
    process.env.DATABASE_URL = "";
    delete process.env.SKIP_ENV_VALIDATION;
    vi.resetModules();
    try {
      await expect(import("@kebab/env")).rejects.toThrow();
    } finally {
      if (original !== undefined) process.env.DATABASE_URL = original;
      else delete process.env.DATABASE_URL;
      vi.resetModules();
    }
  });
});
