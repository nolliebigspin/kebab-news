/**
 * Generic searchParams ↔ filter-state plumbing shared by the radar and article
 * lists. Both surfaces filter on the same three axes — free-text search, a date
 * lookback window, and a sort — and only differ in the extra axes (radar adds
 * `lean`) and the allowed sort values. This module owns the common parts so the
 * two filter modules stay in sync.
 *
 * Kept free of any runtime `@kebab/*` imports: it's pulled into the FilterBar
 * Client Component, and the @kebab/core/@kebab/db barrels transitively bundle
 * server-only deps (postgres, the Anthropic SDK) which break the Turbopack
 * client build.
 */

export type RawParams = Record<string, string | string[] | undefined>;

/** Allowed lookback presets (days). `0` is the sentinel for "all time". */
export const DAY_PRESETS = [1, 7, 30, 90, 0] as const;

/** Default lookback window applied when no `days` param is present. */
export const DEFAULT_DAYS = 7;

/** Take the first value of a (possibly repeated) searchParam. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Trimmed free-text search term from `?q=`. */
export function parseSearch(params: RawParams): string {
  return (firstParam(params.q) ?? "").trim();
}

/**
 * Lookback window in days from `?days=`. `null` = no limit ("all time", the `0`
 * sentinel or any non-positive value). A missing param falls back to
 * DEFAULT_DAYS so the default view is the last week.
 */
export function parseDays(params: RawParams): number | null {
  const raw = firstParam(params.days);
  if (raw === undefined) return DEFAULT_DAYS;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Validate `?sort=` against an allow-list. Falls back to `fallback` (the first
 * entry by convention = the default sort) for any unknown value.
 */
export function parseSort<T extends string>(
  params: RawParams,
  allowed: readonly T[],
  fallback: T
): T {
  const raw = firstParam(params.sort) as T | undefined;
  return raw && allowed.includes(raw) ? raw : fallback;
}
