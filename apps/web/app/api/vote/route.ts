import { NextResponse } from "next/server";
import { z } from "zod";

import { rateLimit } from "@/lib/rate-limit";
import { countVotesToday, extractClientIp, recordVote } from "@/lib/vote";

const VOTE_RATE_LIMIT = 10;
const VOTE_RATE_WINDOW_MS = 60_000;

const BodySchema = z.object({
  storyId: z.string().uuid(),
});

export async function POST(request: Request) {
  const ip = extractClientIp(request);
  const limit = rateLimit(`vote:${ip}`, VOTE_RATE_LIMIT, VOTE_RATE_WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) },
      }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const { storyId } = parsed.data;

  let result: Awaited<ReturnType<typeof recordVote>>;
  try {
    result = await recordVote(storyId, ip);
  } catch (err) {
    // Most likely: storyId is a valid UUID but no such row exists, so the
    // FK constraint fires. Treat as 404 to keep the client UX clean.
    console.error("[vote] recordVote failed", err);
    return NextResponse.json({ ok: false, error: "story_not_found" }, { status: 404 });
  }

  const count = await countVotesToday(storyId);
  return NextResponse.json({ ok: true, kind: result.kind, count });
}
