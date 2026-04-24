import { GithubIcon } from "@/components/GithubIcon";
import { GITHUB_URL } from "@/lib/constants";

export const Hero = () => {
  return (
    <section className="mx-auto max-w-5xl px-6 pt-24 pb-20">
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
  );
}
