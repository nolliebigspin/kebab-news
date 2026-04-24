import { ShieldCheck } from "lucide-react";

export const Banner = () => {
  return (
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
  );
}
