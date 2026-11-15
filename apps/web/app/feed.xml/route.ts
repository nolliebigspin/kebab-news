import { absoluteUrl, SITE } from "@/lib/site";
import { loadPublishedStoryCards } from "@/lib/stories";

export const revalidate = 900;

function escapeXml(value: string) {
  return value.replace(
    /[<>&'"]/g,
    (character) =>
      ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character] ??
      character
  );
}

export async function GET() {
  const stories = await loadPublishedStoryCards(50);
  const lastBuild = stories[0]?.updatedAt ?? new Date();
  const items = stories
    .map((story) => {
      const url = absoluteUrl(`/artikel/${encodeURIComponent(story.slug)}`);
      return `<item><title>${escapeXml(story.headline)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${(story.publishedAt ?? story.updatedAt).toUTCString()}</pubDate><description>${escapeXml(story.summary)}</description><category>${story.sourceCount} Quellen</category></item>`;
    })
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${SITE.name}</title><link>${SITE.url}</link><atom:link href="${absoluteUrl("/feed.xml")}" rel="self" type="application/rss+xml"/><description>${escapeXml(SITE.claim)}</description><language>de</language><lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate><image><url>${absoluteUrl("/apple-icon")}</url><title>${SITE.name}</title><link>${SITE.url}</link></image>${items}</channel></rss>`;
  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=900",
    },
  });
}
