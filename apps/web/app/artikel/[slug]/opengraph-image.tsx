import { ImageResponse } from "next/og";
import { loadPublishedStory } from "@/lib/stories";

export const alt = "kebab.news Artikel-Zusammenfassung";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await loadPublishedStory(slug);
  const title = data?.summary.neutralHeadline ?? "Viele Quellen. Eine Zusammenfassung.";
  const sourceCount = data?.summary.sourceCount ?? 0;
  const updated = data?.summary.rewrittenAt
    ? new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(data.summary.rewrittenAt)
    : null;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#f9f8f3",
        color: "#18212f",
        padding: "70px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 30,
        }}
      >
        <strong>kebab.news</strong>
        <span style={{ color: "#287c78" }}>We wrapped the news.</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{ color: "#287c78", fontSize: 24, textTransform: "uppercase", letterSpacing: 2 }}
        >
          {sourceCount} Quellen · eine Zusammenfassung
        </div>
        <div
          style={{
            marginTop: 22,
            fontSize: 58,
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: -2,
          }}
        >
          {title}
        </div>
      </div>
      <div
        style={{ display: "flex", justifyContent: "space-between", color: "#5c6674", fontSize: 23 }}
      >
        <span>Unterschiede und Unsicherheiten transparent</span>
        {updated && <span>Aktualisiert {updated}</span>}
      </div>
    </div>,
    size
  );
}
