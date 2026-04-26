import { useTranslations } from "next-intl";
import { LuCode, LuShieldCheck, LuUsers } from "react-icons/lu";
import { PrincipleCard } from "@/components/PrincipleCard";

export const Principles = () => {
  const t = useTranslations("principles");

  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <h2
        className="mb-10 font-mono text-xs uppercase tracking-[0.14em]"
        style={{ color: "var(--ink-mute)" }}
      >
        {t("heading")}
      </h2>
      <div className="grid gap-6 sm:grid-cols-3">
        <PrincipleCard
          icon={<LuShieldCheck size={18} strokeWidth={1.75} />}
          title={t("transparent.title")}
          body={t("transparent.body")}
        />
        <PrincipleCard
          icon={<LuUsers size={18} strokeWidth={1.75} />}
          title={t("community.title")}
          body={t("community.body")}
        />
        <PrincipleCard
          icon={<LuCode size={18} strokeWidth={1.75} />}
          title={t("open.title")}
          body={t("open.body")}
        />
      </div>
    </section>
  );
};
