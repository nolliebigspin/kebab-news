import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe(".env.example", () => {
  it("declares every server var validated by env.ts", () => {
    const example = readFileSync(".env.example", "utf-8");
    const required = [
      "DATABASE_URL",
      "ANTHROPIC_API_KEY",
      "VOYAGE_API_KEY",
      "CRON_SECRET",
      "NEXT_PUBLIC_APP_URL",
    ];
    for (const key of required) {
      expect(example).toMatch(new RegExp(`^${key}=`, "m"));
    }
  });

  it("does not carry over removed v0.2 scaffolding", () => {
    const example = readFileSync(".env.example", "utf-8");
    expect(example).not.toMatch(/^QSTASH_/m);
    expect(example).not.toMatch(/^NEON_AUTH_/m);
    expect(example).not.toMatch(/^BETTER_AUTH_/m);
  });
});
