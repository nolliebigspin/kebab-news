import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArticleFilters } from "@/components/ArticleFilters";
import { ArticleCard } from "@/components/cards/ArticleCard";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { isDefaultArticleFilters, parseArticleFilters } from "@/lib/article-filters";
import { pageMetadata } from "@/lib/seo";
import { loadPublishedStoryCards } from "@/lib/stories";
import { itemListSchema } from "@/lib/structured-data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("articles");
  return pageMetadata({
    title: t("page_title"),
    description: t("page_subtitle"),
    path: "/artikel",
  });
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("articles");
  const filters = parseArticleFilters(await searchParams);
  const cards = await loadPublishedStoryCards(100, "published", filters);

  return (
    <Container className="py-12 sm:py-16">
      {isDefaultArticleFilters(filters) && cards.length > 0 ? (
        <JsonLd
          data={itemListSchema(
            cards
              .slice(0, 30)
              .map((card) => ({ name: card.headline, path: `/artikel/${card.slug}` }))
          )}
        />
      ) : null}
      <PageHeader title={t("page_title")} lede={t("page_subtitle")} className="mb-10" />
      <ArticleFilters filters={filters} />

      {cards.length === 0 ? (
        <p className="text-ink-soft text-lede">{filters.q ? t("empty_search") : t("empty")}</p>
      ) : (
        <ul className="grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <li key={card.id}>
              <ArticleCard
                slug={card.slug}
                headline={card.headline}
                summary={card.summary}
                sourceCount={card.sourceCount}
                leans={card.leans}
                date={card.publishedAt ?? card.updatedAt}
                corrected={card.status === "corrected"}
                headingLevel="h2"
              />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
