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

      <aside
        className="mb-8 rounded-md border border-line bg-bg-warm px-4 py-3 text-ink-soft text-sm"
        role="note"
      >
        {t("placeholder_notice")}
      </aside>

      <div className="space-y-8 text-base text-ink leading-relaxed">
        <section>
          <h2 className="mb-2 font-display text-lg">{t("tmg_heading")}</h2>
          <p className="text-ink-soft">
            [Name des Betreibers]
            <br />
            [Straße und Hausnummer]
            <br />
            [PLZ und Ort]
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg">{t("contact_heading")}</h2>
          <p className="text-ink-soft">
            E-Mail: [kontakt@kebab.news]
            <br />
            Telefon: [optional]
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg">{t("responsible_heading")}</h2>
          <p className="text-ink-soft">
            [Name]
            <br />
            [Anschrift wie oben]
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg">{t("ai_heading")}</h2>
          <p className="text-ink-soft">{t("ai_body")}</p>
        </section>
      </div>
    </article>
  );
}
