/**
 * Voting on radar stories. v1 model — no accounts:
 *   - One vote per (story, ip_hash, day_bucket).
 *   - ip_hash = sha256(ip + VOTE_DAILY_SALT). Raw IPs never persist.
 *   - day_bucket = today's date in the server's local tz (YYYY-MM-DD).
 *
 * This will get botted if the product gets traction. That's accepted for v1;
 * Magic Link accounts come later.
 */
import { createHash } from "node:crypto";
import { db, votes } from "@kebab/db";
import { env } from "@kebab/env";
import { and, eq, inArray, sql } from "drizzle-orm";

/**
 * Extract the client IP from a Next.js Request. Vercel sets x-forwarded-for
 * as a comma-separated chain; the leftmost is the original client. On other
 * platforms we fall back to x-real-ip. If neither is present (local dev with
 * direct curl), we use "unknown" so the dedup constraint still works per-day.
 */
export function extractClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

/**
 * Hash an IP with the daily-rotating salt. The salt comes from VOTE_DAILY_SALT
 * — operator is expected to rotate it; we deliberately don't rotate it
 * automatically so accidental restarts don't blow away the vote bucket.
 */
export function hashIp(ip: string, salt: string = env.VOTE_DAILY_SALT): string {
  return createHash("sha256").update(ip).update("|").update(salt).digest("hex");
}

/** Today's date as YYYY-MM-DD in UTC. */
export function todayBucket(now: Date = new Date()): string {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export type VoteResult =
  | { kind: "recorded"; storyId: string }
  | { kind: "duplicate"; storyId: string };

/**
 * Record a vote. Returns `recorded` on the first vote per (story, ip, day),
 * `duplicate` on every subsequent vote that day from the same IP. Never
 * throws on the duplicate path — the unique index handles it.
 */
export async function recordVote(storyId: string, ip: string): Promise<VoteResult> {
  const ipHash = hashIp(ip);
  const dayBucket = todayBucket();

  const inserted = await db
    .insert(votes)
    .values({ storyId, ipHash, dayBucket })
    .onConflictDoNothing({
      target: [votes.storyId, votes.ipHash, votes.dayBucket],
    })
    .returning({ id: votes.id });

  return inserted.length > 0 ? { kind: "recorded", storyId } : { kind: "duplicate", storyId };
}

/** Count of votes a story has received today. */
export async function countVotesToday(storyId: string): Promise<number> {
  const dayBucket = todayBucket();
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(votes)
    .where(and(eq(votes.storyId, storyId), eq(votes.dayBucket, dayBucket)));
  return rows[0]?.count ?? 0;
}

/**
 * Count of votes-today for many stories, returned as a Map keyed by storyId.
 * Stories with zero votes are simply absent from the map — callers should
 * default to 0. One round-trip; used to hydrate the radar list cheaply.
 */
export async function getStoryVoteCounts(storyIds: string[]): Promise<Map<string, number>> {
  if (storyIds.length === 0) return new Map();
  const dayBucket = todayBucket();
  const rows = await db
    .select({
      storyId: votes.storyId,
      count: sql<number>`count(*)::int`,
    })
    .from(votes)
    .where(and(inArray(votes.storyId, storyIds), eq(votes.dayBucket, dayBucket)))
    .groupBy(votes.storyId);
  return new Map(rows.map((r) => [r.storyId, r.count]));
}

/**
 * Cumulative (all-time) vote counts per story, keyed by storyId. This is the
 * tally that the rewrite threshold (REWRITE_VOTE_THRESHOLD) is measured
 * against and what the radar shows as "votes so far" — votes accumulate
 * across days until a story qualifies, rather than resetting daily. The
 * per-day bucket still governs dedup on the write path; here we sum across
 * all buckets. Stories with zero votes are absent — callers default to 0.
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
