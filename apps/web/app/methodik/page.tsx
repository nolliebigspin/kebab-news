import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { howToSchema } from "@/lib/structured-data";

const DESCRIPTION =
  "Wie kebab.news Quellen bündelt, Zusammenfassungen erstellt, Framing markiert und Korrekturen behandelt.";

export const metadata: Metadata = pageMetadata({
  title: "Methodik und Transparenz",
  description: DESCRIPTION,
  path: "/methodik",
});

const STEPS = [
  {
    name: "Originalbeiträge erfassen",
    text: "Wir importieren Schlagzeilen und RSS-Teaser verschiedener deutschsprachiger Medien. Der Name eines Mediums ist kein Qualitätsurteil; Primärquellen sollen erkennbar werden.",
  },
  {
    name: "Beiträge zu Themen bündeln",
    text: "Semantische Ähnlichkeit bündelt Originalbeiträge zu Themen. Konservative Schwellen sollen falsche Zusammenführungen vermeiden. Die Zuordnung kann redaktionell korrigiert werden.",
  },
  {
    name: "Aktuelle Themen auswählen",
    text: "Sobald mehrere unabhängige Medien ein aktuelles Thema aufgreifen, kann daraus automatisch ein Artikel entstehen. Themen mit breiterer Quellenlage werden zuerst verarbeitet.",
  },
  {
    name: "Aussagen belegen",
    text: "Das System extrahiert Aussagen und verknüpft sie mit konkreten Originalbeiträgen. Ohne Beleg wird eine Aussage als unsicher markiert oder verworfen.",
  },
  {
    name: "Unterschiede zeigen",
    text: "Abweichende Zahlen, Ursachen, Begriffe, Gewichtungen und fehlender Kontext werden nicht künstlich aufgelöst, sondern nebeneinander dargestellt.",
  },
  {
    name: "Framing einordnen",
    text: "Markierungen erklären mögliche Wirkungen konkreter Formulierungen. Zitate, Sprecherzuordnung und Verneinungen zählen zum Kontext. Sachliche Rekorde, Zahlen oder Unsicherheitsmarker sind für sich kein Framing. Ein Hinweis ist kein Urteil über ein Medium; eine fehlende Markierung ist kein Neutralitätssiegel.",
  },
  {
    name: "Veröffentlichen",
    text: "Zusammenfassungen werden automatisch veröffentlicht. Veröffentlichung, Aktualisierung und Korrektur werden versioniert und nachvollziehbar dokumentiert.",
  },
];

export default function MethodPage() {
  return (
    <Container className="py-12 sm:py-16">
      <JsonLd
        data={howToSchema({
          name: "Wie aus Originalbeiträgen ein kebab.news-Artikel entsteht",
          description: DESCRIPTION,
          path: "/methodik",
          steps: STEPS,
        })}
      />
      <PageHeader
        title="Vertrauen entsteht nicht durch ein Neutralitätsversprechen."
        lede="kebab.news ist nicht frei von Perspektiven. Deshalb machen wir Quellen, Unsicherheiten und Unterschiede sichtbar."
      />

      <section aria-labelledby="steps" className="mt-14">
        <h2 id="steps" className="font-display text-title">
          Von Originalbeiträgen zum Artikel
        </h2>
        {/* A real sequence: numbered, threaded on the skewer. */}
        <ol className="relative mt-8 max-w-3xl space-y-8">
          <span
            aria-hidden
            className="absolute top-3 bottom-3 left-[15px] w-1 rounded-full bg-brand"
          />
          {STEPS.map((step, index) => (
            <li key={step.name} className="relative flex gap-5">
              <span className="tabular grid size-8 shrink-0 place-items-center rounded-full bg-saffron font-bold text-[#0f1b2d] text-sm ring-4 ring-bg">
                {index + 1}
              </span>
              <div className="pt-0.5">
                <h3 className="font-display text-xl">{step.name}</h3>
                <p className="mt-2 font-serif text-[1.0625rem] text-ink-soft leading-relaxed">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="font-display text-title">Rolle der KI</h2>
          <p className="mt-3 font-serif text-[1.0625rem] text-ink-soft leading-relaxed">
            KI unterstützt Clustering, Extraktion, Zusammenfassung und Framing-Analyse.
            Strukturierte Ausgaben werden validiert. Importierte Originalbeiträge gelten als nicht
            vertrauenswürdige Eingaben; darin enthaltene Anweisungen werden ignoriert. Ein Modell
            kann trotzdem irren oder eigene Verzerrungen reproduzieren.
          </p>
        </div>
        <div>
          <h2 className="font-display text-title">Rolle von Menschen</h2>
          <p className="mt-3 font-serif text-[1.0625rem] text-ink-soft leading-relaxed">
            Lesende können ihr Interesse an einem Thema zeigen und veröffentlichte Artikel bewerten.
            Die Auswahl, Erstellung und Veröffentlichung aktueller, quellenstarker Themen läuft
            automatisch. Menschen greifen außerdem nachträglich ein: bei gemeldeten Fehlern,
            Korrekturen und der Moderation von Kommentaren. Maßgeblich bleiben die verlinkten
            Originalbeiträge.
          </p>
        </div>
      </section>

      <section aria-labelledby="limits" className="mt-16 rounded-3xl bg-bg-warm p-6 sm:p-8">
        <h2 id="limits" className="font-display text-title">
          Grenzen und Fehler
        </h2>
        <p className="mt-3 max-w-3xl font-serif text-[1.0625rem] text-ink-soft leading-relaxed">
          RSS-Teaser enthalten nur einen Ausschnitt. Viele Originalbeiträge können dieselbe
          Ursprungsquelle wiederholen. Fehlende Perspektiven sind nicht immer automatisch erkennbar.
          Kurze Zitate bleiben auf das notwendige Maß begrenzt und verlinken zum Original.
        </p>
        <p className="mt-4">
          Fehler gefunden?{" "}
          <a
            href="mailto:contact@awinter.dev"
            className="font-semibold text-brand-ink underline underline-offset-4"
          >
            Melde ihn mit Artikel-Link und Beleg.
          </a>{" "}
          Sachliche Korrekturen werden in der Versionshistorie dokumentiert.
        </p>
      </section>
    </Container>
  );
}
