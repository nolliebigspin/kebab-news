import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("datenschutz");
  return { title: `${t("page_title")} — kebab.news` };
}

export default async function DatenschutzPage() {
  const t = await getTranslations("datenschutz");

  const sections = [
    { heading: t("intro_heading"), body: t("intro_body") },
    { heading: t("controller_heading"), body: t("controller_body") },
    { heading: t("hosting_heading"), body: t("hosting_body") },
    { heading: t("database_heading"), body: t("database_body") },
    { heading: t("analytics_heading"), body: t("analytics_body") },
    { heading: t("voting_heading"), body: t("voting_body") },
    { heading: t("rights_heading"), body: t("rights_body") },
  ];

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 font-display text-3xl leading-tight sm:text-4xl">{t("page_title")}</h1>

      <div className="space-y-8 text-base text-ink leading-relaxed">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="mb-2 font-display text-lg">{s.heading}</h2>
            <p className="text-ink-soft">{s.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
