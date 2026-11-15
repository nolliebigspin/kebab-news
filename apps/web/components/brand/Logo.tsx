import { cn } from "@/lib/utils";

/**
 * The skewer: three news pieces threaded on one line. Drawn on a 32-unit grid
 * so it stays legible at 16px. Ink parts use `currentColor`, the pieces use
 * the petrol and saffron tokens, so it themes itself without filters.
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="none"
    >
      {/* handle ring */}
      <circle cx="16" cy="3.4" r="2.1" stroke="currentColor" strokeWidth="1.7" />
      {/* skewer + tip */}
      <rect x="15.1" y="5.4" width="1.8" height="22" fill="currentColor" />
      <path d="M15.1 27.2h1.8L16 31.4z" fill="currentColor" />
      {/* pieces, top → bottom */}
      <rect x="6" y="7.6" width="20" height="5.6" rx="1.5" fill="currentColor" />
      <rect x="9" y="9.75" width="10" height="1.3" rx="0.65" fill="var(--bg, #fff)" />
      <rect x="3.5" y="14.2" width="25" height="5.8" rx="2.9" fill="var(--brand, #00687a)" />
      <rect x="7" y="16.45" width="18" height="1.3" rx="0.65" fill="var(--bg, #fff)" />
      <rect x="7.5" y="21" width="17" height="5.2" rx="1.5" fill="var(--saffron, #f4b400)" />
    </svg>
  );
}

/** Horizontal lockup: mark + wordmark. The wordmark is real text (a11y, SEO). */
export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-ink", className)}>
      <LogoMark className={compact ? "size-7" : "size-8"} />
      <span
        className={cn(
          "font-display leading-none tracking-[-0.045em]",
          compact ? "text-lg" : "text-[1.35rem]"
        )}
      >
        kebab<span className="text-brand">.news</span>
      </span>
    </span>
  );
}
