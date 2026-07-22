import { NextResponse } from "next/server";

/** Legacy endpoint kept temporarily so old clients get an explicit migration response. */
export async function POST() {
  return NextResponse.json(
    { ok: false, error: "topic_voting_retired", replacement: "/api/summary-rating" },
    { status: 410 }
  );
}
