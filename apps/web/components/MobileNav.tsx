"use client";

import { Dialog } from "@base-ui/react/dialog";
import { GITHUB_URL } from "@kebab/core/site";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { FaGithub } from "react-icons/fa6";
import { FiMenu, FiX } from "react-icons/fi";
import { LogoMark } from "@/components/brand/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { type NavItem, NavLinks } from "@/components/nav/NavLinks";
import { Button } from "@/components/ui/button";

/** Full-height sheet on phones: every destination, big type, account at the bottom. */
export function MobileNav({
  isAuthenticated,
  items,
}: {
  isAuthenticated: boolean;
  items: NavItem[];
}) {
  const t = useTranslations("header");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // App Router keeps this mounted across navigations; close once the new route renders.
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
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-[2px] transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-50 flex w-[min(22rem,88vw)] flex-col bg-bg shadow-2xl transition-transform duration-200 ease-out data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full">
          <div className="flex h-[var(--header-h)] items-center justify-between border-line-soft border-b px-4">
            <Dialog.Title className="flex items-center gap-2 font-semibold text-ink-soft text-sm">
              <LogoMark className="size-6 text-ink" />
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

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            <NavLinks items={items} variant="sheet" />
          </nav>

          <div className="flex items-center gap-3 border-line-soft border-t p-4">
            {isAuthenticated ? (
              <LogoutButton />
            ) : (
              <Button
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
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
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
