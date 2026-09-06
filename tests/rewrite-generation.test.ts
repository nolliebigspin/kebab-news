import { afterEach, describe, expect, it, vi } from "vitest";

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

afterEach(() => vi.unstubAllGlobals());

describe("generateRewrite", () => {
  it("generates and prices a complete structured article with Gemini 3.6 Flash", async () => {
    const fetchMock = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => {
      return new Response(
        JSON.stringify({
          candidates: [
            {
              finishReason: "STOP",
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      ...COMPLETE_REWRITE,
                      neutral_body: undefined,
                      confirmed_facts: COMPLETE_REWRITE.confirmed_facts.map((fact) => ({
                        ...fact,
                        source_ids: ["0", "1"],
                      })),
                    }),
                  },
                ],
              },
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
          required: expect.arrayContaining(["neutral_headline", "body", "confirmed_facts"]),
        }),
      })
    );
    expect(request.generationConfig).not.toHaveProperty("temperature");
  });
});

function modelRewrite() {
  const { neutral_body: _body, ...output } = structuredClone(COMPLETE_REWRITE);
  return {
    ...output,
    confirmed_facts: output.confirmed_facts.map((fact) => ({ ...fact, source_ids: ["0", "1"] })),
    uncertainties: [{ text: "Die Höhe bleibt offen.", source_ids: ["1"], status: "open" }],
    differences: [
      {
        topic: "Wortwahl",
        explanation: "Die Quellen formulieren unterschiedlich.",
        positions: [
          { label: "Strafe", source_ids: ["0"] },
          { label: "Geldbuße", source_ids: ["1"] },
        ],
      },
    ],
    annotations: [
      {
        paragraph_id: "entscheidung",
        quote: "Wettbewerbsstrafe",
        category: "word-choice",
        title: "Wortwahl",
        explanation: "Mögliche Schwerpunktsetzung.",
        possible_effect: "Kann den Wettbewerbsaspekt hervorheben.",
        alternatives: [],
        evidence: [{ source_id: "1", quote: "Geldbuße" }],
        confidence: "medium",
      },
    ],
  };
}

function mockRewriteResponse(output: unknown, finishReason = "STOP") {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        candidates: [{ finishReason, content: { parts: [{ text: JSON.stringify(output) }] } }],
        usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 100, thoughtsTokenCount: 10 },
      })
    )
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("compact rewrite contract", () => {
  it("restores every evidence id and derives body and trusted metadata locally", async () => {
    const output = modelRewrite();
    const fetchMock = mockRewriteResponse({
      ...output,
      neutral_body: "This duplicate model field must never be persisted.",
      annotations: output.annotations.map((annotation) => ({
        ...annotation,
        origin: "manual",
        review_status: "verified",
        created_at: "2000-01-01T00:00:00Z",
      })),
    });
    const reversed = [...SOURCES].reverse();
    reversed[1] = { ...reversed[1], teaser: "Die Kommission verhängte eine Geldbuße." };
    const result = await generateRewrite("EU-Strafe", reversed);
    // IDs follow request identity, independently of the subsequent lean sorting.
    expect(result?.rewrite.neutral_body).toBe(
      output.body.map((paragraph) => paragraph.text).join("\n\n")
    );
    expect(result?.rewrite.confirmed_facts[0].source_ids).toEqual(["source-two", "source-one"]);
    expect(result?.rewrite.uncertainties[0].source_ids).toEqual(["source-one"]);
    expect(result?.rewrite.differences[0].positions.map((position) => position.source_ids)).toEqual(
      [["source-two"], ["source-one"]]
    );
    expect(result?.rewrite.annotations[0]).toMatchObject({
      origin: "automatic",
      review_status: "needs_review",
      evidence: [{ source_id: "source-one", quote: "Geldbuße" }],
    });
    expect(result?.rewrite.annotations[0]).not.toHaveProperty("created_at");
    const request = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(request.contents[0].parts[0].text).not.toContain("source-one");
    expect(request.generationConfig.responseJsonSchema.properties).not.toHaveProperty(
      "neutral_body"
    );
    expect(
      request.generationConfig.responseJsonSchema.properties.annotations.items.properties
    ).not.toHaveProperty("origin");
  });

  it("joins multiple paragraphs exactly once", async () => {
    const output = modelRewrite();
    output.body.push({ id: "details", text: "Weitere Details bleiben offen." });
    mockRewriteResponse(output);
    expect((await generateRewrite("EU-Strafe", SOURCES))?.rewrite.neutral_body).toBe(
      `${output.body[0].text}\n\nWeitere Details bleiben offen.`
    );
  });

  it.each([
    "missing-anchor",
    "unknown-source",
    "invented-evidence",
    "overlap",
    "duplicate-paragraph",
    "empty-body",
  ])("rejects %s before persistence", async (problem) => {
    const output = modelRewrite();
    if (problem === "missing-anchor") output.annotations[0].quote = "frei erfunden";
    if (problem === "unknown-source") output.uncertainties[0].source_ids = ["source-one"];
    if (problem === "invented-evidence") output.annotations[0].evidence[0].quote = "erfunden";
    if (problem === "overlap") output.annotations.push({ ...output.annotations[0] });
    if (problem === "duplicate-paragraph") output.body.push({ ...output.body[0] });
    if (problem === "empty-body") output.body = [];
    mockRewriteResponse(output);
    expect(await generateRewrite("EU-Strafe", SOURCES)).toBeNull();
  });

  it("rejects incomplete model output and updates without a change summary", async () => {
    mockRewriteResponse(modelRewrite(), "MAX_TOKENS");
    expect(await generateRewrite("EU-Strafe", SOURCES)).toBeNull();
    mockRewriteResponse(modelRewrite());
    expect(
      await generateRewrite("EU-Strafe", SOURCES, {
        headline: "Alt",
        shortSummary: "Alt",
        body: "Alt",
      })
    ).toBeNull();
  });
});
