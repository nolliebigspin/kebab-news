import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/badge";
import { pageMetadata } from "@/lib/seo";
import { definedTermSetSchema } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Bias und Framing erkennen lernen",
  description:
    "Kurze, konkrete Lektionen über Medienbias, Framing, Quellenketten und irreführende Darstellungen, mit Checkliste und Glossar.",
  path: "/lernen",
});

const GLOSSARY: Array<[string, string]> = [
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

const CHECKLIST = [
  "Wer ist die ursprüngliche Quelle?",
  "Welche Aussage ist Fakt, welche Interpretation?",
  "Welche Wörter lösen gezielt Gefühle aus?",
  "Wer handelt, und wer verschwindet im Passiv?",
  "Welche Zahlen fehlen zum Vergleich?",
  "Welche relevante Perspektive kommt nicht vor?",
];

export default function LearnPage() {
  return (
    <Container className="py-12 sm:py-16">
      <JsonLd data={definedTermSetSchema("Glossar Medienkompetenz", "/lernen", GLOSSARY)} />
      <PageHeader
        title="Nicht „Welche Seite ist gut?“, sondern „Wie wirkt diese Darstellung?“"
        lede="Vollständige Neutralität ist kaum erreichbar. Wer Wortwahl, Quellenketten und Auslassungen erkennt, beurteilt Nachrichten selbstständiger."
      />

      <section aria-labelledby="lessons" className="mt-14">
        <h2 id="lessons" className="font-display text-title">
          Lektionen
        </h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          <li>
            <Link
              href="/lernen/framing"
              className="group flex h-full flex-col rounded-3xl bg-ink p-6 text-bg outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/40 sm:p-8"
            >
              <span className="text-bg/70 text-sm">Sprache, etwa 6 Minuten</span>
              <span className="mt-3 font-display text-2xl leading-tight">
                Wie Wortwahl Verantwortung verteilt
              </span>
              <span className="mt-3 text-bg/80 leading-relaxed">
                Aktiv, passiv, wertend oder beschwichtigend: Derselbe Sachverhalt kann sehr
                unterschiedliche Akteure in den Mittelpunkt stellen.
              </span>
              <span className="mt-6 font-semibold text-saffron underline decoration-2 underline-offset-4 dark:text-bg">
                Lektion starten
              </span>
            </Link>
          </li>
          <li className="flex h-full flex-col rounded-3xl border border-line border-dashed p-6 sm:p-8">
            <Badge variant="muted">In Vorbereitung</Badge>
            <h3 className="mt-3 font-display text-2xl leading-tight">
              Primärquelle oder Quellenkette?
            </h3>
            <p className="mt-3 text-ink-soft leading-relaxed">
              Wie aus einer Originalaussage viele Berichte werden, und warum zehn Artikel manchmal
              nur auf einer einzigen Information beruhen.
            </p>
          </li>
        </ul>
      </section>

      <section aria-labelledby="checklist" className="mt-16">
        <h2 id="checklist" className="font-display text-title">
          Checkliste für kritisches Lesen
        </h2>
        <ul className="mt-6 grid gap-x-8 sm:grid-cols-2">
          {CHECKLIST.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 border-line-soft border-b py-4 text-[1.0625rem]"
            >
              <span aria-hidden className="mt-2 size-2.5 shrink-0 rounded-full bg-saffron" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="glossar" className="mt-16">
        <h2 id="glossar" className="font-display text-title">
          Glossar
        </h2>
        <dl className="mt-6 border-ink border-t-2">
          {GLOSSARY.map(([term, definition]) => (
            <div
              key={term}
              id={`begriff-${term.toLowerCase().replace(/\s+/g, "-")}`}
              className="grid gap-1 border-line-soft border-b py-5 sm:grid-cols-[12rem_1fr] sm:gap-6"
            >
              <dt className="font-display text-lg">{term}</dt>
              <dd className="font-serif text-[1.0625rem] text-ink-soft leading-relaxed">
                {definition}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </Container>
  );
}
