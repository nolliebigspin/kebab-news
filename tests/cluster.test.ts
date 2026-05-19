import { describe, expect, it } from "vitest";

import {
  assignStory,
  type ClusterCandidate,
  cosineSimilarity,
  DEFAULT_CLUSTER_THRESHOLD,
  updateCentroid,
} from "@/lib/cluster";

describe("cosineSimilarity", () => {
  it("returns 1 for identical unit vectors", () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1, 10);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 10);
  });

  it("returns 0 when either vector is zero", () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
    expect(cosineSimilarity([1, 1], [0, 0])).toBe(0);
  });

  it("throws on mismatched lengths", () => {
    expect(() => cosineSimilarity([1, 0], [1, 0, 0])).toThrow();
  });
});

describe("updateCentroid", () => {
  it("equals the embedding when the prior count is 0", () => {
    expect(updateCentroid([0, 0], [1, 2], 0)).toEqual([1, 2]);
  });

  it("averages correctly after multiple attachments", () => {
    const c1 = updateCentroid([2, 2], [4, 4], 1);
    expect(c1).toEqual([3, 3]);
    const c2 = updateCentroid(c1, [6, 6], 2);
    expect(c2).toEqual([4, 4]);
  });
});

describe("assignStory", () => {
  const candidateA: ClusterCandidate = {
    storyId: "story-A",
    centroid: [1, 0, 0],
    articleCount: 2,
  };
  const candidateB: ClusterCandidate = {
    storyId: "story-B",
    centroid: [0, 1, 0],
    articleCount: 5,
  };

  it("starts a new story when there are no candidates", () => {
    expect(assignStory({ embedding: [1, 0, 0], candidates: [] })).toEqual({ kind: "new" });
  });

  it("attaches to the nearest candidate above threshold", () => {
    const result = assignStory({
      embedding: [0.95, 0.05, 0],
      candidates: [candidateA, candidateB],
    });
    expect(result.kind).toBe("attach");
    if (result.kind === "attach") {
      expect(result.storyId).toBe("story-A");
      expect(result.newCount).toBe(3);
      expect(result.newCentroid).toHaveLength(3);
    }
  });

  it("starts a new story when the nearest candidate is below threshold", () => {
    const result = assignStory({
      embedding: [0.5, 0.5, 0],
      candidates: [candidateA, candidateB],
      threshold: 0.9,
    });
    expect(result).toEqual({ kind: "new" });
  });

  it("uses DEFAULT_CLUSTER_THRESHOLD when none is passed", () => {
    expect(DEFAULT_CLUSTER_THRESHOLD).toBeGreaterThan(0);
    expect(DEFAULT_CLUSTER_THRESHOLD).toBeLessThan(1);
    const just_under = Math.sqrt(Math.max(0, DEFAULT_CLUSTER_THRESHOLD ** 2 - 0.01));
    const sim_under_threshold = assignStory({
      embedding: [just_under, Math.sqrt(1 - just_under * just_under), 0],
      candidates: [candidateA],
    });
    expect(sim_under_threshold.kind).toBe("new");
  });
});
