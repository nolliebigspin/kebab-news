import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/cards/ArticleCard";
import { FeatureCard } from "@/components/cards/FeatureCard";
import { Container } from "@/components/layout/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/button";
import { Carousel } from "@/components/ui/carousel";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { loadPublishedStoryCards, loadSummaryOutlets } from "@/lib/stories";
import { homePageSchema, itemListSchema } from "@/lib/structured-data";
import { pickTopStories, TOP_STORY_COUNT } from "@/lib/top-stories";

const DESCRIPTION =
  "Aktuelle Nachrichten aus vielen deutschsprachigen Medien, zusammengefasst mit Belegen, offenen Fragen und den Unterschieden zwischen den Quellen.";

const TOP_HEADING = "Top-Nachrichten";
const TOP_EXPLAINER =
  "Ausgewählt nach Breite der Berichterstattung: Je mehr unabhängige Medien über ein aktuelles Ereignis berichten, desto weiter vorn steht es.";

export const metadata: Metadata = {
  ...pageMetadata({ title: SITE.claim, description: DESCRIPTION, path: "/" }),
  // The homepage keeps the brand first: "kebab.news: Viele Quellen …"
  title: { absolute: `${SITE.name}: ${SITE.claim}` },
};

const STEPS = [
  {
    title: "Quellen sammeln",
    body: "Dreimal täglich lesen wir Schlagzeilen und Teaser von 25 deutschsprachigen Medien, von links bis öffentlich-rechtlich.",
  },
  {
    title: "Zu Themen bündeln",
    body: "Berichte über dasselbe Ereignis landen auf einem Spieß. So wird sichtbar, wer berichtet und wer schweigt.",
  },
  {
    title: "Transparent zusammenfassen",
    body: "Sobald genug unabhängige Medien berichten, entsteht ein Artikel: was belegt ist, was offen bleibt, wo Quellen sich widersprechen.",
  },
];

