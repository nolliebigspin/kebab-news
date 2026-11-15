import { OG_SIZE, renderOgImage } from "@/lib/og";
import { loadTopic } from "@/lib/topics";

export const alt = "kebab.news: Quellenvergleich";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await loadTopic(slug);
  if (!data) return renderOgImage({ kicker: "Quellenvergleich", title: "Thema nicht gefunden" });
  const outlets = new Set(data.contributions.map((item) => item.outletSlug)).size;
  return renderOgImage({
    kicker: `${outlets} Medien im Vergleich`,
    title: data.story.label,
    covered: data.contributions.map((item) => item.outletLean),
  });
}
