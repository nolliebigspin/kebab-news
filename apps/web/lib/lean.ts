import type { OutletLean } from "@kebab/db";

/**
 * Maps a political lean to its spectrum dot colour (CSS var). Shared by the
 * radar list and detail so the colour coding is identical. Left-ish → warm,
 * right-ish → cool, centre → muted, public broadcaster → brand.
 */
export function leanColor(lean: OutletLean): string {
  switch (lean) {
    case "left":
    case "center-left":
      return "var(--left)";
    case "right":
    case "center-right":
    case "right-fringe":
      return "var(--right)";
    case "center":
      return "var(--ink-mute)";
    case "public":
      return "var(--brand)";
  }
}
