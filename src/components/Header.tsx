import Link from "next/link";
import { useTranslations } from "next-intl";
import { FaGithub } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/Wordmark";
import { GITHUB_URL } from "@/lib/constants";

export const Header = () => {
  const t = useTranslations("header");

  return (
    <header className="hairline border-b px-6 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Wordmark />
        <div className="flex items-center gap-4 md:gap-8">
          <Link
            href="/articles"
            className="font-mono text-ink-soft text-xs uppercase tracking-[0.12em] hover:text-brand"
          >
            {t("articles")}
          </Link>
          <Link
            href="/radar"
            className="font-mono text-ink-soft text-xs uppercase tracking-[0.12em] hover:text-brand"
          >
            {t("radar")}
          </Link>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                <FaGithub />
                <span className="font-mono text-xs">{t("github")}</span>
              </a>
            }
          />
        </div>
      </div>
    </header>
  );
};
