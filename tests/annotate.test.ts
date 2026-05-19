import { describe, expect, it } from "vitest";

import { AnnotationSchema, AnnotationsSchema } from "@/lib/annotate";

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
