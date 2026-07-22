import { BASE_URL } from "@kebab/core";
import { loadPublishedStoryCards } from "@/lib/stories";

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
  const items = stories
    .map((story) => {
      const description = story.shortSummary.trim() || story.body.slice(0, 400);
      return `<item><title>${escapeXml(story.headline)}</title><link>${BASE_URL}/artikel/${encodeURIComponent(story.slug)}</link><guid isPermaLink="true">${BASE_URL}/artikel/${encodeURIComponent(story.slug)}</guid><pubDate>${(story.publishedAt ?? story.updatedAt).toUTCString()}</pubDate><description>${escapeXml(description)}</description></item>`;
    })
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>kebab.news</title><link>${BASE_URL}</link><description>Viele Quellen. Eine verständliche Zusammenfassung.</description><language>de</language>${items}</channel></rss>`;
  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=900",
    },
  });
}
