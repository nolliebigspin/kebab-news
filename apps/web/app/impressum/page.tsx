import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("impressum");
  return pageMetadata({
    title: t("page_title"),
    description:
      "Impressum von kebab.news: Anbieterkennzeichnung nach § 5 DDG, Kontakt und Verantwortlicher nach § 18 MStV.",
    path: "/impressum",
  });
}

export default async function ImpressumPage() {
  const t = await getTranslations("impressum");

  return (
    <Container width="prose" as="article" className="py-12 sm:py-16">
      <PageHeader title={t("page_title")} className="mb-10" />

      <div className="space-y-8 text-[1.0625rem] text-ink leading-relaxed">
        <section>
          <h2 className="mb-2 font-display text-xl">{t("tmg_heading")}</h2>
          <p className="text-ink-soft">
            {t("operator_name")} ({t("operator_form")})
            <br />
            {t("operator_street")}
            <br />
            {t("operator_city")}
            <br />
            {t("operator_country")}
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl">{t("contact_heading")}</h2>
          <p className="text-ink-soft">
            {t("contact_email_label")}:{" "}
            <a
              href={`mailto:${t("contact_email")}`}
              className="rounded-sm text-brand-ink underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
            >
              {t("contact_email")}
            </a>
          </p>
          <p className="mt-2 text-ink-mute text-sm">{t("vat_note")}</p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl">{t("responsible_heading")}</h2>
          <p className="text-ink-soft">{t("responsible_body")}</p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl">{t("ai_heading")}</h2>
          <p className="text-ink-soft">{t("ai_body")}</p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl">{t("moderation_heading")}</h2>
          <p className="text-ink-soft">{t("moderation_body")}</p>
        </section>
      </div>
    </Container>
  );
}
