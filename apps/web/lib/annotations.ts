import { type Annotation, AnnotationsSchema } from "@kebab/core";

/** Persisted headline/teaser annotations, or none when the shape is stale. */
export function parseAnnotations(raw: unknown): Annotation[] {
  const result = AnnotationsSchema.safeParse(raw ?? []);
  return result.success ? result.data : [];
}
