type TextAnchor = { quote: string; prefix?: string; suffix?: string };

/**
 * Resolve a text-quote anchor after small edits. Context wins when the quote
 * occurs more than once; an ambiguous match is deliberately rejected instead
 * of highlighting the wrong passage.
 */
export function resolveTextAnchor(
  text: string,
  anchor: TextAnchor
): { start: number; end: number } | null {
  if (!anchor.quote.trim()) return null;
  const matches: number[] = [];
  let cursor = 0;
  while (cursor <= text.length - anchor.quote.length) {
    const index = text.indexOf(anchor.quote, cursor);
    if (index === -1) break;
    matches.push(index);
    cursor = index + 1;
  }

  if (matches.length === 0) return null;
  if (matches.length === 1) {
    return { start: matches[0], end: matches[0] + anchor.quote.length };
  }

  const contextualMatches = matches.filter((start) => {
    const prefixMatches = anchor.prefix
      ? text.slice(Math.max(0, start - anchor.prefix.length), start) === anchor.prefix
      : true;
    const suffixMatches = anchor.suffix
      ? text.slice(
          start + anchor.quote.length,
          start + anchor.quote.length + anchor.suffix.length
        ) === anchor.suffix
      : true;
    return prefixMatches && suffixMatches;
  });

  if (contextualMatches.length !== 1) return null;
  return {
    start: contextualMatches[0],
    end: contextualMatches[0] + anchor.quote.length,
  };
}
