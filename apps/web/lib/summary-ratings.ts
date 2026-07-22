import { type DownvoteReason, db, summaryRatings } from "@kebab/db";
import { and, eq, sql } from "drizzle-orm";

export type RatingValue = -1 | 1;

export type SummaryRatingSnapshot = {
  up: number;
  down: number;
  score: number;
  userValue: RatingValue | null;
};

/** Set, change, or remove one user's quality rating for a summary. */
export async function setSummaryRating(
  summaryId: string,
  userId: string,
  value: RatingValue | null,
  downvoteReason?: DownvoteReason
): Promise<void> {
  if (value === null) {
    await db
      .delete(summaryRatings)
      .where(and(eq(summaryRatings.summaryId, summaryId), eq(summaryRatings.userId, userId)));
    return;
  }

  await db
    .insert(summaryRatings)
    .values({
      summaryId,
      userId,
      value,
      downvoteReason: value === -1 ? downvoteReason : null,
    })
    .onConflictDoUpdate({
      target: [summaryRatings.summaryId, summaryRatings.userId],
      set: {
        value,
        downvoteReason: value === -1 ? downvoteReason : null,
        updatedAt: new Date(),
      },
    });
}

export async function getSummaryRatingSnapshot(
  summaryId: string,
  userId?: string
): Promise<SummaryRatingSnapshot> {
  const aggregate = await db
    .select({
      up: sql<number>`count(*) filter (where ${summaryRatings.value} = 1)::int`,
      down: sql<number>`count(*) filter (where ${summaryRatings.value} = -1)::int`,
      score: sql<number>`coalesce(sum(${summaryRatings.value}), 0)::int`,
    })
    .from(summaryRatings)
    .where(eq(summaryRatings.summaryId, summaryId));

  let userValue: RatingValue | null = null;
  if (userId) {
    const own = await db
      .select({ value: summaryRatings.value })
      .from(summaryRatings)
      .where(and(eq(summaryRatings.summaryId, summaryId), eq(summaryRatings.userId, userId)))
      .limit(1);
    userValue = own[0]?.value === 1 ? 1 : own[0]?.value === -1 ? -1 : null;
  }

  return {
    up: aggregate[0]?.up ?? 0,
    down: aggregate[0]?.down ?? 0,
    score: aggregate[0]?.score ?? 0,
    userValue,
  };
}
