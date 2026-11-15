"use client";

import { useTranslations } from "next-intl";
import { FilterBar, FilterSelect } from "@/components/FilterBar";
import {
  ARTICLE_SORTS,
  type ArticleFilters as ArticleFilterState,
  DEFAULT_ARTICLE_FILTERS,
} from "@/lib/article-filters";
import { DAY_PRESETS } from "@/lib/filters";

/** Article archive controls: search, date window, sort (no lean axis). */
export function ArticleFilters({ filters }: { filters: ArticleFilterState }) {
  const t = useTranslations("radar.filters");
  const tArticles = useTranslations("articles.filters");

  return (
    <FilterBar
      filters={filters}
      defaults={DEFAULT_ARTICLE_FILTERS}
      labels={{
        searchPlaceholder: tArticles("search_placeholder"),
        searchLabel: tArticles("search_label"),
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
            label={t("sort_label")}
            value={filters.sort}
            onChange={(v) => update({ sort: v as ArticleFilterState["sort"] })}
            options={ARTICLE_SORTS.map((s) => ({
              value: s,
              label: tArticles(`sort_option.${s}`),
            }))}
          />
        </>
      )}
    />
  );
}
