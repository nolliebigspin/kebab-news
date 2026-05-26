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

// i18n key suffix per lean — combined with the `radar.lean` namespace.
// Identity mapping; wrapped in a function to centralize future renames.
export function leanI18nKey(lean: OutletLean): string {
  return lean;
}
