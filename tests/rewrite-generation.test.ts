import { describe, expect, it, vi } from "vitest";

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

describe("generateRewrite", () => {
  it("generates and prices a complete structured article with Gemini 3.6 Flash", async () => {
    const fetchMock = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => {
      return new Response(
        JSON.stringify({
          candidates: [
            {
              finishReason: "STOP",
              content: { parts: [{ text: JSON.stringify(COMPLETE_REWRITE) }] },
            },
          ],
          usageMetadata: {
            promptTokenCount: 1_000,
            candidatesTokenCount: 500,
            thoughtsTokenCount: 200,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateRewrite("EU-Strafe gegen Google", SOURCES);

    expect(result).toEqual({
      rewrite: COMPLETE_REWRITE,
      usage: {
        provider: "google",
        model: "gemini-3.6-flash",
        inputTokens: 1_000,
        outputTokens: 700,
        costMicroUsd: 6_750,
      },
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent"
    );
    expect(init?.headers).toEqual(expect.objectContaining({ "x-goog-api-key": "test-gemini-key" }));
    const request = JSON.parse(String(init?.body));
    expect(request.generationConfig).toEqual(
      expect.objectContaining({
        maxOutputTokens: 8_000,
        thinkingConfig: { thinkingLevel: "medium" },
        responseMimeType: "application/json",
        responseJsonSchema: expect.objectContaining({
          type: "object",
          required: expect.arrayContaining(["neutral_headline", "neutral_body", "confirmed_facts"]),
        }),
      })
    );
    expect(request.generationConfig).not.toHaveProperty("temperature");
  });
});
