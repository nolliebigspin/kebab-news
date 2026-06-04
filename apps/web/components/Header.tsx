import { GITHUB_URL } from "@kebab/core";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FaGithub } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/Wordmark";

const NAV_LINK =
  "font-mono text-ink-soft text-xs uppercase tracking-[0.12em] transition-colors hover:text-brand";

export const Header = () => {
  const t = useTranslations("header");

  return (
    <header className="hairline border-b px-6 py-4">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-8 gap-y-3">
        <div className="flex flex-1 items-center gap-6 md:flex-none md:gap-10">
          <Wordmark />
          {/* Primary nav. On narrow screens it wraps to its own full-width row
              below the wordmark instead of crunching against the GitHub button. */}
          <nav className="order-last flex w-full items-center gap-6 md:order-0 md:w-auto md:gap-8">
            <Link href="/radar" className={NAV_LINK}>
              {t("radar")}
            </Link>
            <Link href="/artikel" className={NAV_LINK}>
              {t("articles")}
            </Link>
            <Link href="/how-to" className={`${NAV_LINK} md:hidden`}>
              {t("how_to")}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-6 md:gap-8">
          {/* On desktop How-to sits on the right; on mobile it lives in the
              wrapped nav row above, so it's hidden here below md. */}
          <Link href="/how-to" className={`${NAV_LINK} hidden md:inline`}>
            {t("how_to")}
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
