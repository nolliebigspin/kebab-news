import type { OutletLean } from "@/lib/db";

/** Left → right, with `public` (ÖRR) parked last so it doesn't muddy the gradient. */
export const LEAN_ORDER: OutletLean[] = [
  "left",
  "center-left",
  "center",
  "center-right",
  "right",
  "right-fringe",
  "public",
];

/**
 * i18n key suffix per lean — combined with the `radar.lean` namespace at
 * call sites. e.g. `t(`lean.${leanI18nKey(lean)}`)`.
 *
 * Hyphens in enum values are valid i18n keys (next-intl supports them), so
 * the mapping is identity. Kept as a function to allow future renaming
 * without touching callers.
 */
export function leanI18nKey(lean: OutletLean): string {
  return lean;
}
