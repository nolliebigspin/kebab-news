import { Code, ShieldCheck, Users } from "lucide-react";

const GITHUB_URL = "https://github.com/unsere-news/unsere-news";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      {/* Header */}
      <header className="border-b hairline px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Wordmark />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm border hairline rounded-md px-3 py-1.5 transition-colors hover:bg-[var(--bg-warm)]"
            style={{ color: "var(--ink-soft)" }}
          >
            <GithubIcon />
            <span className="font-mono text-xs">GitHub</span>
          </a>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 pt-24 pb-20">
          {/* In development pill */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border hairline px-3 py-1">
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: "var(--accent)" }}
              />
              <span
                className="relative inline-flex rounded-full h-1.5 w-1.5"
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
            className="font-display text-5xl sm:text-6xl leading-[1.05] max-w-3xl mb-6"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            Wir sagen dir nicht,{" "}
            <br className="hidden sm:block" />
            was du denken sollst.
          </h1>

          <p
            className="font-display text-2xl sm:text-3xl mb-8"
            style={{ color: "var(--accent)", textWrap: "balance" } as React.CSSProperties}
          >
            Wir zeigen dir, woher die Informationen kommen.
          </p>

          <p
            className="text-base leading-relaxed max-w-2xl mb-12"
            style={{ color: "var(--ink-soft)" }}
          >
            unsere.news ist eine offene, community-getriebene investigative
            Nachrichtenplattform. Die Community stimmt über Themen ab. Wenn ein
            Thema die Schwelle erreicht, produziert unsere KI — geprüft von
            Redakteuren — einen Deep-Dive ausschließlich auf Basis öffentlicher
            Primärquellen. Jede Aussage zurückführbar. Jede Quelle verlinkt.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <GithubIcon color="#fff" />
              View on GitHub
            </a>
            <span
              className="text-sm border hairline rounded-md px-5 py-2.5"
              style={{ color: "var(--ink-mute)" }}
            >
              Launch newsletter coming soon
            </span>
          </div>
        </section>

        {/* Motto banner */}
        <section className="border-y hairline py-6" style={{ background: "var(--bg-warm)" }}>
          <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center gap-3">
            <ShieldCheck size={16} style={{ color: "var(--accent)" }} strokeWidth={1.75} />
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
              <span style={{ color: "var(--ink)" }} className="font-medium">
                Jede Zahl belegbar.
              </span>{" "}
              Jeder Artikel KI-recherchiert, redaktionell geprüft, auf Primärquellen
              zurückführbar.
            </p>
            <span className="mx-1 hidden sm:inline" style={{ color: "var(--line)" }}>·</span>
            <span
              className="font-mono text-xs whitespace-nowrap"
              style={{ color: "var(--ink-mute)" }}
            >
              gemeinnützig · werbefrei · open source
            </span>
          </div>
        </section>

        {/* Principles */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <h2
            className="font-mono text-xs uppercase tracking-[0.14em] mb-10"
            style={{ color: "var(--ink-mute)" }}
          >
            Prinzipien
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
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
        <section className="border-t hairline" style={{ background: "var(--bg-warm)" }}>
          <div className="max-w-5xl mx-auto px-6 py-20">
            <h2
              className="font-mono text-xs uppercase tracking-[0.14em] mb-10"
              style={{ color: "var(--ink-mute)" }}
            >
              So funktioniert es
            </h2>
            <ol className="grid sm:grid-cols-4 gap-6">
              {[
                ["01", "Vorschlag", "Jedes Mitglied kann eine prüfbare Frage einreichen."],
                ["02", "Voting", "Themen mit genug Unterstützung werden beauftragt."],
                ["03", "Recherche", "KI sammelt Primärquellen, die Redaktion prüft manuell."],
                ["04", "Veröffentlichung", "Fakten-Karten statt Fließtext — eine Quelle pro Aussage."],
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
      <footer className="border-t hairline">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Wordmark />
            <p className="text-xs mt-1" style={{ color: "var(--ink-mute)" }}>
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

function Wordmark() {
  return (
    <div className="flex items-baseline gap-0.5 select-none">
      <span className="font-display text-xl" style={{ color: "var(--ink)" }}>
        unsere
      </span>
      <span className="font-display text-xl" style={{ color: "var(--accent)" }}>
        .news
      </span>
    </div>
  );
}

function PrincipleCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="border hairline rounded-lg p-5 flex flex-col gap-3 bg-white">
      <span style={{ color: "var(--accent)" }}>{icon}</span>
      <h3 className="font-medium text-sm" style={{ color: "var(--ink)" }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
        {body}
      </p>
    </div>
  );
}

function GithubIcon({ color = "currentColor" }: { color?: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}
