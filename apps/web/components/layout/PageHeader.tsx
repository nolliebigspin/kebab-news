import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared page header: h1 + lede. Replaces the per-page hand-built headers.
 * The skewer bar on the left edge is the one brand accent.
 */
export function PageHeader({
  title,
  lede,
  children,
  className,
}: {
  title: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("relative max-w-3xl border-brand border-l-4 pl-5 sm:pl-7", className)}>
      <h1 className="font-display text-display">{title}</h1>
      {lede ? <p className="mt-4 max-w-2xl text-ink-soft text-lede">{lede}</p> : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </header>
  );
}
