import { useTranslations } from "next-intl";

export const TrustStatement = () => {
  const t = useTranslations("trustStatement");
  const items = t.raw("items") as { label: string; text: string }[];

  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <h2 className="mb-10 font-mono text-ink-mute text-xs uppercase tracking-[0.14em]">
        {t("heading")}
      </h2>
      <p className="mb-10 max-w-2xl text-base text-ink-soft leading-relaxed">{t("body")}</p>
      <div className="grid gap-6 sm:grid-cols-2">
        {items.map(({ label, text }) => (
          <div key={label} className="flex flex-col gap-2">
            <span className="font-medium text-ink text-sm">{label}</span>
            <span className="text-ink-soft text-sm leading-relaxed">{text}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
