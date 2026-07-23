import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Methodik & Transparenz — kebab.news",
  description:
    "Wie kebab.news Quellen bündelt, Zusammenfassungen erstellt, Framing markiert und Korrekturen behandelt.",
};

const steps = [
  [
    "1",
    "Originalbeiträge erfassen",
    "Wir importieren Schlagzeilen und RSS-Teaser verschiedener deutschsprachiger Medien. Der Name eines Mediums ist kein Qualitätsurteil; Primärquellen sollen erkennbar werden.",
  ],
  [
    "2",
    "Beiträge zu Themen bündeln",
    "Semantische Ähnlichkeit bündelt Originalbeiträge zu Themen. Konservative Schwellen sollen falsche Zusammenführungen vermeiden. Die Zuordnung kann redaktionell korrigiert werden.",
  ],
  [
    "3",
    "Aussagen belegen",
    "Das System extrahiert Aussagen und verknüpft sie mit konkreten Originalbeiträgen. Ohne Beleg wird eine Aussage als unsicher markiert oder verworfen.",
  ],
  [
    "4",
    "Unterschiede zeigen",
    "Abweichende Zahlen, Ursachen, Begriffe, Gewichtungen und fehlender Kontext werden nicht künstlich aufgelöst, sondern nebeneinander dargestellt.",
  ],
  [
    "5",
    "Framing einordnen",
    "Markierungen sind vorsichtige Analysen mit Konfidenz und Prüfstatus. Sie beschreiben mögliche Wirkungen und sind keine objektiven Urteile über ein Medium.",
  ],
  [
    "6",
    "Prüfen und veröffentlichen",
    "Automatische Entwürfe bleiben sichtbar ungeprüft. Veröffentlichung, Aktualisierung und Korrektur werden versioniert und nachvollziehbar dokumentiert.",
  ],
];

export default function MethodPage() {
  return (
    <article className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
      <header className="max-w-3xl">
        <p className="font-mono text-[11px] text-brand-ink uppercase tracking-[0.14em]">
          Methodik & Transparenz
        </p>
        <h1 className="mt-3 text-balance font-display text-4xl sm:text-5xl">
          Vertrauen entsteht nicht durch ein Neutralitätsversprechen.
        </h1>
        <p className="mt-6 text-ink-soft text-lg leading-8">
          kebab.news ist nicht frei von Perspektiven. Deshalb machen wir Quellen, Unsicherheiten und
          Unterschiede sichtbar.
        </p>
      </header>
      <section className="mt-14">
        <h2 className="font-display text-3xl">Von Originalbeiträgen zum Artikel</h2>
        <ol className="mt-7 space-y-5">
          {steps.map(([number, title, body]) => (
            <li
              key={number}
              className="grid gap-3 rounded-xl border border-line-soft p-5 sm:grid-cols-[3rem_1fr]"
            >
              <span className="font-mono text-brand-ink text-xl">{number}</span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-ink-soft text-sm leading-6">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="mt-14 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl">Rolle der KI</h2>
          <p className="mt-3 text-ink-soft text-sm leading-6">
            KI unterstützt Clustering, Extraktion, Zusammenfassung und Framing-Analyse.
            Strukturierte Ausgaben werden validiert. Importierte Originalbeiträge gelten als nicht
            vertrauenswürdige Eingaben; darin enthaltene Anweisungen werden ignoriert. Ein Modell
            kann trotzdem irren oder eigene Verzerrungen reproduzieren.
          </p>
        </div>
        <div>
          <h2 className="font-display text-2xl">Rolle von Menschen</h2>
          <p className="mt-3 text-ink-soft text-sm leading-6">
            Berechtigte Redakteure prüfen Quellenbelege, Zitate, Unsicherheiten, Markierungen und
            Korrekturen. Automatisch erzeugte und geprüfte Inhalte werden unterschiedlich
            gekennzeichnet.
          </p>
        </div>
      </section>
      <section className="mt-14 rounded-2xl bg-bg-warm p-6">
        <h2 className="font-display text-2xl">Grenzen & Fehler</h2>
        <p className="mt-3 text-ink-soft text-sm leading-6">
          RSS-Teaser enthalten nur einen Ausschnitt. Viele Originalbeiträge können dieselbe
          Ursprungsquelle wiederholen. Fehlende Perspektiven sind nicht immer automatisch erkennbar.
          Kurze Zitate bleiben auf das notwendige Maß begrenzt und verlinken zum Original.
        </p>
        <p className="mt-4 text-sm">
          Fehler gefunden?{" "}
          <Link
            href="mailto:contact@awinter.dev"
            className="text-brand-ink underline underline-offset-4"
          >
            Melde ihn mit Artikel-Link und Beleg.
          </Link>{" "}
          Sachliche Korrekturen werden in der Versionshistorie dokumentiert.
        </p>
      </section>
    </article>
  );
}
