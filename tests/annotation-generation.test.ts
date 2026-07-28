import { afterEach, describe, expect, it, vi } from "vitest";

import { annotateTexts } from "../packages/core/src/annotate";

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
                          id: "headline",
                          annotations: [
                            {
                              quote: "Rekordstrafe",
                              type: "loaded-term",
                              note: "wertende Zuspitzung",
                            },
                          ],
                        },
                        { id: "teaser", annotations: [] },
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
