import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe(".env.example (INFRA-09)", () => {
  it("declares every server var validated by env.ts", () => {
    const example = readFileSync(".env.example", "utf-8");
    const required = [
      "DATABASE_URL",
      "NEON_AUTH_BASE_URL",
      "NEON_AUTH_COOKIE_SECRET",
      "QSTASH_URL",
      "QSTASH_TOKEN",
      "QSTASH_CURRENT_SIGNING_KEY",
      "QSTASH_NEXT_SIGNING_KEY",
      "ANTHROPIC_API_KEY",
      "NEXT_PUBLIC_APP_URL",
    ];
    for (const key of required) {
      expect(example).toMatch(new RegExp(`^${key}=`, "m"));
    }
  });

  it("does NOT contain BETTER_AUTH_* vars (Neon Auth replaces them per RESEARCH §7)", () => {
    const example = readFileSync(".env.example", "utf-8");
    expect(example).not.toMatch(/^BETTER_AUTH_/m);
  });
});
