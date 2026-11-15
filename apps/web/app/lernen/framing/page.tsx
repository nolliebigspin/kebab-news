import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { faqSchema } from "@/lib/structured-data";

const TITLE = "Wie Wortwahl Verantwortung verteilt";

export const metadata: Metadata = pageMetadata({
  title: `${TITLE}: Aktiv, Passiv und Framing`,
  description:
    "Eine kurze Lektion über aktive und passive Formulierungen: Wie Grammatik bestimmt, ob Leser eine handelnde Person sehen oder nur ein Ereignis.",
  path: "/lernen/framing",
  openGraph: { type: "article" },
});

const QUESTION = "Welche Information fehlt in der passiven Variante?";
const ANSWER =
  "Wer die Entscheidung getroffen hat. Das kann unbeabsichtigt sein, Platz sparen oder Verantwortung sprachlich verschleiern. Erst der Kontext erlaubt eine belastbare Einordnung.";

export default function FramingLessonPage() {
  return (
    <Container width="prose" as="article" className="py-10 sm:py-14">
      <JsonLd data={faqSchema([{ question: QUESTION, answer: ANSWER }])} />
      <Breadcrumbs
        items={[
          { name: "Lernen", path: "/lernen" },
          { name: TITLE, path: "/lernen/framing" },
        ]}
      />
      <header className="mt-8">
        <p className="font-semibold text-ink-soft text-sm">Lektion Sprache, etwa 6 Minuten</p>
        <h1 className="mt-3 font-display text-display">{TITLE}</h1>
        <p className="mt-5 font-serif text-ink-soft text-lede">
          Grammatik wirkt unscheinbar. Doch schon Aktiv und Passiv entscheiden, ob wir eine
          handelnde Person sehen oder nur ein Ereignis.
        </p>
      </header>

      <section className="prose-serif mt-10 space-y-5">
        <p>
          Vergleiche zwei hypothetische Formulierungen. Sie behaupten kein reales Ereignis und
          dienen ausschließlich als Sprachbeispiel:
        </p>
        <div className="grid gap-3 font-sans sm:grid-cols-2">
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
        </div>
        <p>
          Die aktive Variante benennt Verantwortung. Die passive Variante richtet den Blick stärker
          auf das Ergebnis. Keine Variante ist automatisch falsch; relevant ist, ob die handelnde
          Instanz bekannt und für das Verständnis wichtig ist.
        </p>
      </section>

      <section aria-labelledby="quiz" className="mt-12 rounded-3xl bg-bg-warm p-6 sm:p-8">
        <h2 id="quiz" className="font-display text-title">
          Was fällt dir auf?
        </h2>
        <details className="group mt-5 rounded-2xl bg-bg p-5">
          <summary className="cursor-pointer list-none font-semibold [&::-webkit-details-marker]:hidden">
            {QUESTION}
            <span className="ml-2 font-normal text-brand-ink text-sm group-open:hidden">
              Antwort zeigen
            </span>
          </summary>
          <p className="mt-3 font-serif text-[1.0625rem] text-ink-soft leading-relaxed">{ANSWER}</p>
        </details>
      </section>

      <section aria-labelledby="practice" className="mt-12">
        <h2 id="practice" className="font-display text-title">
          Drei Fragen für die Praxis
        </h2>
        <ul className="mt-5 space-y-3 text-[1.0625rem]">
          {[
            "Ist bekannt, wer gehandelt hat?",
            "Würde das Benennen des Akteurs mein Verständnis verändern?",
            "Verwenden andere Quellen Aktiv, Passiv oder andere Verantwortungszuschreibungen?",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span aria-hidden className="mt-2 size-2.5 shrink-0 rounded-full bg-saffron" />
              {item}
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
