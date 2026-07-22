import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowRight, FiLayers, FiSearch, FiShield } from "react-icons/fi";
import { Card } from "@/components/ui/card";
import { loadPublishedStoryCards } from "@/lib/stories";

export const metadata: Metadata = {
  title: "kebab.news — Viele Quellen. Eine verständliche Zusammenfassung.",
  description:
    "Aktuelle Nachrichtenthemen aus mehreren Quellen zusammengefasst – mit Unsicherheiten, Unterschieden und möglichem Framing.",
};

export default async function LandingPage() {
  const stories = await loadPublishedStoryCards();
  return (
    <>
      <section className="overflow-hidden border-line-soft border-b bg-bg-warm/60">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
          <p className="font-mono text-brand-ink text-xs uppercase tracking-[0.18em]">
            We wrapped the news.
          </p>
          <h1 className="mt-5 max-w-4xl text-balance font-display text-5xl leading-[1.02] tracking-tight sm:text-7xl">
            Viele Quellen.
            <br />
            <span className="text-brand-ink">Eine verständliche Zusammenfassung.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-ink-soft text-lg leading-8">
            kebab.news bündelt Berichte zu einer Story und zeigt, was belegt ist, was offen bleibt
            und wo Medien unterschiedlich rahmen.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#aktuell"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 font-medium text-sm text-white hover:bg-brand-ink focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
            >
              Aktuelle Storys <FiArrowRight aria-hidden />
            </a>
            <Link
              href="/methodik"
              className="rounded-full border border-line px-5 py-3 font-medium text-sm hover:border-brand focus-visible:outline-2 focus-visible:outline-brand"
            >
              So arbeiten wir
            </Link>
          </div>
          <ul className="mt-12 grid gap-4 border-line-soft border-t pt-7 text-ink-soft text-sm sm:grid-cols-3">
            <li className="flex gap-3">
              <FiLayers className="mt-0.5 shrink-0 text-brand" aria-hidden />
              <span>
                <strong className="block text-ink">Sources first</strong>Jede wesentliche Aussage
                bleibt zu Quellen rückverfolgbar.
              </span>
            </li>
            <li className="flex gap-3">
              <FiShield className="mt-0.5 shrink-0 text-brand" aria-hidden />
              <span>
                <strong className="block text-ink">Keine falsche Neutralität</strong>Unsicherheit
                und Auswahlentscheidungen werden sichtbar.
              </span>
            </li>
            <li className="flex gap-3">
              <FiSearch className="mt-0.5 shrink-0 text-brand" aria-hidden />
              <span>
                <strong className="block text-ink">Framing untersuchen</strong>Markierungen erklären
                Wortwahl, Kontext und Auslassungen.
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section id="aktuell" className="mx-auto max-w-5xl scroll-mt-6 px-6 py-14 sm:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] text-brand-ink uppercase tracking-[0.14em]">
              Aktuell
            </p>
            <h2 className="mt-2 font-display text-3xl">Die wichtigsten Storys</h2>
          </div>
          <Link href="/artikel" className="text-brand-ink text-sm hover:underline">
            Alle Storys →
          </Link>
        </div>
        {stories.length === 0 ? (
          <div className="rounded-2xl border border-line border-dashed p-10 text-center">
            <h3 className="font-display text-xl">Noch keine Story veröffentlicht</h3>
            <p className="mt-2 text-ink-soft text-sm">
              Sobald eine geprüfte Zusammenfassung bereitsteht, erscheint sie hier.
            </p>
            <Link
              href="/radar"
              className="mt-5 inline-block text-brand-ink text-sm underline underline-offset-4"
            >
              Quellen im Radar ansehen
            </Link>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2">
            {stories.map((story, index) => {
              const summary =
                story.shortSummary.trim() ||
                `${story.body.slice(0, 210)}${story.body.length > 210 ? "…" : ""}`;
              return (
                <li key={story.id} className={index === 0 ? "sm:col-span-2" : ""}>
                  <Card className="h-full gap-0 overflow-hidden py-0 transition hover:border-brand/50">
                    <Link
                      href={`/artikel/${story.slug}`}
                      className={`group flex h-full flex-col p-6 outline-none focus-visible:ring-2 focus-visible:ring-brand ${index === 0 ? "sm:p-8" : ""}`}
                    >
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-ink-mute uppercase tracking-[0.12em]">
                        <span>{story.sourceCount} Quellen</span>
                        <span aria-hidden>·</span>
                        <time dateTime={story.updatedAt.toISOString()}>
                          vor {formatDistanceToNow(story.updatedAt, { locale: de })}
                        </time>
                        {story.status === "corrected" && (
                          <span className="rounded-full bg-warn-wash px-2 py-0.5 text-warn">
                            korrigiert
                          </span>
                        )}
                      </div>
                      <h3
                        className={`mt-4 text-balance font-display leading-tight group-hover:text-brand-ink ${index === 0 ? "text-3xl sm:max-w-3xl sm:text-4xl" : "text-xl"}`}
                      >
                        {story.headline}
                      </h3>
                      <p
                        className={`mt-4 text-ink-soft leading-7 ${index === 0 ? "max-w-3xl text-base" : "text-sm"}`}
                      >
                        {summary}
                      </p>
                      <span className="mt-6 inline-flex items-center gap-2 text-brand-ink text-sm">
                        Story verstehen{" "}
                        <FiArrowRight
                          className="transition-transform group-hover:translate-x-1"
                          aria-hidden
                        />
                      </span>
                    </Link>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="border-line-soft border-t bg-bg-warm/45">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-14 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="font-mono text-[11px] text-brand-ink uppercase tracking-[0.14em]">
              Bias & Framing lernen
            </p>
            <h2 className="mt-2 font-display text-3xl">Bessere Fragen an Nachrichten stellen.</h2>
            <p className="mt-3 max-w-2xl text-ink-soft">
              Kurze Lektionen zeigen, wie Überschriften, Wortwahl, Bilder und Auslassungen
              Wahrnehmung verändern – ohne Medien pauschal in gut oder schlecht einzuteilen.
            </p>
          </div>
          <Link
            href="/lernen"
            className="inline-flex items-center gap-2 rounded-full border border-brand px-5 py-3 text-brand-ink text-sm"
          >
            Lernbereich öffnen <FiArrowRight aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
