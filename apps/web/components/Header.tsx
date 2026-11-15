import Link from "next/link";
import { useTranslations } from "next-intl";
import { FiSearch } from "react-icons/fi";
import { Logo } from "@/components/brand/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { MobileNav } from "@/components/MobileNav";
import { NavLinks } from "@/components/nav/NavLinks";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { MOBILE_NAV, PRIMARY_NAV } from "@/lib/site";

export const Header = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const t = useTranslations("header");
  const primary = PRIMARY_NAV.map((item) => ({ href: item.href, label: t(item.key) }));
  const mobile = MOBILE_NAV.map((item) => ({ href: item.href, label: t(item.key) }));

  return (
    <header className="sticky top-0 z-40 border-line-soft border-b bg-bg/90 backdrop-blur-lg supports-[backdrop-filter]:bg-bg/75">
      <div className="mx-auto flex h-[var(--header-h)] max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <div className="flex items-center gap-8 lg:gap-12">
          <Link
            href="/"
            aria-label="kebab.news – Startseite"
            className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <Logo />
          </Link>
          <nav aria-label={t("nav_label")} className="hidden items-center gap-5 md:flex lg:gap-7">
            <NavLinks items={primary} />
          </nav>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            nativeButton={false}
            aria-label={t("search_label")}
            render={
              <Link href="/artikel#suche">
                <FiSearch />
              </Link>
            }
          />
          <ThemeToggle />
          <div className="ml-2 hidden md:block">
            {isAuthenticated ? (
              <LogoutButton />
            ) : (
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={<Link href="/anmelden">{t("login")}</Link>}
              />
            )}
          </div>
          <div className="md:hidden">
            <MobileNav isAuthenticated={isAuthenticated} items={mobile} />
          </div>
        </div>
      </div>
    </header>
  );
};
