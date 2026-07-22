import {
  commentHelpfulVotes,
  commentReports,
  comments,
  db,
  publishedArticles,
  user,
} from "@kebab/db";
import { and, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { z } from "zod";

export const CommentContentSchema = z
  .string()
  .trim()
  .min(3)
  .max(2000)
  .refine(
    (value) =>
      [...value].every((character) => {
        const code = character.charCodeAt(0);
        return code === 9 || code === 10 || code === 13 || code >= 32;
      }),
    { message: "control characters are not allowed" }
  );

export type CommentSort = "newest" | "helpful";

export async function createComment(input: {
  summaryId: string;
  userId: string;
  content: string;
  parentId?: string;
}) {
  const content = CommentContentSchema.parse(input.content);
  const summary = await db
    .select({ id: publishedArticles.id })
    .from(publishedArticles)
    .where(and(eq(publishedArticles.id, input.summaryId), isNotNull(publishedArticles.publishedAt)))
    .limit(1);
  if (summary.length === 0) throw new Error("summary_not_found");

  if (input.parentId) {
    const parent = await db
      .select({ summaryId: comments.summaryId })
      .from(comments)
      .where(
        and(
          eq(comments.id, input.parentId),
          eq(comments.summaryId, input.summaryId),
          isNull(comments.deletedAt)
        )
      )
      .limit(1);
    if (parent.length === 0) throw new Error("parent_not_found");
  }

  const inserted = await db
    .insert(comments)
    .values({ ...input, content })
    .returning();
  return inserted[0];
}

export async function updateOwnComment(
  commentId: string,
  userId: string,
  rawContent: string
): Promise<boolean> {
  const content = CommentContentSchema.parse(rawContent);
  const updated = await db
    .update(comments)
    .set({ content, updatedAt: new Date() })
    .where(and(eq(comments.id, commentId), eq(comments.userId, userId), isNull(comments.deletedAt)))
    .returning({ id: comments.id });
  return updated.length > 0;
}

export async function deleteOwnComment(commentId: string, userId: string): Promise<boolean> {
  const deleted = await db
    .update(comments)
    .set({
      content: "",
      moderationStatus: "deleted",
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(comments.id, commentId), eq(comments.userId, userId), isNull(comments.deletedAt)))
    .returning({ id: comments.id });
  return deleted.length > 0;
}

export async function toggleHelpful(commentId: string, userId: string): Promise<boolean> {
  const existing = await db
    .select({ id: commentHelpfulVotes.id })
    .from(commentHelpfulVotes)
    .where(
      and(eq(commentHelpfulVotes.commentId, commentId), eq(commentHelpfulVotes.userId, userId))
    )
    .limit(1);
  if (existing.length > 0) {
    await db.delete(commentHelpfulVotes).where(eq(commentHelpfulVotes.id, existing[0].id));
    return false;
  }
  await db.insert(commentHelpfulVotes).values({ commentId, userId });
  return true;
}

export async function reportComment(
  commentId: string,
  reporterId: string,
  rawReason: string
): Promise<void> {
  const reason = z.string().trim().min(3).max(500).parse(rawReason);
  await db
    .insert(commentReports)
    .values({ commentId, reporterId, reason })
    .onConflictDoNothing({
      target: [commentReports.commentId, commentReports.reporterId],
    });
}

export async function listComments(summaryId: string, sort: CommentSort = "newest") {
  const helpfulCount = sql<number>`count(${commentHelpfulVotes.id})::int`;
  return db
    .select({
      id: comments.id,
      content: comments.content,
      userId: comments.userId,
      authorName: user.name,
      parentId: comments.parentId,
      moderationStatus: comments.moderationStatus,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      helpfulCount,
    })
    .from(comments)
    .innerJoin(user, eq(user.id, comments.userId))
    .leftJoin(commentHelpfulVotes, eq(commentHelpfulVotes.commentId, comments.id))
    .where(and(eq(comments.summaryId, summaryId), eq(comments.moderationStatus, "visible")))
    .groupBy(comments.id, user.id)
    .orderBy(
      sort === "helpful" ? desc(helpfulCount) : desc(comments.createdAt),
      asc(comments.createdAt)
    );
}
