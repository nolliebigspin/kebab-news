import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowRight, FiBookOpen, FiCheckSquare, FiType } from "react-icons/fi";

export const metadata: Metadata = {
  title: "Bias & Framing lernen — kebab.news",
  description:
    "Kurze, konkrete Lektionen über Medienbias, Framing, Quellenketten und irreführende Darstellungen.",
};

const glossary = [
  ["Framing", "Die Auswahl und Gewichtung sprachlicher oder visueller Deutungsrahmen."],
  [
    "Primärquelle",
    "Material, das dem Ereignis unmittelbar entstammt, etwa ein Beschluss oder Datensatz.",
  ],
  ["False Balance", "Wenn ungleich gut belegte Positionen als gleichwertig dargestellt werden."],
  [
    "Auslassung",
    "Relevanter Kontext, der in einer Darstellung fehlt und dadurch die Wahrnehmung verändert.",
  ],
];

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-14 sm:py-20">
      <header className="max-w-3xl">
        <p className="font-mono text-[11px] text-brand-ink uppercase tracking-[0.14em]">
          Bias & Framing lernen
        </p>
        <h1 className="mt-3 text-balance font-display text-4xl sm:text-5xl">
          Nicht „Welche Seite ist gut?“ – sondern „Wie wirkt diese Darstellung?“
        </h1>
        <p className="mt-6 text-ink-soft text-lg leading-8">
          Vollständige Neutralität ist kaum erreichbar. Wer konkrete Wortwahl, Quellenketten und
          Auslassungen erkennt, kann Nachrichten selbstständiger beurteilen.
        </p>
      </header>
      <section className="mt-14 grid gap-5 sm:grid-cols-2" aria-label="Lektionen">
        <Link
          href="/lernen/framing"
          className="group rounded-2xl border border-line p-6 hover:border-brand focus-visible:outline-2 focus-visible:outline-brand"
        >
          <FiType className="text-2xl text-brand" aria-hidden />
          <p className="mt-5 font-mono text-[10px] text-ink-mute uppercase tracking-[0.12em]">
            Lektion · 6 Minuten
          </p>
          <h2 className="mt-2 font-display text-2xl group-hover:text-brand-ink">
            Wie Wortwahl Verantwortung verteilt
          </h2>
          <p className="mt-3 text-ink-soft text-sm leading-6">
            Aktiv, passiv, wertend oder beschwichtigend: Derselbe Sachverhalt kann sehr
            unterschiedliche Akteure in den Mittelpunkt stellen.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-brand-ink text-sm">
            Lektion starten <FiArrowRight aria-hidden />
          </span>
        </Link>
        <article className="rounded-2xl border border-line-soft bg-bg-warm/50 p-6">
          <FiBookOpen className="text-2xl text-brand" aria-hidden />
          <p className="mt-5 font-mono text-[10px] text-ink-mute uppercase tracking-[0.12em]">
            In Vorbereitung
          </p>
          <h2 className="mt-2 font-display text-2xl">Primärquelle oder Quellenkette?</h2>
          <p className="mt-3 text-ink-soft text-sm leading-6">
            Wie aus einer Originalaussage viele Berichte werden – und warum zehn Artikel manchmal
            nur auf einer einzigen Information beruhen.
          </p>
          <p className="mt-5 text-warn text-xs">
            Redaktionell zu recherchieren; es werden noch keine historischen Beispiele behauptet.
          </p>
        </article>
      </section>
      <section className="mt-16">
        <div className="flex items-center gap-3">
          <FiCheckSquare className="text-brand" aria-hidden />
          <h2 className="font-display text-3xl">Checkliste für kritisches Lesen</h2>
        </div>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            "Wer ist die ursprüngliche Quelle?",
            "Welche Aussage ist Fakt, welche Interpretation?",
            "Welche Wörter lösen gezielt Gefühle aus?",
            "Wer handelt – und wer verschwindet im Passiv?",
            "Welche Zahlen fehlen zum Vergleich?",
            "Welche relevante Perspektive kommt nicht vor?",
          ].map((item, index) => (
            <li key={item} className="flex gap-3 rounded-xl border border-line-soft p-4">
              <span className="font-mono text-brand-ink">{String(index + 1).padStart(2, "0")}</span>
              <span className="text-sm">{item}</span>
            </li>
          ))}
        </ol>
      </section>
      <section className="mt-16">
        <h2 className="font-display text-3xl">Glossar</h2>
        <dl className="mt-6 divide-y divide-line-soft border-line-soft border-y">
          {glossary.map(([term, definition]) => (
            <div key={term} className="grid gap-2 py-5 sm:grid-cols-[10rem_1fr]">
              <dt className="font-semibold">{term}</dt>
              <dd className="text-ink-soft text-sm leading-6">{definition}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
