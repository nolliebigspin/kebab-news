"use client";

import { useTranslations } from "next-intl";
import { FilterBar, FilterSelect } from "@/components/FilterBar";
import {
  ARTICLE_SORTS,
  type ArticleFilters as ArticleFilterState,
  isDefaultArticleFilters,
} from "@/lib/article-filters";
import { DAY_PRESETS } from "@/lib/filters";

/**
 * Article filter controls: search + date window + sort. No lean axis (operator
 * decision — a finished neutral rewrite is filtered by text/date/sort only).
 * Reuses the shared FilterBar and the radar's filter i18n namespace, with an
 * article-specific sort enum.
 */
export function ArticleFilters({ filters }: { filters: ArticleFilterState }) {
  const t = useTranslations("radar.filters");
  const tArticles = useTranslations("articles.filters");

  return (
    <FilterBar
      filters={filters}
      isDefault={isDefaultArticleFilters(filters)}
      serialize={serialize}
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

function serialize(f: ArticleFilterState): string {
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  params.set("days", f.days === null ? "0" : String(f.days));
  if (f.sort !== "recent") params.set("sort", f.sort);
  return params.toString();
}
