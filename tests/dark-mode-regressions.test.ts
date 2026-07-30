import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readWebSource = (path: string) =>
  readFileSync(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

describe("dark mode regressions", () => {
  it("keeps framing tooltip copy contrasted against its theme-aware background", () => {
    const source = readWebSource("components/ui/framing-tooltip.tsx");

    expect(source).not.toContain('className="block font-semibold text-white"');
    expect(source).not.toContain('className="block text-white/85"');
  });

  it("preserves the wordmark artwork's internal colors in dark mode", () => {
    const source = readWebSource("components/Wordmark.tsx");

    expect(source).not.toContain("dark:brightness-0 dark:invert");
  });
});
