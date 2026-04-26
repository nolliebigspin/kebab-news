import { useTranslations } from "next-intl";

export const HowItWorks = () => {
  const t = useTranslations("howItWorks");
  const steps = t.raw("steps") as { n: string; h: string; b: string }[];

  return (
    <section className="hairline border-y bg-bg-warm">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="mb-10 font-mono text-ink-mute text-xs uppercase tracking-[0.14em]">
          {t("heading")}
        </h2>
        <ol className="grid gap-6 sm:grid-cols-4">
          {steps.map(({ n, h, b }) => (
            <li key={n} className="flex flex-col gap-2">
              <span className="font-mono text-[11px] text-ink-mute">{n}</span>
              <span className="font-medium text-ink text-sm">{h}</span>
              <span className="text-ink-soft text-sm leading-relaxed">{b}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
