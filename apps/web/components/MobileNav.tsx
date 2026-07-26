"use client";

import { Dialog } from "@base-ui/react/dialog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { FaGithub } from "react-icons/fa6";
import { FiMenu, FiX } from "react-icons/fi";
import { LogoutButton } from "@/components/LogoutButton";
import { Button } from "@/components/ui/button";

/**
 * Every primary destination, including the ones the desktop header hides
 * behind breakpoints (`/methodik` below `lg`, `/ueber-uns` below `md`).
 * On mobile this sheet is the only way to reach them, so it lists all of them.
 */
const LINKS = [
  { href: "/themen", key: "topics" },
  { href: "/artikel", key: "articles" },
  { href: "/lernen", key: "learn" },
  { href: "/methodik", key: "method" },
  { href: "/ueber-uns", key: "about" },
] as const;

/**
 * `githubUrl` is passed in rather than imported: `@kebab/core`'s barrel
 * re-exports the rewrite pipeline, and pulling it across the client boundary
 * drags the Anthropic SDK and the Postgres driver into the browser bundle.
 */
export function MobileNav({
  isAuthenticated,
  githubUrl,
}: {
  isAuthenticated: boolean;
  githubUrl: string;
}) {
  const t = useTranslations("header");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // App Router keeps this component mounted across navigations, so the sheet
  // has to be closed explicitly once the route it linked to has rendered.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={t("menu_label")}>
            <FiMenu />
          </Button>
        }
      />
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-ink/25 backdrop-blur-[2px] transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none" />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-50 flex w-[min(20rem,85vw)] flex-col bg-bg shadow-2xl transition-transform duration-200 ease-out data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full motion-reduce:transition-none">
          <div className="hairline flex items-center justify-between border-b px-5 py-4">
            <Dialog.Title className="font-mono text-ink-mute text-xs uppercase tracking-[0.12em]">
              {t("nav_label")}
            </Dialog.Title>
            <Dialog.Close
              render={
                <Button variant="ghost" size="icon-sm" aria-label={t("menu_close_label")}>
                  <FiX />
                </Button>
              }
            />
          </div>

          <nav className="flex flex-1 flex-col overflow-y-auto py-2">
            {LINKS.map(({ href, key }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`hairline-soft border-b px-5 py-3.5 font-mono text-sm uppercase tracking-[0.08em] transition-colors focus-visible:outline-2 focus-visible:outline-brand focus-visible:-outline-offset-2 ${
                    isActive
                      ? "bg-brand-wash text-brand-ink"
                      : "text-ink-soft hover:bg-bg-warm hover:text-brand-ink"
                  }`}
                >
                  {t(key)}
                </Link>
              );
            })}
          </nav>

          <div className="hairline flex items-center gap-3 border-t px-5 py-4">
            {isAuthenticated ? (
              <LogoutButton />
            ) : (
              <Button
                size="sm"
                className="flex-1"
                nativeButton={false}
                render={<Link href="/anmelden">{t("login")}</Link>}
              />
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              nativeButton={false}
              aria-label={t("github_label")}
              render={
                <a href={githubUrl} target="_blank" rel="noopener noreferrer">
                  <FaGithub />
                </a>
              }
            />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
