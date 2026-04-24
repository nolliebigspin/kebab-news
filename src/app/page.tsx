import { Code, ShieldCheck, Users } from "lucide-react";
import { GithubIcon } from "@/components/GithubIcon";
import { PrincipleCard } from "@/components/PrincipleCard";
import { Wordmark } from "@/components/Wordmark";
import { GITHUB_URL } from "@/lib/constants";

export default function LandingPage() {
  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: "var(--bg)", color: "var(--ink)" }}
    >
      {/* Header */}
      <header className="hairline border-b px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Wordmark />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hairline inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-(--bg-warm)"
            style={{ color: "var(--ink-soft)" }}
          >
            <GithubIcon />
            <span className="font-mono text-xs">GitHub</span>
          </a>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 pt-24 pb-20">
          {/* In development pill */}
          <div className="hairline mb-8 inline-flex items-center gap-2 rounded-full border px-3 py-1">
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ background: "var(--accent)" }}
              />
              <span
                className="relative inline-flex h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--accent)" }}
              />
            </span>
            <span
              className="font-mono text-[11px] uppercase tracking-[0.12em]"
              style={{ color: "var(--accent-ink)" }}
            >
              In development
            </span>
          </div>

          {/* Headline */}
          <h1
            className="mb-6 max-w-3xl font-display text-5xl leading-[1.05] sm:text-6xl"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            Wir sagen dir nicht, <br className="hidden sm:block" />
            was du denken sollst.
          </h1>

          <p
            className="mb-8 font-display text-2xl sm:text-3xl"
            style={{ color: "var(--accent)", textWrap: "balance" } as React.CSSProperties}
          >
            Wir zeigen dir, woher die Informationen kommen.
          </p>

          <p
            className="mb-12 max-w-2xl text-base leading-relaxed"
            style={{ color: "var(--ink-soft)" }}
          >
            unsere.news ist eine offene, community-getriebene investigative Nachrichtenplattform.
            Die Community stimmt über Themen ab. Wenn ein Thema die Schwelle erreicht, produziert
            unsere KI — geprüft von Redakteuren — einen Deep-Dive ausschließlich auf Basis
            öffentlicher Primärquellen. Jede Aussage zurückführbar. Jede Quelle verlinkt.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 font-medium text-sm transition-opacity hover:opacity-90"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <GithubIcon color="#fff" />
              View on GitHub
            </a>
            <span
              className="hairline rounded-md border px-5 py-2.5 text-sm"
              style={{ color: "var(--ink-mute)" }}
            >
              Launch newsletter coming soon
            </span>
          </div>
        </section>

        {/* Motto banner */}
        <section className="hairline border-y py-6" style={{ background: "var(--bg-warm)" }}>
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-6">
            <ShieldCheck size={16} style={{ color: "var(--accent)" }} strokeWidth={1.75} />
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
              <span style={{ color: "var(--ink)" }} className="font-medium">
                Jede Zahl belegbar.
              </span>{" "}
              Jeder Artikel KI-recherchiert, redaktionell geprüft, auf Primärquellen zurückführbar.
            </p>
            <span className="mx-1 hidden sm:inline" style={{ color: "var(--line)" }}>
              ·
            </span>
            <span
              className="whitespace-nowrap font-mono text-xs"
              style={{ color: "var(--ink-mute)" }}
            >
              gemeinnützig · werbefrei · open source
            </span>
          </div>
        </section>

        {/* Principles */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h2
            className="mb-10 font-mono text-xs uppercase tracking-[0.14em]"
            style={{ color: "var(--ink-mute)" }}
          >
            Prinzipien
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <PrincipleCard
              icon={<ShieldCheck size={18} strokeWidth={1.75} />}
              title="Radikale Transparenz"
              body="Jede veröffentlichte Fakten-Karte ist auf eine verifizierbare Primärquelle zurückführbar — Behördendokumente, Studien, Rohdaten — mit einem Klick zugänglich."
            />
            <PrincipleCard
              icon={<Users size={18} strokeWidth={1.75} />}
              title="Community-Getrieben"
              body="Die Community entscheidet, welche Themen untersucht werden. Kein redaktionelles Gatekeeping. Wenn ein Thema die Abstimmungsschwelle erreicht, startet die Recherche automatisch."
            />
            <PrincipleCard
              icon={<Code size={18} strokeWidth={1.75} />}
              title="Open Source"
              body="MIT-Lizenz. Öffentliches Repository von Tag eins. Code, Methodik und Finanzierung sind offen einsehbar und prüfbar."
            />
          </div>
        </section>

        {/* How it works */}
        <section className="hairline border-t" style={{ background: "var(--bg-warm)" }}>
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2
              className="mb-10 font-mono text-xs uppercase tracking-[0.14em]"
              style={{ color: "var(--ink-mute)" }}
            >
              So funktioniert es
            </h2>
            <ol className="grid gap-6 sm:grid-cols-4">
              {[
                ["01", "Vorschlag", "Jedes Mitglied kann eine prüfbare Frage einreichen."],
                ["02", "Voting", "Themen mit genug Unterstützung werden beauftragt."],
                ["03", "Recherche", "KI sammelt Primärquellen, die Redaktion prüft manuell."],
                [
                  "04",
                  "Veröffentlichung",
                  "Fakten-Karten statt Fließtext — eine Quelle pro Aussage.",
                ],
              ].map(([n, h, b]) => (
                <li key={n} className="flex flex-col gap-2">
                  <span className="font-mono text-[11px]" style={{ color: "var(--ink-mute)" }}>
                    {n}
                  </span>
                  <span className="font-medium text-sm" style={{ color: "var(--ink)" }}>
                    {h}
                  </span>
                  <span className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                    {b}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="hairline border-t">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-4 px-6 py-8 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <Wordmark />
            <p className="mt-1 text-xs" style={{ color: "var(--ink-mute)" }}>
              Gemeinnützig · Werbefrei · Mitglieder-getragen
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-4">
            {[
              ["Methodik", "#"],
              ["KI-Transparenz", "#"],
              ["Quellcode", GITHUB_URL],
              ["Kontakt", "#"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="text-xs transition-colors"
                style={{ color: "var(--ink-mute)" }}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
