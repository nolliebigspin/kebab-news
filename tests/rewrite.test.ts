import {
  buildUserMessage,
  RewriteSchema,
  sortSourcesByLean,
  validateRewriteSources,
} from "@kebab/core";
import { describe, expect, it } from "vitest";

const SOURCES = [
  {
    id: "source-welt",
    outletName: "Welt",
    outletSlug: "welt",
    lean: "right" as const,
    headline: "Welt-Schlagzeile",
    teaser: "Welt-Teaser",
    url: "https://welt.example/a",
    sourceKind: "secondary" as const,
  },
  {
    id: "source-taz",
    outletName: "taz",
    outletSlug: "taz",
    lean: "left" as const,
    headline: "taz-Schlagzeile",
    teaser: null,
    url: "https://taz.example/a",
    sourceKind: "secondary" as const,
  },
  {
    id: "source-tagesschau",
    outletName: "Tagesschau",
    outletSlug: "tagesschau",
    lean: "public" as const,
    headline: "Tagesschau-Schlagzeile",
    teaser: "Sachlicher Teaser",
    url: "https://tagesschau.example/a",
    sourceKind: "secondary" as const,
  },
];

const STRUCTURED_SECTIONS = {
  change_summary: null,
  short_summary: "Die wichtigsten Entwicklungen in Kürze.",
  body: [{ id: "overview", text: "Der Bundestag hat über den Haushalt beraten." }],
  confirmed_facts: [
    {
      text: "Die Beratung fand statt.",
      source_ids: ["source-taz", "source-welt"],
      confidence: "high",
    },
  ],
  uncertainties: [],
  differences: [],
  annotations: [],
};

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
    expect(msg).toContain("### Welt (right, secondary, source_id: source-welt)");
    expect(msg).toContain("### taz (left, secondary, source_id: source-taz)");
    expect(msg).toContain("### Tagesschau (public, secondary, source_id: source-tagesschau)");
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
    expect(msg).toContain("strukturierten Format");
  });

  it("gives update generations the previous version as comparison context", () => {
    const msg = buildUserMessage("X", SOURCES, {
      headline: "Bisherige Überschrift",
      shortSummary: "Bisherige Kurzfassung.",
      body: "Bisheriger Langtext.",
    });

    expect(msg).toContain("Bisherige Überschrift");
    expect(msg).toContain("welche neuen Informationen");
  });
});

describe("RewriteSchema", () => {
  it("accepts a well-formed rewrite", () => {
    const result = RewriteSchema.safeParse({
      neutral_headline: "Bundestag beschließt Haushalt 2026",
      neutral_body: "Der Bundestag hat …",
      ...STRUCTURED_SECTIONS,
    });
    expect(result.success).toBe(true);
  });

  it("rejects legacy free text without sourced sections", () => {
    const result = RewriteSchema.safeParse({
      neutral_headline: "Bundestag beschließt Haushalt 2026",
      neutral_body: "Der Bundestag hat …",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty headline", () => {
    const result = RewriteSchema.safeParse({
      neutral_headline: "",
      neutral_body: "x",
      ...STRUCTURED_SECTIONS,
    });
    expect(result.success).toBe(false);
  });

  it("rejects extra fields silently dropped vs. preserved? — confirm shape strict to required keys", () => {
    // Zod object() is permissive by default but we rely on the schema to
    // validate the two required fields. Extras pass — caller doesn't need them.
    const result = RewriteSchema.safeParse({
      neutral_headline: "h",
      neutral_body: "b",
      ...STRUCTURED_SECTIONS,
      extra: "ignored",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when neutral_body exceeds 8000 chars", () => {
    const result = RewriteSchema.safeParse({
      neutral_headline: "h",
      neutral_body: "x".repeat(8001),
      ...STRUCTURED_SECTIONS,
    });
    expect(result.success).toBe(false);
  });
});

describe("validateRewriteSources", () => {
  it("rejects source references that were not provided to the model", () => {
    const parsed = RewriteSchema.parse({
      neutral_headline: "h",
      neutral_body: "b",
      ...STRUCTURED_SECTIONS,
      confirmed_facts: [{ text: "Unbelegt", source_ids: ["invented-source"], confidence: "high" }],
    });

    expect(validateRewriteSources(parsed, SOURCES)).toBe(false);
  });

  it("accepts references to provided source ids", () => {
    const parsed = RewriteSchema.parse({
      neutral_headline: "h",
      neutral_body: "b",
      ...STRUCTURED_SECTIONS,
    });

    expect(validateRewriteSources(parsed, SOURCES)).toBe(true);
  });

  it("requires two independent outlets unless the sole source is primary", () => {
    const parsed = RewriteSchema.parse({
      neutral_headline: "h",
      neutral_body: "b",
      ...STRUCTURED_SECTIONS,
      confirmed_facts: [
        { text: "Nur einmal berichtet", source_ids: ["source-taz"], confidence: "high" },
      ],
    });

    expect(validateRewriteSources(parsed, SOURCES)).toBe(false);
    const duplicatedPublisher = RewriteSchema.parse({
      neutral_headline: "h",
      neutral_body: "b",
      ...STRUCTURED_SECTIONS,
      confirmed_facts: [
        {
          text: "Zwei Artikel desselben Publishers",
          source_ids: ["source-taz", "source-taz-update"],
          confidence: "high",
        },
      ],
    });
    expect(
      validateRewriteSources(duplicatedPublisher, [
        ...SOURCES,
        { ...SOURCES[1], id: "source-taz-update" },
      ])
    ).toBe(false);
    expect(
      validateRewriteSources(parsed, [
        SOURCES[0],
        { ...SOURCES[1], sourceKind: "primary" },
        SOURCES[2],
      ])
    ).toBe(true);
  });

  it("requires annotation evidence quotes to occur in the cited source", () => {
    const annotation = {
      paragraph_id: "overview",
      quote: "Bundestag",
      category: "word-choice",
      title: "Wortwahl",
      explanation: "Die Formulierung kann einen Akzent setzen.",
      possible_effect: "Ein Aspekt kann stärker wirken.",
      alternatives: [],
      evidence: [{ source_id: "source-welt", quote: "frei erfundenes Zitat" }],
      confidence: "medium" as const,
      origin: "automatic" as const,
      review_status: "needs_review" as const,
    };
    const invented = RewriteSchema.parse({
      neutral_headline: "h",
      neutral_body: "b",
      ...STRUCTURED_SECTIONS,
      annotations: [annotation],
    });
    expect(validateRewriteSources(invented, SOURCES)).toBe(false);

    const exact = RewriteSchema.parse({
      neutral_headline: "h",
      neutral_body: "b",
      ...STRUCTURED_SECTIONS,
      annotations: [
        { ...annotation, evidence: [{ source_id: "source-welt", quote: "Welt-Teaser" }] },
      ],
    });
    expect(validateRewriteSources(exact, SOURCES)).toBe(true);
  });
});
