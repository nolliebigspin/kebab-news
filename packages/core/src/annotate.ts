import Anthropic from "@anthropic-ai/sdk";
import { env } from "@kebab/env";
import { z } from "zod";

import { ANNOTATION_MODEL, ANNOTATION_SYSTEM_PROMPT, MAX_ANNOTATION_SPANS } from "./constants";

export const annotationTypeValues = [
  "loaded-term",
  "emotional-trigger",
  "presupposition",
  "euphemism",
  "omission",
] as const;
export type AnnotationType = (typeof annotationTypeValues)[number];

export const AnnotationSchema = z
  .object({
    start: z.number().int().nonnegative(),
    end: z.number().int().positive(),
    type: z.enum(annotationTypeValues),
    note: z.string().min(1).max(280),
  })
  .refine((a) => a.start < a.end, { message: "start must be < end" });

export const AnnotationsSchema = z.array(AnnotationSchema).max(MAX_ANNOTATION_SPANS);
export type Annotation = z.infer<typeof AnnotationSchema>;

// NOTE: Anthropic's output_config JSON-schema validator rejects validation
// keywords like `maxItems`/`minimum` ("For 'array' type, property 'maxItems'
// is not supported"). We therefore keep this schema purely structural — the
// span cap (MAX_ANNOTATION_SPANS) and bounds (start >= 0, end >= 1, start <
// end) are enforced by the system prompt and re-validated by Zod
// (AnnotationsSchema) after the call, so dropping them here is safe.
const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["annotations"],
  properties: {
    annotations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["start", "end", "type", "note"],
        properties: {
          start: { type: "integer" },
          end: { type: "integer" },
          type: {
            type: "string",
            enum: annotationTypeValues as unknown as string[],
          },
          note: { type: "string" },
        },
      },
    },
  },
} as const;

let cachedClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return cachedClient;
}

/**
 * Annotate framing language in a single piece of publisher text (headline or
 * teaser). Never throws into the cron pipeline — on parse/SDK failure we log
 * and return an empty array so ingest can still attach the article.
 */
export async function annotateText(text: string): Promise<Annotation[]> {
  if (!text || text.trim().length === 0) return [];

  const client = getClient();

  try {
    const response = await client.messages.create({
      model: ANNOTATION_MODEL,
      max_tokens: 1024,
      system: ANNOTATION_SYSTEM_PROMPT,
      output_config: {
        format: { type: "json_schema", schema: JSON_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: `Annotiere das folgende Framing:\n\n${text}`,
        },
      ],
    });

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return [];

    const raw = JSON.parse(block.text) as unknown;
    const parsed = AnnotationsSchema.safeParse(
      (raw as { annotations?: unknown })?.annotations ?? []
    );
    if (!parsed.success) {
      console.error("annotate: schema parse failed", parsed.error.format());
      return [];
    }

    // Filter spans that fall outside the input text (defensive — Claude is
    // told to use UTF-16 offsets but could still drift on weird inputs).
    return parsed.data.filter((a) => a.end <= text.length);
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.error(`annotate: Anthropic ${err.status} ${err.message}`);
    } else {
      console.error("annotate: unexpected error", err);
    }
    return [];
  }
}
