import { REWRITE_VOTE_THRESHOLD } from "@kebab/core";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NextRunCountdown } from "@/components/NextRunCountdown";
import { PageHero } from "@/components/PageHero";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("how_to");
  return { title: `${t("page_title")} — kebab.news`, description: t("page_subtitle") };
}

export default async function HowToPage() {
  const t = await getTranslations("how_to");

  const steps = [
    { title: t("step1_title"), body: t("step1_body") },
    { title: t("step2_title"), body: t("step2_body") },
    {
      title: t("step3_title"),
      body: (
        <>
          {t("step3_body_before")}
          <strong className="font-semibold text-ink">{REWRITE_VOTE_THRESHOLD}</strong>
          {t("step3_body_after")}
        </>
      ),
    },
    { title: t("step4_title"), body: t("step4_body") },
  ];

  return (
    <article className="mx-auto max-w-5xl px-6 py-12">
      <PageHero title={t("page_title")} subtitle={t("page_subtitle")} />

      <p className="mb-10 text-base text-ink leading-relaxed">{t("intro")}</p>

      <ol className="space-y-8">
        {steps.map((step) => (
          <li key={step.title}>
            <h2 className="font-display text-ink text-lg">{step.title}</h2>
            <p className="mt-2 text-base text-ink-soft leading-relaxed">{step.body}</p>
          </li>
        ))}
      </ol>

      <section className="mt-12">
        <h2 className="mb-2 font-display text-ink text-lg">{t("schedule_title")}</h2>
        <p className="mb-5 text-base text-ink-soft leading-relaxed">{t("schedule_body")}</p>
        <NextRunCountdown />
      </section>

      <p className="mt-10 border-line-soft border-t pt-6 font-mono text-ink-mute text-xs uppercase tracking-[0.12em]">
        {t("threshold_note", { threshold: REWRITE_VOTE_THRESHOLD })}
      </p>
    </article>
  );
}
