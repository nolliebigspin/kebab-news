import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Über uns",
  description:
    "Warum kebab.news Nachrichten aus vielen Quellen transparent zusammenfasst, statt Neutralität zu versprechen.",
  path: "/ueber-uns",
});

export default function AboutPage() {
  return (
    <Container className="py-12 sm:py-16">
      <PageHeader
        title="We wrapped the news."
        lede="Viele Originalbeiträge beleuchten dasselbe Thema. Wir stecken sie auf einen Spieß, ohne Unterschiede glattzubügeln."
      />
      <section className="mt-14 grid max-w-4xl gap-10 md:grid-cols-2">
        <div>
          <h2 className="font-display text-title">Woran wir glauben</h2>
          <p className="mt-3 font-serif text-[1.0625rem] text-ink-soft leading-relaxed">
            Kein Medium und kein KI-System ist vollständig perspektivfrei. Transparenz über Auswahl,
            Quellen, Unsicherheit und Framing ist ehrlicher als das Versprechen absoluter
            Neutralität.
          </p>
        </div>
        <div>
          <h2 className="font-display text-title">Was wir nicht bauen</h2>
          <p className="mt-3 font-serif text-[1.0625rem] text-ink-soft leading-relaxed">
            Keinen Empörungs-Feed, kein politisches Zustimmungs-Voting und kein soziales Netzwerk.
            Bewertungen sollen die Qualität eines Artikels verbessern; Kommentare sollen Quellen und
            Kontext ergänzen.
          </p>
        </div>
      </section>
      <figure className="mt-16 flex max-w-4xl flex-col gap-6 rounded-3xl bg-ink p-8 text-bg sm:flex-row sm:items-center sm:p-10">
        <LogoMark className="size-16 text-bg" />
        <blockquote className="font-display text-title">
          Viele Quellen. Eine verständliche Zusammenfassung. Alle Unterschiede transparent.
        </blockquote>
      </figure>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button
          size="lg"
          nativeButton={false}
          render={<Link href="/methodik">Methodik lesen</Link>}
        />
        <Button
          size="lg"
          variant="outline"
          nativeButton={false}
          render={<Link href="/lernen">Bias und Framing lernen</Link>}
        />
      </div>
    </Container>
  );
}
