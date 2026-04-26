import { useTranslations } from "next-intl";
import { LuShieldCheck } from "react-icons/lu";

export const Banner = () => {
  const t = useTranslations("banner");

  return (
    <section className="hairline border-y bg-warm py-6" style={{ background: "var(--bg-warm)" }}>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-6">
        <LuShieldCheck size={16} style={{ color: "var(--accent)" }} strokeWidth={1.75} />
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
          <span style={{ color: "var(--ink)" }} className="font-medium">
            {t("bold")}
          </span>{" "}
          {t("text")}
        </p>
        <span className="mx-1 hidden sm:inline" style={{ color: "var(--line)" }}>
          ·
        </span>
        <span className="whitespace-nowrap font-mono text-xs" style={{ color: "var(--ink-mute)" }}>
          {t("tags")}
        </span>
      </div>
    </section>
  );
};
