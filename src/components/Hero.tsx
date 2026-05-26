import { useTranslations } from "next-intl";
import { FaGithub } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { GITHUB_URL } from "@/lib/constants";

export const Hero = () => {
  const t = useTranslations("hero");

  return (
    <section className="mx-auto flex min-h-[calc(100vh-var(--header-h,64px)-var(--footer-h,72px))] max-w-5xl flex-col items-start justify-center px-6 py-24">
      <h1
        className="mb-6 max-w-3xl font-display text-5xl leading-[1.05] sm:text-6xl"
        style={{ textWrap: "balance" } as React.CSSProperties}
      >
        {t("tagline")}
      </h1>

      <p
        className="mb-8 font-display text-2xl text-brand sm:text-3xl"
        style={{ textWrap: "balance" } as React.CSSProperties}
      >
        {t("tagline_accent")}
      </p>

      <p className="mb-8 max-w-2xl border-brand border-l-2 pl-4 text-base text-ink italic leading-relaxed">
        {t("stance")}
      </p>

      <p className="mb-12 max-w-2xl text-base text-ink-soft leading-relaxed">
        {t("description_before")}
        <a
          href="https://ground.news"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand hover:underline"
        >
          ground.news
        </a>
        {t("description_after")}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="lg"
          nativeButton={false}
          render={
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <FaGithub />
              {t("cta_github")}
            </a>
          }
        />
      </div>
    </section>
  );
};
