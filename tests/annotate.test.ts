import {
  AnnotationSchema,
  AnnotationsSchema,
  anchorAnnotationQuotes,
  MAX_ANNOTATION_SPANS,
} from "@kebab/core";
import { describe, expect, it } from "vitest";

describe("AnnotationSchema", () => {
  it("accepts a well-formed annotation", () => {
    const result = AnnotationSchema.safeParse({
      start: 0,
      end: 5,
      type: "loaded-term",
      note: "geladener Begriff",
    });
    expect(result.success).toBe(true);
  });

  it("rejects start >= end", () => {
    expect(
      AnnotationSchema.safeParse({ start: 5, end: 5, type: "loaded-term", note: "x" }).success
    ).toBe(false);
    expect(
      AnnotationSchema.safeParse({ start: 7, end: 5, type: "loaded-term", note: "x" }).success
    ).toBe(false);
  });

  it("rejects negative offsets", () => {
    expect(
      AnnotationSchema.safeParse({ start: -1, end: 3, type: "loaded-term", note: "x" }).success
    ).toBe(false);
  });

  it("rejects unknown type", () => {
    expect(
      AnnotationSchema.safeParse({ start: 0, end: 5, type: "sarcasm", note: "x" }).success
    ).toBe(false);
  });

  it("rejects an empty note", () => {
    expect(
      AnnotationSchema.safeParse({ start: 0, end: 5, type: "euphemism", note: "" }).success
    ).toBe(false);
  });

  it("rejects non-integer offsets", () => {
    expect(
      AnnotationSchema.safeParse({ start: 0.5, end: 5, type: "loaded-term", note: "x" }).success
    ).toBe(false);
  });
});

describe("AnnotationsSchema", () => {
  it("accepts an empty array", () => {
    expect(AnnotationsSchema.safeParse([]).success).toBe(true);
  });

  it("rejects more than 10 entries", () => {
    const eleven = Array.from({ length: 11 }, (_, i) => ({
      start: i,
      end: i + 1,
      type: "loaded-term" as const,
      note: "x",
    }));
    expect(AnnotationsSchema.safeParse(eleven).success).toBe(false);
  });
});

describe("anchorAnnotationQuotes", () => {
  const candidate = (quote: string, note = "auffällige Zuspitzung") => ({
    quote,
    type: "loaded-term" as const,
    note,
  });

  it("derives exact UTF-16 offsets from the quoted original text", () => {
    const text = "Mehr als eine Billion Dollar sieht darin für das Pentagon vor.";

    expect(anchorAnnotationQuotes(text, [candidate("eine Billion Dollar")])).toEqual([
      {
        start: text.indexOf("eine Billion Dollar"),
        end: text.indexOf("eine Billion Dollar") + "eine Billion Dollar".length,
        quote: "eine Billion Dollar",
        type: "loaded-term",
        note: "auffällige Zuspitzung",
      },
    ]);
  });

  it("drops missing or ambiguous quotes instead of highlighting the wrong text", () => {
    expect(
      anchorAnnotationQuotes("Der Etat steigt. Der Etat bleibt umstritten.", [
        candidate("Der Etat"),
        candidate("kommt nicht vor"),
      ])
    ).toEqual([]);
  });

  it("caps the visible annotations to the conservative product limit", () => {
    const text = "Alpha, Bravo, Charlie und Delta.";
    const annotations = ["Alpha", "Bravo", "Charlie", "Delta"].map((quote) => candidate(quote));

    expect(anchorAnnotationQuotes(text, annotations)).toHaveLength(MAX_ANNOTATION_SPANS);
  });
});
