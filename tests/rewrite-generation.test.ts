import { describe, expect, it, vi } from "vitest";

const { createMessageMock, streamMessageMock } = vi.hoisted(() => ({
  createMessageMock: vi.fn(),
  streamMessageMock: vi.fn(),
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class FakeAnthropic {
    static APIError = class extends Error {};
    messages = { create: createMessageMock, stream: streamMessageMock };
  },
}));

const { generateRewrite } = await import("../packages/core/src/rewrite");

const SOURCES = [
  {
    id: "source-one",
    outletName: "Quelle Eins",
    outletSlug: "quelle-eins",
    lean: "center-left" as const,
    headline: "EU verhängt Strafe gegen Google",
    teaser: "Die EU-Kommission begründet die Entscheidung mit Wettbewerbsverstößen.",
    url: "https://example.test/one",
    sourceKind: "secondary" as const,
  },
  {
    id: "source-two",
    outletName: "Quelle Zwei",
    outletSlug: "quelle-zwei",
    lean: "center-right" as const,
    headline: "Google soll Wettbewerbsstrafe zahlen",
    teaser: "Die Kommission verhängte eine Geldbuße gegen den Konzern.",
    url: "https://example.test/two",
    sourceKind: "secondary" as const,
  },
];

const COMPLETE_REWRITE = {
  neutral_headline: "EU verhängt Wettbewerbsstrafe gegen Google",
  neutral_body: "Die EU-Kommission hat eine Wettbewerbsstrafe gegen Google verhängt.",
  change_summary: null,
  short_summary: "Die EU-Kommission hat eine Wettbewerbsstrafe gegen Google verhängt.",
  body: [
    {
      id: "entscheidung",
      text: "Die EU-Kommission hat eine Wettbewerbsstrafe gegen Google verhängt.",
    },
  ],
  confirmed_facts: [
    {
      text: "Die EU-Kommission verhängte eine Strafe gegen Google.",
      source_ids: ["source-one", "source-two"],
      confidence: "high",
    },
  ],
  uncertainties: [],
  differences: [],
  annotations: [],
};

describe("generateRewrite output budget", () => {
  it("streams the complete structured article when the output ceiling exceeds the SDK sync limit", async () => {
    createMessageMock.mockImplementation(() => {
      throw new Error("Streaming is required for operations that may take longer than 10 minutes");
    });
    streamMessageMock.mockReturnValue({
      finalMessage: async () => ({
        stop_reason: "end_turn",
        content: [{ type: "text", text: JSON.stringify(COMPLETE_REWRITE) }],
      }),
    });

    const result = await generateRewrite("EU-Strafe gegen Google", SOURCES);

    expect(result).toEqual(COMPLETE_REWRITE);
    expect(createMessageMock).not.toHaveBeenCalled();
    expect(streamMessageMock).toHaveBeenCalledOnce();
    expect(streamMessageMock.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        max_tokens: 50_000,
        thinking: { type: "disabled" },
      })
    );
  });
});
