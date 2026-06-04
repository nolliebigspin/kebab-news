import type { ReactNode } from "react";

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
};

/**
 * Shared page hero (h1 + intro line). Used by /radar, /artikel and /how-to so
 * the title size, subtitle treatment and spacing are identical across pages —
 * each page still owns its own outer container width (the radar list is wider
 * than the reading-width article/how-to pages).
 */
export function PageHero({ title, subtitle }: Props) {
  return (
    <header className="mb-10">
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">{title}</h1>
      {subtitle ? (
        <p className="mt-3 max-w-2xl text-base text-ink-soft leading-relaxed">{subtitle}</p>
      ) : null}
    </header>
  );
}
