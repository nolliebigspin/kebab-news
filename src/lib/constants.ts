// ============================================================================
// Site / public constants
// ============================================================================
export const GITHUB_URL = "https://github.com/nolliebigspin/kebab-news";
export const BASE_URL = "https://kebab.news";

// ============================================================================
// Radar — ingest pipeline tunables
// ============================================================================

/** How many hours back to consider stories candidates for clustering. */
export const STORY_WINDOW_HOURS = 72;

/** Newest N feed items per outlet to consider on each ingest run. */
export const PER_OUTLET_FEED_SCAN = 30;

/**
 * Hard cap on new articles ingested per outlet per run. Each article triggers
 * 1 Voyage embedding + 2 Claude annotation calls, so this directly bounds the
 * wall-clock cost. Anything over the cap stays un-ingested until the next run.
 */
export const MAX_NEW_ARTICLES_PER_OUTLET = 5;

// ============================================================================
// Radar — clustering
// ============================================================================

/**
 * Cosine similarity threshold for attaching a new article to an existing
 * story. Below this, a new story is created. Conservative on purpose —
 * prefer "new story over wrong merge" since the latter is harder to spot
 * visually in the radar UI.
 */
export const DEFAULT_CLUSTER_THRESHOLD = 0.78;

// ============================================================================
// Radar — embeddings (Voyage AI)
// ============================================================================

/**
 * Embedding dimensions. The pgvector column size is wired to this constant
 * in src/lib/db/schema.ts — changing this requires a migration.
 */
export { EMBEDDING_DIMENSIONS } from "@/lib/db/schema";

export const VOYAGE_MODEL = "voyage-3-lite";
export const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";

// ============================================================================
// Radar — annotation (Claude)
// ============================================================================

export const ANNOTATION_MODEL = "claude-opus-4-7";

/** Max framing spans per text. Claude is told this in the system prompt. */
export const MAX_ANNOTATION_SPANS = 10;

export const ANNOTATION_SYSTEM_PROMPT = [
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
