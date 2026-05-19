/**
 * Generate a URL-safe slug for a story. Used at story-create time only —
 * once written we never recompute.
 *
 * Strategy: kebab-case the first ~7 words of the seed text, strip punctuation,
 * append a short random suffix for uniqueness.
 */
export function generateStorySlug(seed: string): string {
  const base = seed
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 7)
    .join("-")
    .replace(/-+/g, "-");

  const suffix = Math.random().toString(36).slice(2, 8);
  const trimmed = base ? base.slice(0, 60) : "story";
  return `${trimmed}-${suffix}`;
}
