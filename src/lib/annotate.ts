import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { env } from "@/lib/env";

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

export const AnnotationsSchema = z.array(AnnotationSchema).max(10);
export type Annotation = z.infer<typeof AnnotationSchema>;

const ANNOTATION_MODEL = "claude-opus-4-7";

const SYSTEM_PROMPT = [
  "Du bist ein Framing-Analyse-Werkzeug für deutschsprachige Nachrichten.",
  "Aufgabe: Im gegebenen Text geladene Begriffe, emotionale Trigger, vorausgesetzte Annahmen,",
  "Euphemismen und auffällige Auslassungen markieren.",
  "",
  "Regeln:",
  "- start und end sind UTF-16-Code-Unit-Offsets im Originaltext (wie String#length und String#slice in JavaScript).",
  "- start < end, beide ≥ 0, end ≤ text.length.",
  "- Höchstens 10 Annotationen. Nur wirklich auffällige Stellen markieren — keine Marker um neutralen Text.",
  "- note ist eine kurze deutsche Begründung (max ~30 Wörter), die erklärt, warum diese Stelle Framing trägt.",
  "- type ist genau einer von: loaded-term, emotional-trigger, presupposition, euphemism, omission.",
  "- Wenn der Text neutral ist: leeres Array zurückgeben.",
  "- Niemals umschreiben, niemals korrigieren — nur annotieren.",
].join("\n");

const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["annotations"],
  properties: {
    annotations: {
      type: "array",
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["start", "end", "type", "note"],
        properties: {
          start: { type: "integer", minimum: 0 },
          end: { type: "integer", minimum: 1 },
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
      system: SYSTEM_PROMPT,
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
