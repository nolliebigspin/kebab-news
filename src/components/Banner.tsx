import { useTranslations } from "next-intl";
import { LuShieldCheck } from "react-icons/lu";

export const Banner = () => {
  const t = useTranslations("banner");

  return (
    <section className="hairline border-y bg-bg-warm py-6">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-6">
        <LuShieldCheck size={16} className="text-accent" strokeWidth={1.75} />
        <p className="text-ink-soft text-sm">
          <span className="font-medium text-ink">{t("bold")}</span> {t("text")}
        </p>
        <span className="mx-1 hidden text-line sm:inline">·</span>
        <span className="whitespace-nowrap font-mono text-ink-mute text-xs">{t("tags")}</span>
      </div>
    </section>
  );
};
