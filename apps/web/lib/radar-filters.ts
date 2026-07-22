import type { OutletLean } from "@kebab/db";
import {
  DEFAULT_DAYS,
  firstParam,
  parseDays,
  parseSearch,
  parseSort,
  type RawParams,
} from "./filters";

// Lean slugs used to validate the `lean` searchParam. Kept as a local literal
// (rather than imported from @kebab/core) so this module stays free of runtime
// @kebab/* imports — it's pulled into the FilterBar Client Component, and the
// @kebab/core barrel transitively bundles server-only deps. Typed against
// OutletLean so it can't drift from the DB enum without a compile error.
const LEAN_SLUGS: readonly OutletLean[] = [
  "left",
  "center-left",
  "center",
  "center-right",
  "right",
  "right-fringe",
  "public",
];

/**
 * Radar filter state. Lives entirely in the URL searchParams so the filtered
 * view is server-rendered, shareable and bookmarkable — the client form just
 * pushes new params and the server re-queries. Defaults: the last 7 days,
 * newest first.
 */
export type RadarSort = "recent" | "outlets";

export const RADAR_SORTS: readonly RadarSort[] = ["recent", "outlets"];

export type RadarFilters = {
  /** Free-text search across story label + article headlines/teasers. */
  q: string;
  /** Lookback window in days. `null` = no date limit ("all time"). */
  days: number | null;
  /** Only stories covered by this lean; `null` = any lean. */
  lean: OutletLean | null;
  sort: RadarSort;
};

/** Parse (and sanitize) URL searchParams into a typed RadarFilters. */
export function parseRadarFilters(params: RawParams): RadarFilters {
  const leanRaw = firstParam(params.lean);
  const lean = LEAN_SLUGS.includes(leanRaw as OutletLean) ? (leanRaw as OutletLean) : null;

  return {
    q: parseSearch(params),
    days: parseDays(params),
    lean,
    sort: parseSort(params, RADAR_SORTS, "recent"),
  };
}

/** True when the filters differ from the default view (used to show "reset"). */
export function isDefaultRadarFilters(f: RadarFilters): boolean {
  return f.q === "" && f.days === DEFAULT_DAYS && f.lean === null && f.sort === "recent";
}
