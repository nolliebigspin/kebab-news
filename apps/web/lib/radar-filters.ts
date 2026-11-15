import type { OutletLean } from "@kebab/db";
import {
  DEFAULT_DAYS,
  firstParam,
  parseDays,
  parseSearch,
  parseSort,
  type RawParams,
} from "./filters";
import { SPECTRUM } from "./lean";

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
  const lean = SPECTRUM.includes(leanRaw as OutletLean) ? (leanRaw as OutletLean) : null;

  return {
    q: parseSearch(params),
    days: parseDays(params),
    lean,
    sort: parseSort(params, RADAR_SORTS, "recent"),
  };
}

export const DEFAULT_RADAR_FILTERS: RadarFilters = {
  q: "",
  days: DEFAULT_DAYS,
  lean: null,
  sort: "recent",
};

/** True for the default view (the reset button stays hidden). */
export function isDefaultRadarFilters(f: RadarFilters): boolean {
  return (
    f.q === DEFAULT_RADAR_FILTERS.q &&
    f.days === DEFAULT_RADAR_FILTERS.days &&
    f.lean === DEFAULT_RADAR_FILTERS.lean &&
    f.sort === DEFAULT_RADAR_FILTERS.sort
  );
}
