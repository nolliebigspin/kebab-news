/**
 * Voting on radar stories. Account-based model:
 *   - One vote per (story, user), enforced by a unique index.
 *   - Voting requires a logged-in account (see /api/vote); there is no
 *     anonymous or IP-based path anymore.
 *   - Votes accumulate across days until a story clears
 *     REWRITE_VOTE_THRESHOLD; there is no daily reset.
 */
import { db, votes } from "@kebab/db";
import { eq, inArray, sql } from "drizzle-orm";

export type VoteResult =
  | { kind: "recorded"; storyId: string }
  | { kind: "duplicate"; storyId: string };

/**
 * Record a vote. Returns `recorded` on the user's first vote for a story,
 * `duplicate` on every subsequent vote for the same story. Never throws on
 * the duplicate path — the unique index handles it.
 */
export async function recordVote(storyId: string, userId: string): Promise<VoteResult> {
  const inserted = await db
    .insert(votes)
    .values({ storyId, userId })
    .onConflictDoNothing({
      target: [votes.storyId, votes.userId],
    })
    .returning({ id: votes.id });

  return inserted.length > 0 ? { kind: "recorded", storyId } : { kind: "duplicate", storyId };
}

/** Total (all-time) vote count for a single story. */
export async function countVotes(storyId: string): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(votes)
    .where(eq(votes.storyId, storyId));
  return rows[0]?.count ?? 0;
}

/**
 * Cumulative vote counts per story, keyed by storyId. This is the tally the
 * rewrite threshold (REWRITE_VOTE_THRESHOLD) is measured against and what the
 * radar shows as "votes so far". Stories with zero votes are absent from the
 * map — callers default to 0. One round-trip; used to hydrate the radar list.
 */
export async function getCumulativeVoteCounts(storyIds: string[]): Promise<Map<string, number>> {
  if (storyIds.length === 0) return new Map();
  const rows = await db
    .select({
      storyId: votes.storyId,
      count: sql<number>`count(*)::int`,
    })
    .from(votes)
    .where(inArray(votes.storyId, storyIds))
    .groupBy(votes.storyId);
  return new Map(rows.map((r) => [r.storyId, r.count]));
}
