// Subpath import: the `@kebab/core` barrel pulls server-only code, this file
// is safe for Client Components.
import { LEAN_ORDER } from "@kebab/core/lean";
import type { OutletLean } from "@kebab/db";

/** Display order of the political spectrum, left → right, public last. */
export const SPECTRUM: readonly OutletLean[] = LEAN_ORDER;

/** Each lean has its own colour token (see `--lean-*` in globals.css). */
export function leanColor(lean: OutletLean): string {
  return `var(--lean-${lean})`;
}

/** Leans present in `covered`, in spectrum order and without duplicates. */
export function orderLeans(covered: Iterable<OutletLean>): OutletLean[] {
  const set = new Set(covered);
  return SPECTRUM.filter((lean) => set.has(lean));
}
