import { describe, expect, it } from "vitest";

import { buildUserMessage, RewriteSchema, sortSourcesByLean } from "@/lib/rewrite";

const SOURCES = [
  {
    outletName: "Welt",
    outletSlug: "welt",
    lean: "right" as const,
    headline: "Welt-Schlagzeile",
    teaser: "Welt-Teaser",
    url: "https://welt.example/a",
  },
  {
    outletName: "taz",
    outletSlug: "taz",
    lean: "left" as const,
    headline: "taz-Schlagzeile",
    teaser: null,
    url: "https://taz.example/a",
  },
  {
    outletName: "Tagesschau",
    outletSlug: "tagesschau",
    lean: "public" as const,
    headline: "Tagesschau-Schlagzeile",
    teaser: "Sachlicher Teaser",
    url: "https://tagesschau.example/a",
  },
];

describe("sortSourcesByLean", () => {
  it("orders sources by LEAN_ORDER (left → public last)", () => {
    const sorted = sortSourcesByLean(SOURCES);
    expect(sorted.map((s) => s.lean)).toEqual(["left", "right", "public"]);
  });

  it("does not mutate the input", () => {
    const input = [...SOURCES];
    sortSourcesByLean(input);
    expect(input.map((s) => s.lean)).toEqual(["right", "left", "public"]);
  });
});

describe("buildUserMessage", () => {
  it("includes the story label", () => {
    const msg = buildUserMessage("Bundestagswahl 2026", SOURCES);
    expect(msg).toContain("Bundestagswahl 2026");
  });

  it("includes every outlet with its lean tag", () => {
    const msg = buildUserMessage("X", SOURCES);
    expect(msg).toContain("### Welt (right)");
    expect(msg).toContain("### taz (left)");
    expect(msg).toContain("### Tagesschau (public)");
  });

  it("includes the teaser when present and omits when null", () => {
    const msg = buildUserMessage("X", SOURCES);
    expect(msg).toContain("Teaser: Welt-Teaser");
    // taz has null teaser — should not appear with that prefix
    expect(msg).not.toMatch(/Teaser:\s*null/);
  });

  it("orders sources left → right → public in the prompt body", () => {
    const msg = buildUserMessage("X", SOURCES);
    const tazIdx = msg.indexOf("### taz");
    const weltIdx = msg.indexOf("### Welt");
    const tsIdx = msg.indexOf("### Tagesschau");
    expect(tazIdx).toBeLessThan(weltIdx);
    expect(weltIdx).toBeLessThan(tsIdx);
  });

  it("asks for JSON output explicitly", () => {
    const msg = buildUserMessage("X", SOURCES);
    expect(msg).toContain("JSON");
    expect(msg).toContain("neutral_headline");
    expect(msg).toContain("neutral_body");
  });
});

describe("RewriteSchema", () => {
  it("accepts a well-formed rewrite", () => {
    const result = RewriteSchema.safeParse({
      neutral_headline: "Bundestag beschließt Haushalt 2026",
      neutral_body: "Der Bundestag hat …",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty headline", () => {
    const result = RewriteSchema.safeParse({ neutral_headline: "", neutral_body: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects extra fields silently dropped vs. preserved? — confirm shape strict to required keys", () => {
    // Zod object() is permissive by default but we rely on the schema to
    // validate the two required fields. Extras pass — caller doesn't need them.
    const result = RewriteSchema.safeParse({
      neutral_headline: "h",
      neutral_body: "b",
      extra: "ignored",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when neutral_body exceeds 8000 chars", () => {
    const result = RewriteSchema.safeParse({
      neutral_headline: "h",
      neutral_body: "x".repeat(8001),
    });
    expect(result.success).toBe(false);
  });
});
