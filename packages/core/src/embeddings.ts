import { env } from "@kebab/env";

import { EMBEDDING_DIMENSIONS, VOYAGE_MODEL, VOYAGE_URL } from "./constants";

type VoyageResponse = {
  data?: Array<{ embedding?: number[] }>;
  error?: { message?: string };
};

/**
 * Embed a single text into a fixed-dim vector for pgvector clustering.
 *
 * For radar articles we pass `headline + "\n\n" + (teaser ?? "")` — embedding
 * both increases recall on the cluster step at near-zero cost (one API call,
 * one DB write).
 *
 * Implementation note: we call Voyage's HTTP API directly rather than via
 * their SDK. The SDK's ESM build ships unresolvable internal directory
 * imports that break Next.js's bundler, and the API surface we need is one
 * endpoint — direct fetch is cleaner.
 */
export async function embedText(text: string): Promise<number[]> {
  if (!env.VOYAGE_API_KEY) {
    throw new Error("VOYAGE_API_KEY is required to call embedText()");
  }
  const response = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.VOYAGE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: text,
      model: VOYAGE_MODEL,
      input_type: "document",
      output_dimension: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const errBody = (await response.json().catch(() => null)) as VoyageResponse | null;
    throw new Error(`Voyage ${response.status}: ${errBody?.error?.message ?? response.statusText}`);
  }

  const body = (await response.json()) as VoyageResponse;
  const vector = body.data?.[0]?.embedding;
  if (!vector || vector.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Voyage returned ${vector?.length ?? 0} dims, expected ${EMBEDDING_DIMENSIONS}`
    );
  }
  return vector;
}
