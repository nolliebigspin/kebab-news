/**
 * Pure clustering primitives. No IO, no DB — just math.
 *
 * The cron handler is responsible for loading candidate stories (those with
 * last_seen_at > now() - STORY_WINDOW_HOURS) and calling `assignStory` for
 * each new article.
 */
import { DEFAULT_CLUSTER_THRESHOLD } from "@/lib/constants";

export { DEFAULT_CLUSTER_THRESHOLD };

export type ClusterCandidate = {
  storyId: string;
  centroid: number[];
  articleCount: number;
};

export type ClusterAssignment =
  | { kind: "attach"; storyId: string; newCentroid: number[]; newCount: number }
  | { kind: "new" };

export type AssignStoryInput = {
  embedding: number[];
  candidates: ClusterCandidate[];
  threshold?: number;
};

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`vector length mismatch: ${a.length} vs ${b.length}`);
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Online centroid update: c' = (c * n + e) / (n + 1).
 * Pre-allocates so we don't allocate-per-element in hot path.
 */
export function updateCentroid(centroid: number[], embedding: number[], count: number): number[] {
  if (centroid.length !== embedding.length) {
    throw new Error(`vector length mismatch: ${centroid.length} vs ${embedding.length}`);
  }
  const next = new Array<number>(centroid.length);
  for (let i = 0; i < centroid.length; i++) {
    next[i] = (centroid[i] * count + embedding[i]) / (count + 1);
  }
  return next;
}

/**
 * Given a new article's embedding and the in-window candidate stories, decide
 * whether to attach it to the nearest story (cosine ≥ threshold) or to start
 * a new one.
 */
export function assignStory({
  embedding,
  candidates,
  threshold = DEFAULT_CLUSTER_THRESHOLD,
}: AssignStoryInput): ClusterAssignment {
  let best: { candidate: ClusterCandidate; sim: number } | null = null;
  for (const candidate of candidates) {
    const sim = cosineSimilarity(embedding, candidate.centroid);
    if (!best || sim > best.sim) {
      best = { candidate, sim };
    }
  }

  if (!best || best.sim < threshold) {
    return { kind: "new" };
  }

  const newCentroid = updateCentroid(
    best.candidate.centroid,
    embedding,
    best.candidate.articleCount
  );

  return {
    kind: "attach",
    storyId: best.candidate.storyId,
    newCentroid,
    newCount: best.candidate.articleCount + 1,
  };
}
