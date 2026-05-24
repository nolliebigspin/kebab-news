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
export const PER_OUTLET_FEED_SCAN = 5;

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

/**
 * A story only shows on the /radar list once at least this many DISTINCT
 * outlets (not articles) have covered it. The whole point of the radar is
 * "the same story across the spectrum"; one outlet on its own isn't a
 * spectrum, so we hide solo-coverage stories until others catch up.
 *
 * The detail page (/radar/[slug]) is always reachable via direct URL —
 * the filter only hides them from the list.
 */
export const RADAR_MIN_OUTLETS = 5;

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

// ============================================================================
// Radar — neutral rewrite (Claude)
// ============================================================================

export const REWRITE_MODEL = "claude-opus-4-7";

/**
 * Version stamp persisted on every generated rewrite. Bump whenever the
 * REWRITE_SYSTEM_PROMPT changes meaningfully — lets us identify outputs
 * that came from a prior prompt and re-run them if needed.
 */
export const REWRITE_PROMPT_VERSION = "v1-2026-05";

/** Target length of the neutral body in words. Claude is told this. */
export const REWRITE_TARGET_WORDS_MIN = 200;
export const REWRITE_TARGET_WORDS_MAX = 400;

export const REWRITE_SYSTEM_PROMPT = [
  "Du bist ein neutraler Nachrichten-Redakteur für deutschsprachige Lesende.",
  "Aufgabe: Aus mehreren Outlet-Versionen derselben Geschichte (Schlagzeilen, Teaser, ggf. Volltexte)",
  "eine einzige, sachlich-neutrale Fassung schreiben.",
  "",
  "Output-Regeln:",
  "- neutral_headline: kurze, sachliche Schlagzeile (max ~12 Wörter). Keine geladenen Begriffe.",
  '  Keine Adjektive mit Wertung ("skandalös", "dramatisch", "mutig", "verzweifelt").',
  `- neutral_body: Fließtext in Standarddeutsch, ${REWRITE_TARGET_WORDS_MIN}–${REWRITE_TARGET_WORDS_MAX} Wörter.`,
  "  Reine Berichterstattung: wer, was, wann, wo, warum, wie. Keine Bewertung.",
  "  Keine direkten Zitate aus den Quellen (Paraphrase ist erlaubt und gewünscht).",
  '  Keine eigene Position der Redaktion. Kein "wir glauben", "es ist klar dass", o.ä.',
  "",
  "Inhaltliche Regeln:",
  "- Nur Tatsachen aufnehmen, die in mindestens einer Quelle belegt sind.",
  '- Wenn Quellen sich widersprechen: beide Versionen nennen mit "laut X / laut Y".',
  "- Wenn eine politische Seite eine Geschichte gar nicht abdeckt, das nicht thematisieren — keine Meta-Berichterstattung.",
  "- Keine Spekulation über Motive identifizierbarer Personen, wenn nicht direkt belegt.",
  '- Bei umstrittenen Aussagen zu Personen oder Organisationen: konjunktivisch ("laut Quelle X soll …").',
  "",
  "Sprachliche Regeln:",
  "- Standarddeutsch, keine Umgangssprache, keine Boulevard-Floskeln.",
  "- Aktiv vor Passiv, sofern es nicht den Sinn verändert.",
  "- Zahlen, Namen, Daten exakt aus den Quellen übernehmen.",
  "- Keine Anglizismen, wenn es ein etabliertes deutsches Wort gibt.",
  "",
  "Wenn die Quellenlage zu dünn für eine seriöse Fassung ist: leeres neutral_body-Feld",
  '  zurückgeben mit einem neutral_headline, der das Problem benennt (z. B. "Quellenlage unklar").',
].join("\n");
