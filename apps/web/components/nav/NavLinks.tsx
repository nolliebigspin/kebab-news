"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath } from "@/lib/site";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string };

/**
 * Primary links with an active state (`aria-current` + a petrol skewer bar).
 * Shared by the desktop header and the mobile sheet via `variant`.
 */
export function NavLinks({
  items,
  variant = "bar",
  onNavigate,
}: {
  items: NavItem[];
  variant?: "bar" | "sheet";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <>
      {items.map(({ href, label }) => {
        const active = isActivePath(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40",
              variant === "bar"
                ? "flex h-[var(--header-h)] items-center rounded-sm px-1 font-semibold text-[0.9375rem] after:absolute after:inset-x-1 after:bottom-0 after:h-[3px] after:rounded-full after:bg-brand after:transition-transform"
                : "flex items-center justify-between rounded-xl px-4 py-3.5 font-display text-2xl",
              variant === "bar" &&
                (active
                  ? "text-ink after:scale-x-100"
                  : "text-ink-soft after:scale-x-0 hover:text-ink hover:after:scale-x-50"),
              variant === "sheet" &&
                (active ? "bg-brand-wash text-brand-ink" : "text-ink hover:bg-bg-warm")
            )}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}
