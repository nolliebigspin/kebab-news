import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Wie Wortwahl Verantwortung verteilt — kebab.news",
  description: "Eine interaktive Einführung in aktives, passives und wertendes Framing.",
};

export default function FramingLessonPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
      <Link
        href="/lernen"
        className="font-mono text-[11px] text-ink-mute uppercase tracking-[0.12em]"
      >
        ← Lernbereich
      </Link>
      <header className="mt-10">
        <p className="font-mono text-[11px] text-brand-ink uppercase tracking-[0.14em]">
          Lektion · Sprache
        </p>
        <h1 className="mt-3 text-balance font-display text-4xl sm:text-5xl">
          Wie Wortwahl Verantwortung verteilt
        </h1>
        <p className="mt-6 text-ink-soft text-lg leading-8">
          Grammatik wirkt unscheinbar. Doch schon Aktiv und Passiv entscheiden, ob wir eine
          handelnde Person sehen – oder nur ein Ereignis.
        </p>
      </header>
      <section className="mt-12 space-y-5 text-base leading-8">
        <p>
          Vergleiche zwei hypothetische Formulierungen. Sie behaupten kein reales Ereignis und
          dienen ausschließlich als Sprachbeispiel:
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <blockquote className="rounded-xl border border-line p-5">
            <span className="font-mono text-[10px] text-ink-mute uppercase">Aktiv</span>
            <p className="mt-2 text-lg">„Die Behörde stoppte die Veranstaltung.“</p>
          </blockquote>
          <blockquote className="rounded-xl border border-line p-5">
            <span className="font-mono text-[10px] text-ink-mute uppercase">Passiv</span>
            <p className="mt-2 text-lg">„Die Veranstaltung wurde gestoppt.“</p>
          </blockquote>
        </div>
        <p>
          Die aktive Variante benennt Verantwortung. Die passive Variante richtet den Blick stärker
          auf das Ergebnis. Keine Variante ist automatisch falsch; relevant ist, ob die handelnde
          Instanz bekannt und für das Verständnis wichtig ist.
        </p>
      </section>
      <section className="mt-12 rounded-2xl bg-brand-wash p-6">
        <h2 className="font-display text-2xl">Was fällt dir auf?</h2>
        <details className="mt-4 rounded-xl bg-bg p-4">
          <summary className="cursor-pointer font-medium">
            Welche Information fehlt in der passiven Variante?
          </summary>
          <p className="mt-3 text-ink-soft text-sm leading-6">
            Wer die Entscheidung getroffen hat. Das kann unbeabsichtigt sein, Platz sparen oder
            Verantwortung sprachlich verschleiern. Erst der Kontext erlaubt eine belastbare
            Einordnung.
          </p>
        </details>
      </section>
      <section className="mt-12">
        <h2 className="font-display text-2xl">Drei Fragen für die Praxis</h2>
        <ul className="mt-4 list-disc space-y-3 pl-5 text-ink-soft">
          <li>Ist bekannt, wer gehandelt hat?</li>
          <li>Würde das Benennen des Akteurs mein Verständnis verändern?</li>
          <li>Verwenden andere Quellen Aktiv, Passiv oder andere Verantwortungszuschreibungen?</li>
        </ul>
      </section>
    </article>
  );
}
