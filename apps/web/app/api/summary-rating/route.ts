import { db, downvoteReasonValues, publishedArticles } from "@kebab/db";
import { and, eq, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { getSummaryRatingSnapshot, setSummaryRating } from "@/lib/summary-ratings";

const BodySchema = z.object({
  summaryId: z.string().uuid(),
  value: z.union([z.literal(-1), z.literal(1), z.null()]),
  reason: z.enum(downvoteReasonValues).optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const limit = rateLimit(`summary-rating:${session.user.id}`, 20, 60_000);
  if (!limit.ok) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const published = await db
    .select({ id: publishedArticles.id })
    .from(publishedArticles)
    .where(
      and(eq(publishedArticles.id, parsed.data.summaryId), isNotNull(publishedArticles.publishedAt))
    )
    .limit(1);
  if (published.length === 0) {
    return NextResponse.json({ ok: false, error: "summary_not_found" }, { status: 404 });
  }

  await setSummaryRating(
    parsed.data.summaryId,
    session.user.id,
    parsed.data.value,
    parsed.data.reason
  );
  const snapshot = await getSummaryRatingSnapshot(parsed.data.summaryId, session.user.id);
  return NextResponse.json({ ok: true, snapshot });
}
