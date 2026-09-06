import { afterEach, describe, expect, it, vi } from "vitest";

import {
  annotateTexts,
  estimateAnnotationMaximumCostMicroUsd,
} from "../packages/core/src/annotate";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("annotateTexts", () => {
  it("annotates every topic text in one structured Gemini request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              finishReason: "STOP",
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      items: [
                        {
                          id: "0",
                          annotations: [
                            {
                              quote: "Rekordstrafe",
                              type: "loaded-term",
                              note: "wertende Zuspitzung",
                            },
                          ],
                        },
                        { id: "1", annotations: [] },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
          usageMetadata: {
            promptTokenCount: 100,
            candidatesTokenCount: 20,
            thoughtsTokenCount: 0,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await annotateTexts([
      { id: "headline", text: "EU verhängt Rekordstrafe gegen Google" },
      { id: "teaser", text: "Die Kommission begründet ihre Entscheidung." },
    ]);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result).toEqual({
      annotations: {
        headline: [
          {
            start: 12,
            end: 24,
            quote: "Rekordstrafe",
            type: "loaded-term",
            note: "wertende Zuspitzung",
          },
        ],
        teaser: [],
      },
      usage: {
        provider: "google",
        model: "gemini-3.5-flash-lite",
        inputTokens: 100,
        outputTokens: 20,
        costMicroUsd: 80,
      },
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(request.body));
    expect(body).toEqual(
      expect.objectContaining({
        generationConfig: expect.objectContaining({
          thinkingConfig: { thinkingLevel: "minimal" },
        }),
      })
    );
    expect(body.generationConfig).not.toHaveProperty("temperature");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      expect.anything()
    );
  });
});

function mockAnnotationResponse(items: unknown[], finishReason = "STOP") {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        candidates: [
          {
            finishReason,
            content: {
              parts: [
                { thought: true, text: "interne Überlegung" },
                { text: JSON.stringify({ items }) },
              ],
            },
          },
        ],
        usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 20, thoughtsTokenCount: 10 },
      })
    )
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("annotation request efficiency and integrity", () => {
  it("sends identical texts once with short ids and expands the answer to all original ids", async () => {
    const fetchMock = mockAnnotationResponse([
      {
        id: "0",
        annotations: [{ quote: "Skandal", type: "loaded-term", note: "Kann Empörung nahelegen." }],
      },
    ]);
    const result = await annotateTexts([
      { id: "article-a:headline", text: "Ein Skandal" },
      { id: "article-b:headline", text: "Ein Skandal" },
      { id: "__proto__", text: "Ein Skandal" },
    ]);
    const request = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    const prompt = request.contents[0].parts[0].text;
    expect(prompt.match(/Ein Skandal/g)).toHaveLength(1);
    expect(prompt).not.toContain("article-a:headline");
    expect(Object.keys(result?.annotations ?? {})).toEqual([
      "article-a:headline",
      "article-b:headline",
      "__proto__",
    ]);
    expect(result?.annotations["article-a:headline"]).toEqual(
      result?.annotations["article-b:headline"]
    );
    expect(result?.usage.outputTokens).toBe(30);
  });

  it.each([
    { items: [] },
    { items: [{ id: "unknown", annotations: [] }] },
    {
      items: [
        { id: "0", annotations: [] },
        { id: "0", annotations: [] },
      ],
    },
  ])("rejects incomplete or invalid id coverage: %j", async ({ items }) => {
    mockAnnotationResponse(items);
    expect(await annotateTexts([{ id: "original", text: "Sachlicher Text." }])).toBeNull();
  });

  it("does not accept truncated responses even if their JSON is valid", async () => {
    mockAnnotationResponse([{ id: "0", annotations: [] }], "MAX_TOKENS");
    expect(await annotateTexts([{ id: "original", text: "Sachlicher Text." }])).toBeNull();
  });

  it("skips empty batches and rejects duplicate caller ids before a paid request", async () => {
    const fetchMock = mockAnnotationResponse([]);
    expect((await annotateTexts([]))?.usage.costMicroUsd).toBe(0);
    await expect(
      annotateTexts([
        { id: "a", text: "A" },
        { id: "a", text: "B" },
      ])
    ).rejects.toThrow("unique ids");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("annotation budget estimation", () => {
  it("reserves only for unique texts and ignores caller id length", () => {
    const single = estimateAnnotationMaximumCostMicroUsd([{ id: "a", text: "Text" }]);
    expect(
      estimateAnnotationMaximumCostMicroUsd([
        { id: "a".repeat(200), text: "Text" },
        { id: "b", text: "Text" },
      ])
    ).toBe(single);
    expect(
      estimateAnnotationMaximumCostMicroUsd([
        { id: "a", text: "Text" },
        { id: "b", text: "Anderer Text" },
      ])
    ).toBeGreaterThan(single);
  });
});
