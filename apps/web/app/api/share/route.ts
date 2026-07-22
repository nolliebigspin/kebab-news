import { db, publishedArticles, shareChannelValues, shareEvents } from "@kebab/db";
import { and, eq, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const BodySchema = z.object({
  summaryId: z.string().uuid(),
  channel: z.enum(shareChannelValues),
});

export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new NextResponse(null, { status: 400 });
  const limit = rateLimit(`share:${parsed.data.summaryId}:${parsed.data.channel}`, 120, 60_000);
  if (!limit.ok) return new NextResponse(null, { status: 429 });

  const exists = await db
    .select({ id: publishedArticles.id })
    .from(publishedArticles)
    .where(
      and(eq(publishedArticles.id, parsed.data.summaryId), isNotNull(publishedArticles.publishedAt))
    )
    .limit(1);
  if (exists.length === 0) return new NextResponse(null, { status: 404 });

  await db.insert(shareEvents).values(parsed.data);
  return new NextResponse(null, { status: 204 });
}
