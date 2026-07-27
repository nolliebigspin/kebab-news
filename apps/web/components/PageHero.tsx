import type { ReactNode } from "react";

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
};

/**
 * Shared page hero (h1 + intro line). Used by /themen and /artikel so
 * the title size, subtitle treatment and spacing are identical across pages —
 * each page still owns its own outer container width.
 */
export function PageHero({ title, subtitle }: Props) {
  return (
    <header className="mb-9 max-w-3xl">
      <div className="mb-4 h-1 w-12 rounded-full bg-brand" aria-hidden />
      <h1 className="text-balance font-display text-4xl leading-[1.05] sm:text-6xl">{title}</h1>
      {subtitle ? (
        <p className="mt-5 max-w-2xl text-base text-ink-soft leading-7 sm:text-lg">{subtitle}</p>
      ) : null}
    </header>
  );
}
