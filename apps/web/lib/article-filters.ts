import { parseDays, parseSearch, parseSort, type RawParams } from "./filters";

/**
 * Article (published-rewrite) filter state. Same URL-driven model as the radar
 * filters, but no lean axis — a finished neutral rewrite is filtered by text,
 * publish date and sort only (operator decision).
 */
export type ArticleSort = "recent" | "sources";

export const ARTICLE_SORTS: readonly ArticleSort[] = ["recent", "sources"];

export type ArticleFilters = {
  /** Free-text search across neutral headline + body. */
  q: string;
  /** Lookback window in days (by publish date). `null` = no limit (the default:
   * the archive must never look empty just because nothing was published this week). */
  days: number | null;
  sort: ArticleSort;
};

/** Parse (and sanitize) URL searchParams into a typed ArticleFilters. */
export function parseArticleFilters(params: RawParams): ArticleFilters {
  return {
    q: parseSearch(params),
    days: parseDays(params, null),
    sort: parseSort(params, ARTICLE_SORTS, "recent"),
  };
}

export const DEFAULT_ARTICLE_FILTERS: ArticleFilters = { q: "", days: null, sort: "recent" };

/** True for the default view (the reset button stays hidden). */
export function isDefaultArticleFilters(f: ArticleFilters): boolean {
  return (
    f.q === DEFAULT_ARTICLE_FILTERS.q &&
    f.days === DEFAULT_ARTICLE_FILTERS.days &&
    f.sort === DEFAULT_ARTICLE_FILTERS.sort
  );
}
