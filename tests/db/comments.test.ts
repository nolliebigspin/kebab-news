import { comments, db, publishedArticles, stories, user } from "@kebab/db";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createComment, deleteOwnComment, updateOwnComment } from "../../apps/web/lib/comments";

const STORY_SLUG = "__comments_story__";
const SUMMARY_SLUG = "__comments_summary__";
const USERS = ["__comments_owner__", "__comments_other__"];

let summaryId: string;
let commentId: string;

async function cleanup() {
  await db.delete(publishedArticles).where(eq(publishedArticles.slug, SUMMARY_SLUG));
  await db.delete(stories).where(eq(stories.slug, STORY_SLUG));
  await db.delete(user).where(inArray(user.id, USERS));
}

beforeAll(async () => {
  await cleanup();
  await db.insert(user).values(USERS.map((id) => ({ id, name: id, email: `${id}@comments.test` })));
  const story = await db
    .insert(stories)
    .values({
      slug: STORY_SLUG,
      label: "Comment story",
      centroid: Array.from({ length: 512 }, () => 0),
    })
    .returning({ id: stories.id });
  const summary = await db
    .insert(publishedArticles)
    .values({
      storyId: story[0].id,
      slug: SUMMARY_SLUG,
      neutralHeadline: "Comment summary",
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

describe("comment ownership", () => {
  it("creates plain-text comments for an authenticated user", async () => {
    const created = await createComment({
      summaryId,
      userId: USERS[0],
      content: "  Eine sachliche Ergänzung.  ",
    });
    commentId = created.id;
    expect(created.content).toBe("Eine sachliche Ergänzung.");
  });

  it("does not let another user edit the comment", async () => {
    expect(await updateOwnComment(commentId, USERS[1], "Manipuliert")).toBe(false);
    const stored = await db.select().from(comments).where(eq(comments.id, commentId));
    expect(stored[0].content).toBe("Eine sachliche Ergänzung.");
  });

  it("lets the owner edit and soft-delete the comment", async () => {
    expect(await updateOwnComment(commentId, USERS[0], "Korrigierte Ergänzung.")).toBe(true);
    expect(await deleteOwnComment(commentId, USERS[0])).toBe(true);
    const stored = await db.select().from(comments).where(eq(comments.id, commentId));
    expect(stored[0].moderationStatus).toBe("deleted");
    expect(stored[0].content).toBe("");
  });
});
