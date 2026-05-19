import { VoyageAIClient } from "voyageai";

import { EMBEDDING_DIMENSIONS } from "@/lib/db/schema";
import { env } from "@/lib/env";

const VOYAGE_MODEL = "voyage-3-lite";

let cachedClient: VoyageAIClient | null = null;

function getClient(): VoyageAIClient {
  if (!cachedClient) {
    cachedClient = new VoyageAIClient({ apiKey: env.VOYAGE_API_KEY });
  }
  return cachedClient;
}

/**
 * Embed a single text into a fixed-dim vector for pgvector clustering.
 *
 * For radar articles we pass `headline + "\n\n" + (teaser ?? "")` — embedding
 * both increases recall on the cluster step at near-zero cost (one API call,
 * one DB write).
 */
export async function embedText(text: string): Promise<number[]> {
  const client = getClient();
  const response = await client.embed({
    input: text,
    model: VOYAGE_MODEL,
    inputType: "document",
    outputDimension: EMBEDDING_DIMENSIONS,
  });

  const vector = response.data?.[0]?.embedding;
  if (!vector || vector.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Voyage returned ${vector?.length ?? 0} dims, expected ${EMBEDDING_DIMENSIONS}`
    );
  }
  return vector;
}
