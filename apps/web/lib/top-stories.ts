/** How many articles the homepage carousel features. */
export const TOP_STORY_COUNT = 5;

/** Articles this close to the newest one count as "current" for ranking. */
export const TOP_STORY_WINDOW_HOURS = 72;

type RankableStory = { id: string; sourceCount: number; updatedAt: Date };

/**
 * The homepage's top stories: among articles from the newest article's
 * window, the broadest independent coverage wins (same priority the worker
 * uses for generation), ties go to the fresher one. The window is anchored on
 * the newest article, not on "now", so a pause in publishing never empties the
 * carousel; short windows are topped up with the next newest articles.
 */
export function pickTopStories<T extends RankableStory>(
  stories: readonly T[],
  count = TOP_STORY_COUNT,
  windowHours = TOP_STORY_WINDOW_HOURS
): T[] {
  if (stories.length === 0) return [];
  const byRecency = [...stories].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  const cutoff = byRecency[0].updatedAt.getTime() - windowHours * 3_600_000;

  const ranked = byRecency
    .filter((story) => story.updatedAt.getTime() >= cutoff)
    .sort((a, b) => b.sourceCount - a.sourceCount || b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, count);

  const picked = new Set(ranked.map((story) => story.id));
  for (const story of byRecency) {
    if (ranked.length >= count) break;
    if (!picked.has(story.id)) ranked.push(story);
  }
  return ranked;
}
