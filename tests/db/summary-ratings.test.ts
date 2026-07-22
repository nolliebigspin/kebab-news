import { db, publishedArticles, stories, summaryRatings, user } from "@kebab/db";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getSummaryRatingSnapshot, setSummaryRating } from "../../apps/web/lib/summary-ratings";

const STORY_SLUG = "__summary_rating_story__";
const SUMMARY_SLUG = "__summary_rating_summary__";
const USERS = ["__summary_rating_a__", "__summary_rating_b__"];

let storyId: string;
let summaryId: string;

async function cleanup() {
  await db.delete(publishedArticles).where(eq(publishedArticles.slug, SUMMARY_SLUG));
  await db.delete(stories).where(eq(stories.slug, STORY_SLUG));
  await db.delete(user).where(inArray(user.id, USERS));
}

beforeAll(async () => {
  await cleanup();
  await db.insert(user).values(
    USERS.map((id, index) => ({
      id,
      name: `Summary voter ${index}`,
      email: `${id}@ratings.test`,
    }))
  );
  const story = await db
    .insert(stories)
    .values({
      slug: STORY_SLUG,
      label: "Summary rating story",
      centroid: Array.from({ length: 512 }, () => 0),
    })
    .returning({ id: stories.id });
  storyId = story[0].id;
  const summary = await db
    .insert(publishedArticles)
    .values({
      storyId,
      slug: SUMMARY_SLUG,
      neutralHeadline: "Summary rating",
      neutralBody: "Body",
      sourceCount: 1,
      sourceOutletSlugs: ["test"],
      model: "test",
      promptVersion: "test",
      publishedAt: new Date(),
      status: "published",
    })
    .returning({ id: publishedArticles.id });
  summaryId = summary[0].id;
});

afterAll(cleanup);

describe("summary quality ratings", () => {
  it("records one rating per user and exposes the aggregate", async () => {
    await setSummaryRating(summaryId, USERS[0], 1);
    expect(await getSummaryRatingSnapshot(summaryId, USERS[0])).toEqual({
      up: 1,
      down: 0,
      score: 1,
      userValue: 1,
    });
  });

  it("changes an existing rating without creating another row", async () => {
    await setSummaryRating(summaryId, USERS[0], -1, "missing_information");
    expect(await getSummaryRatingSnapshot(summaryId, USERS[0])).toEqual({
      up: 0,
      down: 1,
      score: -1,
      userValue: -1,
    });
  });

  it("removes an existing rating", async () => {
    await setSummaryRating(summaryId, USERS[0], null);
    expect(
      await db.select().from(summaryRatings).where(eq(summaryRatings.summaryId, summaryId))
    ).toHaveLength(0);
  });
});
