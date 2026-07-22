import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Über kebab.news",
  description: "Warum kebab.news Nachrichten aus vielen Quellen transparent zusammenfasst.",
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
      <header className="max-w-3xl">
        <p className="font-mono text-[11px] text-brand-ink uppercase tracking-[0.14em]">
          Über kebab.news
        </p>
        <h1 className="mt-3 text-balance font-display text-4xl sm:text-5xl">
          We wrapped the news.
        </h1>
        <p className="mt-6 text-ink-soft text-xl leading-8">
          Viele Berichte erzählen Teile derselben Story. Wir bündeln sie, ohne Unterschiede
          glattzubügeln.
        </p>
      </header>
      <section className="mt-14 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl">Woran wir glauben</h2>
          <p className="mt-3 text-ink-soft text-sm leading-6">
            Kein Medium und kein KI-System ist vollständig perspektivfrei. Transparenz über Auswahl,
            Quellen, Unsicherheit und Framing ist ehrlicher als das Versprechen absoluter
            Neutralität.
          </p>
        </div>
        <div>
          <h2 className="font-display text-2xl">Was wir nicht bauen</h2>
          <p className="mt-3 text-ink-soft text-sm leading-6">
            Keinen Empörungs-Feed, kein politisches Zustimmungs-Voting und kein soziales Netzwerk.
            Bewertungen sollen die Qualität einer Summary verbessern; Kommentare sollen Quellen und
            Kontext ergänzen.
          </p>
        </div>
      </section>
      <blockquote className="mt-14 rounded-2xl bg-brand-wash p-8 font-display text-2xl leading-9">
        „Viele Quellen. Eine verständliche Zusammenfassung. Alle Unterschiede transparent.“
      </blockquote>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/methodik" className="rounded-full bg-brand px-5 py-3 text-sm text-white">
          Methodik lesen
        </Link>
        <Link href="/lernen" className="rounded-full border border-line px-5 py-3 text-sm">
          Bias & Framing lernen
        </Link>
      </div>
    </article>
  );
}
