import { resolveTextAnchor, StorySummarySchema } from "@kebab/core";
import { describe, expect, it } from "vitest";

const validSummary = {
  short_summary: "Mehrere Quellen bestätigen die Entscheidung; Details bleiben offen.",
  body: [
    {
      id: "context",
      text: "Die Regierung kündigte am Dienstag ein neues Programm an.",
    },
  ],
  confirmed_facts: [
    {
      text: "Das Programm wurde am Dienstag angekündigt.",
      source_ids: ["source-a", "source-b"],
      confidence: "high",
    },
  ],
  uncertainties: [
    {
      text: "Die endgültigen Kosten sind noch nicht veröffentlicht.",
      source_ids: ["source-a"],
      status: "open",
    },
  ],
  differences: [
    {
      topic: "Kosten",
      explanation: "Die Quellen nennen unterschiedliche Schätzungen.",
      positions: [
        { label: "Niedrigere Schätzung", source_ids: ["source-a"] },
        { label: "Höhere Schätzung", source_ids: ["source-b"] },
      ],
    },
  ],
  annotations: [
    {
      paragraph_id: "context",
      quote: "neues Programm",
      prefix: "Dienstag ein ",
      suffix: " an.",
      category: "political-framing",
      title: "Mögliches politisches Framing",
      explanation: "Die Bezeichnung übernimmt die Sprache der Regierung.",
      possible_effect: "Die Maßnahme kann dadurch innovativer wirken.",
      alternatives: ["Maßnahmenpaket", "Vorhaben"],
      evidence_source_ids: ["source-a"],
      confidence: "medium",
      origin: "automatic",
      review_status: "needs_review",
    },
  ],
};

describe("StorySummarySchema", () => {
  it("accepts a sourced, structured story summary", () => {
    expect(StorySummarySchema.safeParse(validSummary).success).toBe(true);
  });

  it("rejects factual claims without source evidence", () => {
    const result = StorySummarySchema.safeParse({
      ...validSummary,
      confirmed_facts: [{ ...validSummary.confirmed_facts[0], source_ids: [] }],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an annotation whose paragraph does not exist", () => {
    const result = StorySummarySchema.safeParse({
      ...validSummary,
      annotations: [{ ...validSummary.annotations[0], paragraph_id: "missing" }],
    });

    expect(result.success).toBe(false);
  });
});

describe("resolveTextAnchor", () => {
  it("relocates an annotation after a small edit using quote context", () => {
    const text = "Die Regierung kündigte bereits am Dienstag ein neues Programm an.";
    const anchor = {
      quote: "neues Programm",
      prefix: "Dienstag ein ",
      suffix: " an.",
    };

    expect(resolveTextAnchor(text, anchor)).toEqual({ start: 47, end: 61 });
  });

  it("returns null when an anchor is ambiguous without matching context", () => {
    expect(resolveTextAnchor("Plan A und Plan B", { quote: "Plan" })).toBeNull();
  });
});
