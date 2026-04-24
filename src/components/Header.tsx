import { useTranslations } from "next-intl";
import { GithubIcon } from "@/components/GithubIcon";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Wordmark } from "@/components/Wordmark";
import { GITHUB_URL } from "@/lib/constants";

export const Header = () => {
  const t = useTranslations("header");

  return (
    <header className="hairline border-b px-6 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Wordmark />
        <div className="flex items-center gap-4 md:gap-8">
          <LanguageSwitcher />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hairline inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-(--bg-warm)"
            style={{ color: "var(--ink-soft)" }}
          >
            <GithubIcon />
            <span className="font-mono text-xs">{t("github")}</span>
          </a>
        </div>
      </div>
    </header>
  );
};
