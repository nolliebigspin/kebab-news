import { GITHUB_URL } from "@kebab/core";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FaGithub } from "react-icons/fa6";
import { LogoutButton } from "@/components/LogoutButton";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/Wordmark";

// Nav links: quiet, uppercase, mono — and a visible focus ring for keyboard
// users (WCAG 2.4.7). The login action is deliberately NOT styled like these;
// it's a filled primary button below so it reads as the main call to action.
const NAV_LINK =
  "rounded-sm font-mono text-ink-soft text-xs uppercase tracking-[0.12em] transition-colors hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-4";

export const Header = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const t = useTranslations("header");

  return (
    <header className="hairline border-b px-6 py-4">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-8 gap-y-3">
        <div className="flex flex-1 items-center gap-6 md:flex-none md:gap-10">
          <Wordmark />
          {/* Primary nav. On narrow screens it wraps to its own full-width row
              below the wordmark instead of crunching against the actions. */}
          <nav
            aria-label={t("nav_label")}
            className="order-last flex w-full items-center gap-6 md:order-0 md:w-auto md:gap-8"
          >
            <Link href="/themen" className={NAV_LINK}>
              {t("topics")}
            </Link>
            <Link href="/artikel" className={NAV_LINK}>
              {t("articles")}
            </Link>
            <Link href="/lernen" className={NAV_LINK}>
              {t("learn")}
            </Link>
            <Link href="/methodik" className={`${NAV_LINK} hidden lg:inline`}>
              {t("method")}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4 md:gap-5">
          {/* The about link sits beside the account actions on wider screens. */}
          <Link href="/ueber-uns" className={`${NAV_LINK} hidden md:inline`}>
            {t("about")}
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            nativeButton={false}
            aria-label={t("github_label")}
            render={
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                <FaGithub />
              </a>
            }
          />
          {isAuthenticated ? (
            <LogoutButton />
          ) : (
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href="/anmelden">{t("login")}</Link>}
            />
          )}
        </div>
      </div>
    </header>
  );
};
