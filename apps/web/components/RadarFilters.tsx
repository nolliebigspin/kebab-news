"use client";

import { useTranslations } from "next-intl";
import { FilterBar, FilterSelect } from "@/components/FilterBar";
import { DAY_PRESETS } from "@/lib/filters";
import {
  isDefaultRadarFilters,
  RADAR_SORTS,
  type RadarFilters as RadarFilterState,
} from "@/lib/radar-filters";

/**
 * Radar filter controls: search + date window + lean + sort. The shared
 * FilterBar owns the search box, URL push and reset; this wires the radar's
 * own selects and serialization.
 *
 * `leanOptions` is passed from the Server Component rather than imported from
 * `@kebab/core` here — that barrel transitively pulls server-only deps that
 * must not be bundled into a Client Component.
 */
export function RadarFilters({
  filters,
  leanOptions,
}: {
  filters: RadarFilterState;
  leanOptions: string[];
}) {
  const t = useTranslations("radar.filters");

  return (
    <FilterBar
      filters={filters}
      isDefault={isDefaultRadarFilters(filters)}
      serialize={serialize}
      labels={{
        searchPlaceholder: t("search_placeholder"),
        searchLabel: t("search_label"),
        reset: t("reset"),
      }}
      controls={(update) => (
        <>
          <FilterSelect
            label={t("date_label")}
            value={filters.days === null ? "0" : String(filters.days)}
            onChange={(v) => update({ days: v === "0" ? null : Number(v) })}
            options={DAY_PRESETS.map((d) => ({ value: String(d), label: t(`date_option.${d}`) }))}
          />
          <FilterSelect
            label={t("lean_label")}
            value={filters.lean ?? ""}
            onChange={(v) => update({ lean: v === "" ? null : (v as RadarFilterState["lean"]) })}
            options={[
              { value: "", label: t("lean_any") },
              ...leanOptions.map((l) => ({ value: l, label: t(`lean_option.${l}`) })),
            ]}
          />
          <FilterSelect
            label={t("sort_label")}
            value={filters.sort}
            onChange={(v) => update({ sort: v as RadarFilterState["sort"] })}
            options={RADAR_SORTS.map((s) => ({ value: s, label: t(`sort_option.${s}`) }))}
          />
        </>
      )}
    />
  );
}

// Always serialize `days` so a non-default window survives; the server treats a
// missing param as the 7-day default. Drop params that equal their default.
function serialize(f: RadarFilterState): string {
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  params.set("days", f.days === null ? "0" : String(f.days));
  if (f.lean) params.set("lean", f.lean);
  if (f.sort !== "recent") params.set("sort", f.sort);
  return params.toString();
}
