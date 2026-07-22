import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createComment,
  deleteOwnComment,
  reportComment,
  toggleHelpful,
  updateOwnComment,
} from "@/lib/comments";
import { rateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

const BodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    summaryId: z.string().uuid(),
    content: z.string(),
    parentId: z.string().uuid().optional(),
  }),
  z.object({ action: z.literal("edit"), commentId: z.string().uuid(), content: z.string() }),
  z.object({ action: z.literal("delete"), commentId: z.string().uuid() }),
  z.object({ action: z.literal("helpful"), commentId: z.string().uuid() }),
  z.object({
    action: z.literal("report"),
    commentId: z.string().uuid(),
    reason: z.string(),
  }),
]);

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const limit = rateLimit(`comments:${session.user.id}`, 15, 60_000);
  if (!limit.ok) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  try {
    const input = parsed.data;
    if (input.action === "create") {
      const comment = await createComment({ ...input, userId: session.user.id });
      return NextResponse.json({ ok: true, comment }, { status: 201 });
    }
    if (input.action === "edit") {
      const changed = await updateOwnComment(input.commentId, session.user.id, input.content);
      return NextResponse.json({ ok: changed }, { status: changed ? 200 : 403 });
    }
    if (input.action === "delete") {
      const changed = await deleteOwnComment(input.commentId, session.user.id);
      return NextResponse.json({ ok: changed }, { status: changed ? 200 : 403 });
    }
    if (input.action === "helpful") {
      const active = await toggleHelpful(input.commentId, session.user.id);
      return NextResponse.json({ ok: true, active });
    }
    await reportComment(input.commentId, session.user.id, input.reason);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[comments] mutation failed", error);
    return NextResponse.json({ ok: false, error: "invalid_comment" }, { status: 400 });
  }
}
