import { DEFAULT_DAYS, parseDays, parseSearch, parseSort, type RawParams } from "./filters";

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
  /** Lookback window in days (by publish date). `null` = no limit. */
  days: number | null;
  sort: ArticleSort;
};

/** Parse (and sanitize) URL searchParams into a typed ArticleFilters. */
export function parseArticleFilters(params: RawParams): ArticleFilters {
  return {
    q: parseSearch(params),
    days: parseDays(params),
    sort: parseSort(params, ARTICLE_SORTS, "recent"),
  };
}

/** True when the filters differ from the default view (used to show "reset"). */
export function isDefaultArticleFilters(f: ArticleFilters): boolean {
  return f.q === "" && f.days === DEFAULT_DAYS && f.sort === "recent";
}
