import type { Metadata } from "next";
import { absoluteUrl, SITE } from "@/lib/site";

export const FEED_ALTERNATE = {
  "application/rss+xml": [{ url: "/feed.xml", title: `${SITE.name} – Artikel` }],
};

type PageMetadataInput = {
  /** Page title without the site suffix (the root title template adds it). */
  title: string;
  description: string;
  /** Path of the canonical URL, e.g. "/artikel". */
  path: string;
  /** Absolute or root-relative image URL. Defaults to the site card. */
  image?: string;
  noindex?: boolean;
  /** Override for pages whose content lives at a different canonical URL. */
  canonicalPath?: string;
  openGraph?: NonNullable<Metadata["openGraph"]>;
};

/**
 * Per-page metadata with its own canonical. The root layout deliberately sets
 * no canonical: an inherited one made every page point at the homepage.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  noindex,
  canonicalPath,
  openGraph,
}: PageMetadataInput): Metadata {
  const canonical = absoluteUrl(canonicalPath ?? path);
  // A page's `openGraph` replaces the inherited one, image included (and wins
  // over a route's opengraph-image file), so routes with their own card must
  // pass `image`; everything else falls back to the site card.
  const images = [{ url: image ?? "/opengraph-image", width: 1200, height: 630, alt: title }];
  return {
    title,
    description,
    // Next replaces `alternates` per segment instead of merging, so the feed
    // link has to be repeated here or it disappears from every page.
    alternates: { canonical, types: FEED_ALTERNATE },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      locale: SITE.locale,
      url: canonical,
      title,
      description,
      images,
      ...openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((item) => item.url),
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
