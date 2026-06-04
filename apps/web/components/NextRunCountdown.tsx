"use client";

import { nextRunDate } from "@kebab/core/schedule";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type Remaining = { d: number; h: number; m: number; s: number };

function remainingUntil(target: number, now: number): Remaining {
  const total = Math.max(0, target - now);
  const s = Math.floor(total / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

/**
 * Live "next ingest run" countdown. The schedule (RUN_HOURS_UTC → nextRunDate)
 * is the same single source of truth the worker schedules from, so the number
 * shown here matches what the worker actually does. Rendered client-side
 * because it ticks every second; the target is recomputed once it elapses.
 */
export function NextRunCountdown() {
  const t = useTranslations("how_to");
  // Start from null so the server-rendered HTML and the first client render
  // match (no hydration mismatch) — we only compute once mounted.
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setRemaining(remainingUntil(nextRunDate(new Date(now)).getTime(), now));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  const units: Array<{ value: string; label: string }> = remaining
    ? [
        ...(remaining.d > 0 ? [{ value: String(remaining.d), label: t("countdown_days") }] : []),
        { value: pad(remaining.h), label: t("countdown_hours") },
        { value: pad(remaining.m), label: t("countdown_minutes") },
        { value: pad(remaining.s), label: t("countdown_seconds") },
      ]
    : [];

  return (
    <div className="hairline rounded-lg border bg-bg-warm px-6 py-5">
      <p className="font-mono text-[11px] text-ink-mute uppercase tracking-[0.12em]">
        {t("countdown_label")}
      </p>
      <div className="mt-2 flex items-baseline gap-4 tabular-nums">
        {remaining === null ? (
          <span className="font-display text-3xl text-ink-mute">—</span>
        ) : (
          units.map((u) => (
            <div key={u.label} className="flex items-baseline gap-1">
              <span className="font-display text-3xl text-ink sm:text-4xl">{u.value}</span>
              <span className="font-mono text-ink-mute text-xs uppercase">{u.label}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