export default async function HomePage() {
  // Enough candidates to rank the top stories and still fill the grid below.
  const cards = await loadPublishedStoryCards(TOP_STORY_COUNT + 12, "rewritten");
  const top = pickTopStories(cards);
  const topIds = new Set(top.map((card) => card.id));
  const rest = cards.filter((card) => !topIds.has(card.id)).slice(0, 12);
  const outlets = await loadSummaryOutlets(top.map((card) => card.id));

  return (
    <>
      <JsonLd
        data={homePageSchema({
          description: DESCRIPTION,
          dateModified: cards[0]?.updatedAt ?? null,
          topStories: itemListSchema(
            top.map((card) => ({ name: card.headline, path: `/artikel/${card.slug}` })),
            { name: `${TOP_HEADING} auf ${SITE.name}`, description: TOP_EXPLAINER, ranked: true }
          ),
          speakableSelectors: ["#claim", "#top-stories h3"],
        })}
      />

      <Container as="section" className="pt-12 pb-16 sm:pt-20 sm:pb-24" aria-labelledby="claim">
        <h1 id="claim" className="max-w-5xl font-display text-hero">
          Viele Quellen.
          <br />
          Eine verständliche Zusammenfassung.
        </h1>
        <p className="mt-6 max-w-2xl text-ink-soft text-lede">
          Wir legen Berichte aus dem ganzen politischen Spektrum nebeneinander und zeigen, was
          belegt ist, was offen bleibt und wo Medien unterschiedlich rahmen.
        </p>

        {top.length > 0 ? (
          <div id="top-stories" className="mt-12 sm:mt-16">
            <Carousel
              label={TOP_HEADING}
              header={
                <>
                  <h2 className="font-display text-title">{TOP_HEADING}</h2>
                  <p className="mt-2 max-w-2xl text-ink-mute text-sm">{TOP_EXPLAINER}</p>
                </>
              }
              slides={top.map((card, index) => ({
                id: card.id,
                label: card.headline,
                content: (
                  <FeatureCard
                    article={card}
                    outlets={outlets.get(card.id) ?? []}
                    animate={index === 0}
                  />
                ),
              }))}
            />
          </div>
        ) : (
          <div className="mt-12 rounded-3xl border border-line border-dashed p-8 sm:p-10">
            <h2 className="font-display text-title">Noch kein Artikel veröffentlicht</h2>
            <p className="mt-2 max-w-xl text-ink-soft">
              Sobald genug Medien über dasselbe Ereignis berichten, erscheint hier die erste
              Zusammenfassung. Bis dahin kannst du die Originalbeiträge vergleichen.
            </p>
            <Button
              className="mt-6"
              variant="outline"
              nativeButton={false}
              render={<Link href="/themen">Themen ansehen</Link>}
            />
          </div>
        )}
      </Container>

      {rest.length > 0 ? (
        <Container as="section" aria-labelledby="latest" className="pb-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 id="latest" className="font-display text-title">
              Weitere Artikel
            </h2>
            <Link
              href="/artikel"
              className="rounded-sm font-semibold text-brand-ink text-sm underline-offset-4 hover:underline"
            >
              Alle Artikel im Archiv
            </Link>
          </div>
          <ul className="grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((card) => (
              <li key={card.id}>
                <ArticleCard
                  slug={card.slug}
                  headline={card.headline}
                  summary={card.summary}
                  sourceCount={card.sourceCount}
                  leans={card.leans}
                  date={card.updatedAt}
                  corrected={card.status === "corrected"}
                />
              </li>
            ))}
          </ul>
        </Container>
      ) : null}

      <section aria-labelledby="how" className="bg-ink text-bg">
        <Container className="py-16 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="how" className="font-display text-title">
              So entsteht ein Artikel
            </h2>
            <Link
              href="/methodik"
              className="rounded-sm font-semibold text-sm underline decoration-2 decoration-brand underline-offset-4 hover:decoration-saffron"
            >
              Methodik im Detail
            </Link>
          </div>
          {/* A real sequence, so it is numbered; the skewer threads the steps. */}
          <ol className="relative mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
            <span
              aria-hidden
              className="absolute top-4 bottom-4 left-[15px] w-1 rounded-full bg-brand md:top-[15px] md:right-0 md:bottom-auto md:left-0 md:h-1 md:w-auto"
            />
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative flex gap-4 md:flex-col">
                <span className="tabular grid size-8 shrink-0 place-items-center rounded-full bg-saffron font-bold text-[#0f1b2d] text-sm ring-4 ring-ink">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-display text-xl">{step.title}</h3>
                  <p className="mt-2 text-bg/75 leading-relaxed">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <Container as="section" aria-labelledby="learn" className="py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <h2 id="learn" className="font-display text-title">
              Wer handelt, und wer verschwindet im Passiv?
            </h2>
            <p className="mt-4 max-w-xl text-ink-soft text-lede">
              Kurze Lektionen zeigen, wie Wortwahl, Auslassungen und Grammatik Wahrnehmung
              verschieben, ohne Medien pauschal in gut und schlecht einzuteilen.
            </p>
            <Button
              className="mt-6"
              variant="outline"
              nativeButton={false}
              render={<Link href="/lernen/framing">Lektion öffnen</Link>}
            />
          </div>
          <figure className="grid gap-3 sm:grid-cols-2">
            <blockquote className="rounded-2xl border border-line p-5">
              <p className="font-semibold text-ink-mute text-sm">Aktiv</p>
              <p className="mt-2 font-serif text-xl leading-snug">
                „Die Behörde <span className="mark-highlight">stoppte</span> die Veranstaltung.“
              </p>
            </blockquote>
            <blockquote className="rounded-2xl border border-line p-5">
              <p className="font-semibold text-ink-mute text-sm">Passiv</p>
              <p className="mt-2 font-serif text-xl leading-snug">
                „Die Veranstaltung <span className="mark-highlight">wurde gestoppt</span>.“
              </p>
            </blockquote>
            <figcaption className="text-ink-mute text-sm sm:col-span-2">
              Hypothetisches Sprachbeispiel aus der Lektion „Wie Wortwahl Verantwortung verteilt“.
            </figcaption>
          </figure>
        </div>
      </Container>
    </>
  );
}
