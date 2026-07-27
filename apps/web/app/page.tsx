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
  const stories = await loadPublishedStoryCards(12, "rewritten");
  return (
    <>
      <section className="overflow-hidden border-line-soft border-b">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.55fr)] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand-wash/65 px-3 py-1.5 font-mono text-[10px] text-brand-ink uppercase tracking-[0.12em]">
              <span className="size-1.5 rounded-full bg-brand" aria-hidden />
              We wrapped the news.
            </div>
            <h1 className="mt-6 max-w-4xl text-balance font-display text-5xl leading-[0.98] sm:text-6xl lg:text-7xl">
              Viele Quellen.
              <br />
              <span className="text-brand-ink">Eine verständliche Zusammenfassung.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-ink-soft text-lg leading-8">
              kebab.news bündelt Berichte zu einem Thema und zeigt, was belegt ist, was offen bleibt
              und wo Medien unterschiedlich rahmen.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#aktuell"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-primary-foreground text-sm shadow-sm transition-colors hover:bg-brand-ink focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 dark:hover:bg-brand/85"
              >
                Aktuelle Artikel <FiArrowRight aria-hidden />
              </a>
              <Link
                href="/methodik"
                className="rounded-xl border border-line bg-surface-raised px-5 py-3 font-semibold text-sm transition-colors hover:border-brand/50 hover:bg-brand-wash focus-visible:outline-2 focus-visible:outline-brand"
              >
                So arbeiten wir
              </Link>
            </div>
          </div>

          <aside className="surface-shadow rounded-3xl border border-line-soft bg-card p-6 sm:p-7">
            <p className="font-mono text-[10px] text-brand-ink uppercase tracking-[0.12em]">
              Was du hier bekommst
            </p>
            <ul className="mt-6 space-y-6 text-ink-soft text-sm">
              <li className="flex gap-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-wash text-brand-ink">
                  <FiLayers aria-hidden />
                </span>
                <span>
                  <strong className="mb-1 block text-ink">Quellen zuerst</strong>
                  Jede wesentliche Aussage bleibt zum Original rückverfolgbar.
                </span>
              </li>
              <li className="flex gap-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-wash text-brand-ink">
                  <FiShield aria-hidden />
                </span>
                <span>
                  <strong className="mb-1 block text-ink">Keine falsche Neutralität</strong>
                  Unsicherheiten und Unterschiede bleiben sichtbar.
                </span>
              </li>
              <li className="flex gap-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-wash text-brand-ink">
                  <FiSearch aria-hidden />
                </span>
                <span>
                  <strong className="mb-1 block text-ink">Framing untersuchen</strong>
                  Wortwahl, Kontext und Auslassungen werden eingeordnet.
                </span>
              </li>
            </ul>
          </aside>
        </div>
      </section>

      <section id="aktuell" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14 sm:px-6 sm:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] text-brand-ink uppercase tracking-[0.12em]">
              Aktuell
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">Die neuesten Artikel</h2>
          </div>
          <Link href="/artikel" className="text-brand-ink text-sm hover:underline">
            Alle Artikel →
          </Link>
        </div>
        {stories.length === 0 ? (
          <div className="rounded-2xl border border-line border-dashed p-10 text-center">
            <h3 className="font-display text-xl">Noch kein Artikel veröffentlicht</h3>
            <p className="mt-2 text-ink-soft text-sm">
              Sobald eine Zusammenfassung bereitsteht, erscheint sie hier.
            </p>
            <Link
              href="/themen"
              className="mt-5 inline-block text-brand-ink text-sm underline underline-offset-4"
            >
              Themen und Quellen ansehen
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
                  <Card className="h-full gap-0 overflow-hidden py-0 hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-lg">
                    <Link
                      href={`/artikel/${story.slug}`}
                      className={`group flex h-full flex-col p-6 outline-none focus-visible:ring-3 focus-visible:ring-brand/35 ${index === 0 ? "sm:min-h-80 sm:p-9" : "min-h-72"}`}
                    >
                      <div className="flex flex-wrap items-center gap-2.5 text-ink-mute text-xs">
                        <span className="rounded-full bg-bg-warm px-2.5 py-1 font-medium text-ink-soft">
                          {story.sourceCount} Quellen
                        </span>
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
                        className={`mt-5 text-balance font-display leading-[1.08] transition-colors group-hover:text-brand-ink ${index === 0 ? "text-3xl sm:max-w-4xl sm:text-5xl" : "text-2xl"}`}
                      >
                        {story.headline}
                      </h3>
                      <p
                        className={`mt-4 text-ink-soft leading-7 ${index === 0 ? "max-w-3xl text-base" : "text-sm"}`}
                      >
                        {summary}
                      </p>
                      <span className="mt-auto inline-flex items-center gap-2 pt-7 font-semibold text-brand-ink text-sm">
                        Artikel lesen{" "}
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

      <section className="border-line-soft border-t bg-bg-warm/55">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
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
            className="inline-flex items-center gap-2 rounded-xl border border-brand/50 bg-surface-raised px-5 py-3 font-semibold text-brand-ink text-sm transition-colors hover:bg-brand-wash"
          >
            Lernbereich öffnen <FiArrowRight aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
