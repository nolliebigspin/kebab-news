import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("impressum");
  return { title: `${t("page_title")} — kebab.news` };
}

export default async function ImpressumPage() {
  const t = await getTranslations("impressum");

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 font-display text-3xl leading-tight sm:text-4xl">{t("page_title")}</h1>

      <div className="space-y-8 text-base text-ink leading-relaxed">
        <section>
          <h2 className="mb-2 font-display text-lg">{t("tmg_heading")}</h2>
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
          <h2 className="mb-2 font-display text-lg">{t("contact_heading")}</h2>
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
          <h2 className="mb-2 font-display text-lg">{t("responsible_heading")}</h2>
          <p className="text-ink-soft">{t("responsible_body")}</p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg">{t("ai_heading")}</h2>
          <p className="text-ink-soft">{t("ai_body")}</p>
        </section>
      </div>
    </article>
  );
}
