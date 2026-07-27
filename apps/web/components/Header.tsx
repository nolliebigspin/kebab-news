import { GITHUB_URL } from "@kebab/core";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FaGithub } from "react-icons/fa6";
import { LogoutButton } from "@/components/LogoutButton";
import { MobileNav } from "@/components/MobileNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/Wordmark";

// Nav links stay visually quiet beside the filled login action and retain a
// visible focus ring for keyboard users (WCAG 2.4.7).
const NAV_LINK =
  "rounded-md px-1 py-2 font-medium text-ink-soft text-sm transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-3";

export const Header = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const t = useTranslations("header");

  return (
    <header className="sticky top-0 z-40 border-line-soft border-b bg-bg/86 px-5 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/76">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-x-8">
        <div className="flex items-center gap-6 md:gap-10">
          <Wordmark />
          {/* Primary nav. Below `md` it is replaced by the drawer in
              <MobileNav>, which lists every destination including the ones
              hidden here at narrower breakpoints. */}
          <nav aria-label={t("nav_label")} className="hidden items-center gap-6 md:flex md:gap-8">
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
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* The about link sits beside the account actions on wider screens. */}
          <Link href="/ueber-uns" className={`${NAV_LINK} hidden md:inline`}>
            {t("about")}
          </Link>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon-sm"
            nativeButton={false}
            aria-label={t("github_label")}
            className="hidden md:inline-flex"
            render={
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                <FaGithub />
              </a>
            }
          />
          {/* Account actions stay in the bar on desktop; on mobile the drawer
              carries them so the header keeps to a single row. */}
          <div className="hidden md:block">
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
          <div className="md:hidden">
            <MobileNav isAuthenticated={isAuthenticated} githubUrl={GITHUB_URL} />
          </div>
        </div>
      </div>
    </header>
  );
};
