import { beforeEach, describe, expect, it, vi } from "vitest";

const { countVotesMock, getSessionMock, recordVoteMock } = vi.hoisted(() => ({
  countVotesMock: vi.fn(),
  getSessionMock: vi.fn(),
  recordVoteMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({ getSession: getSessionMock }));
vi.mock("@/lib/vote", () => ({
  countVotes: countVotesMock,
  recordVote: recordVoteMock,
}));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ ok: true }),
}));

const { POST } = await import("../apps/web/app/api/vote/route");

beforeEach(() => {
  getSessionMock.mockResolvedValue({ user: { id: "user-1" } });
  recordVoteMock.mockResolvedValue({ kind: "recorded", storyId: "story-1" });
  countVotesMock.mockResolvedValue(1);
});

describe("POST /api/vote", () => {
  it("records an authenticated topic upvote and returns its cumulative count", async () => {
    const storyId = "b6d0fba1-d314-4585-bd3a-a37b58ccfca1";
    const response = await POST(
      new Request("https://kebab.test/api/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ storyId }),
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, kind: "recorded", count: 1 });
    expect(recordVoteMock).toHaveBeenCalledWith(storyId, "user-1");
  });
});
