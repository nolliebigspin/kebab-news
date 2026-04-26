import { useTranslations } from "next-intl";

export const TrustStatement = () => {
  const t = useTranslations("trustStatement");
  const items = t.raw("items") as { label: string; text: string }[];

  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <h2
        className="mb-10 font-mono text-xs uppercase tracking-[0.14em]"
        style={{ color: "var(--ink-mute)" }}
      >
        {t("heading")}
      </h2>
      <p className="mb-10 max-w-2xl text-base leading-relaxed" style={{ color: "var(--ink-soft)" }}>
        {t("body")}
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        {items.map(({ label, text }) => (
          <div key={label} className="flex flex-col gap-2">
            <span className="font-medium text-sm" style={{ color: "var(--ink)" }}>
              {label}
            </span>
            <span className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              {text}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
