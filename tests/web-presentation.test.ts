import { LEAN_ORDER } from "@kebab/core";
import { describe, expect, it } from "vitest";
import { DEFAULT_ARTICLE_FILTERS, parseArticleFilters } from "../apps/web/lib/article-filters";
import { serializeFilters } from "../apps/web/lib/filters";
import { formatDate, formatRelative } from "../apps/web/lib/format";
import { orderLeans, SPECTRUM } from "../apps/web/lib/lean";
import { DEFAULT_RADAR_FILTERS, parseRadarFilters } from "../apps/web/lib/radar-filters";
import { pageMetadata } from "../apps/web/lib/seo";
import { absoluteUrl } from "../apps/web/lib/site";
import { pickTopStories } from "../apps/web/lib/top-stories";

describe("reader-facing dates", () => {
  const now = new Date("2026-11-15T12:00:00Z");

  it("uses German dative for relative ages", () => {
    expect(formatRelative(new Date("2026-10-28T12:00:00Z"), now)).toBe("vor 18 Tagen");
    expect(formatRelative(new Date("2026-11-15T09:00:00Z"), now)).toBe("vor 3 Stunden");
    expect(formatRelative(new Date("2026-11-15T11:59:30Z"), now)).toBe("gerade eben");
  });

  it("pins absolute dates to Europe/Berlin regardless of the server zone", () => {
    // 23:30 UTC on 31 Dec is already New Year in Berlin.
    expect(formatDate(new Date("2026-12-31T23:30:00Z"), "short")).toBe("01.01.2027");
  });
});

describe("filters", () => {
  it("keeps the article archive unbounded by default so it never looks empty", () => {
    expect(parseArticleFilters({}).days).toBeNull();
    expect(parseRadarFilters({}).days).toBe(7);
  });

  it("omits default values from the query string", () => {
    expect(serializeFilters(DEFAULT_ARTICLE_FILTERS, DEFAULT_ARTICLE_FILTERS)).toBe("");
    expect(serializeFilters(DEFAULT_RADAR_FILTERS, DEFAULT_RADAR_FILTERS)).toBe("");
    expect(serializeFilters({ ...DEFAULT_ARTICLE_FILTERS, days: 7 }, DEFAULT_ARTICLE_FILTERS)).toBe(
      "days=7"
    );
    expect(serializeFilters({ ...DEFAULT_RADAR_FILTERS, days: null }, DEFAULT_RADAR_FILTERS)).toBe(
      "days=0"
    );
  });
});

describe("spectrum", () => {
  it("follows the core lean order", () => {
    expect(SPECTRUM).toEqual(LEAN_ORDER);
    expect(orderLeans(["public", "left", "left", "right"])).toEqual(["left", "right", "public"]);
  });
});

describe("page metadata", () => {
  it("gives every page its own canonical instead of inheriting the homepage", () => {
    const meta = pageMetadata({ title: "Artikel", description: "x", path: "/artikel" });
    expect(meta.alternates?.canonical).toBe(absoluteUrl("/artikel"));
    expect(meta.alternates?.types).toHaveProperty("application/rss+xml");
  });

  it("can point duplicate content at its canonical page and opt out of indexing", () => {
    const meta = pageMetadata({
      title: "Thema",
      description: "x",
      path: "/themen/a",
      canonicalPath: "/artikel/a",
      noindex: true,
    });
    expect(meta.alternates?.canonical).toBe(absoluteUrl("/artikel/a"));
    expect(meta.robots).toEqual({ index: false, follow: true });
  });
});

describe("homepage top stories", () => {
  const story = (id: string, sourceCount: number, iso: string) => ({
    id,
    sourceCount,
    updatedAt: new Date(iso),
  });

  it("ranks current stories by breadth of coverage, then freshness", () => {
    const stories = [
      story("new-narrow", 3, "2026-11-15T12:00:00Z"),
      story("broad", 9, "2026-11-14T12:00:00Z"),
      story("mid", 5, "2026-11-15T06:00:00Z"),
      story("mid-older", 5, "2026-11-13T18:00:00Z"),
      story("old-broad", 20, "2026-11-01T12:00:00Z"),
    ];
    expect(pickTopStories(stories, 4).map((s) => s.id)).toEqual([
      "broad",
      "mid",
      "mid-older",
      "new-narrow",
    ]);
  });

  it("anchors the window on the newest article and tops up with older ones", () => {
    // A publishing pause: everything is weeks old, the carousel still fills.
    const stories = [
      story("a", 4, "2026-10-28T12:00:00Z"),
      story("b", 6, "2026-10-27T12:00:00Z"),
      story("c", 12, "2026-10-01T12:00:00Z"),
      story("d", 2, "2026-09-30T12:00:00Z"),
    ];
    expect(pickTopStories(stories, 3).map((s) => s.id)).toEqual(["b", "a", "c"]);
    expect(pickTopStories([], 5)).toEqual([]);
  });
});
