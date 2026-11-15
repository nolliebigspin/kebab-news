import { formatDate } from "@/lib/format";
import { OG_SIZE, renderOgImage } from "@/lib/og";
import { loadPublishedStory } from "@/lib/stories";

export const alt = "kebab.news: Zusammenfassung aus vielen Quellen";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await loadPublishedStory(slug);
  if (!data) {
    return renderOgImage({ kicker: "kebab.news", title: "Viele Quellen. Eine Zusammenfassung." });
  }
  return renderOgImage({
    kicker: `${data.summary.sourceCount} Quellen, eine Zusammenfassung`,
    title: data.summary.neutralHeadline,
    covered: data.sources.map((source) => source.outletLean),
    footer: `Stand ${formatDate(data.summary.rewrittenAt, "long")}`,
  });
}
