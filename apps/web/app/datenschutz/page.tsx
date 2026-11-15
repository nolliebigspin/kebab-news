import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("datenschutz");
  return pageMetadata({
    title: t("page_title"),
    description:
      "Datenschutzerklärung von kebab.news: welche Daten wir verarbeiten, wofür, und welche Rechte du hast.",
    path: "/datenschutz",
  });
}

export default async function DatenschutzPage() {
  const t = await getTranslations("datenschutz");

  const sections = [
    { heading: t("intro_heading"), body: t("intro_body") },
    { heading: t("controller_heading"), body: t("controller_body") },
    { heading: t("hosting_heading"), body: t("hosting_body") },
    { heading: t("database_heading"), body: t("database_body") },
    { heading: t("analytics_heading"), body: t("analytics_body") },
    { heading: t("account_heading"), body: t("account_body") },
    { heading: t("voting_heading"), body: t("voting_body") },
    { heading: t("rights_heading"), body: t("rights_body") },
  ];

  return (
    <Container width="prose" as="article" className="py-12 sm:py-16">
      <PageHeader title={t("page_title")} className="mb-10" />

      <div className="space-y-8 text-[1.0625rem] text-ink leading-relaxed">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="mb-2 font-display text-xl">{s.heading}</h2>
            <p className="text-ink-soft">{s.body}</p>
          </section>
        ))}
      </div>
    </Container>
  );
}
