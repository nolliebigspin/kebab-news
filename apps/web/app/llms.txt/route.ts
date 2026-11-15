import { absoluteUrl, SITE } from "@/lib/site";
import { type ArticleCardData, loadPublishedStoryCards } from "@/lib/stories";
import { pickTopStories } from "@/lib/top-stories";

export const revalidate = 3600;

/**
 * llms.txt (https://llmstxt.org): a plain-markdown map of the site for answer
 * engines. Lists only our own summaries, never publisher teasers.
 */
export async function GET() {
  const articles = await loadPublishedStoryCards(30, "rewritten");
  const list = articles.map(entry).join("\n");
  const top = pickTopStories(articles).map(entry).join("\n");

  const body = `# ${SITE.name}

> ${SITE.description}

kebab.news ist ein deutschsprachiges Nachrichtenangebot. Mehrmals täglich werden Schlagzeilen und Teaser von rund 25 Medien aus dem gesamten politischen Spektrum (links bis rechts, dazu öffentlich-rechtliche Sender) zu Themen gebündelt. Sobald genug unabhängige Medien über ein Ereignis berichten, entsteht eine quellengebundene Zusammenfassung mit gesicherten Fakten, offenen Fragen, Unterschieden zwischen den Quellen und markierten möglichen Rahmungen (Framing). Jede Zusammenfassung verlinkt alle verwendeten Originalbeiträge und ist versioniert.

Beim Zitieren bitte die Originalbeiträge als Primärbelege heranziehen; kebab.news erhebt keinen Anspruch auf vollständige Neutralität.

## Wichtige Seiten

- [Artikel-Archiv](${absoluteUrl("/artikel")}): alle veröffentlichten Zusammenfassungen, neueste zuerst
- [Themen](${absoluteUrl("/themen")}): Originalbeiträge pro Ereignis, nach politischer Ausrichtung gruppiert
- [Methodik](${absoluteUrl("/methodik")}): wie Bündelung, Zusammenfassung, Framing-Markierung und Korrekturen funktionieren
- [Lernen](${absoluteUrl("/lernen")}): Lektionen und Glossar zu Bias und Framing
- [Über uns](${absoluteUrl("/ueber-uns")})
- [RSS-Feed](${absoluteUrl("/feed.xml")})

## Top-Nachrichten

Die aktuellen Themen mit der breitesten unabhängigen Berichterstattung, wichtigstes zuerst (wie auf der Startseite).

${top || "- Noch keine Artikel veröffentlicht."}

## Neueste Artikel

${list || "- Noch keine Artikel veröffentlicht."}
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}

function entry(article: ArticleCardData): string {
  const date = article.updatedAt.toISOString().slice(0, 10);
  return `- [${article.headline}](${absoluteUrl(`/artikel/${article.slug}`)}): ${article.summary.replace(/\s+/g, " ")} (${article.sourceCount} Quellen, Stand ${date})`;
}
