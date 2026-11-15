"use client";

import { useTranslations } from "next-intl";
import { FilterBar, FilterSelect } from "@/components/FilterBar";
import { DAY_PRESETS } from "@/lib/filters";
import { SPECTRUM } from "@/lib/lean";
import {
  DEFAULT_RADAR_FILTERS,
  RADAR_SORTS,
  type RadarFilters as RadarFilterState,
} from "@/lib/radar-filters";

/** Topic controls: search, date window, lean, sort. */
export function RadarFilters({ filters }: { filters: RadarFilterState }) {
  const t = useTranslations("radar.filters");

  return (
    <FilterBar
      filters={filters}
      defaults={DEFAULT_RADAR_FILTERS}
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
              ...SPECTRUM.map((l) => ({ value: l, label: t(`lean_option.${l}`) })),
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
