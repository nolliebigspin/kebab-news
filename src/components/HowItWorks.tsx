const steps = [
  ["01", "Vorschlag", "Jedes Mitglied kann eine prüfbare Frage einreichen."],
  ["02", "Voting", "Themen mit genug Unterstützung werden beauftragt."],
  ["03", "Recherche", "KI sammelt Primärquellen, die Redaktion prüft manuell."],
  ["04", "Veröffentlichung", "Fakten-Karten statt Fließtext — eine Quelle pro Aussage."],
] as const;

export const HowItWorks = () => {
  return (
    <section className="hairline border-t" style={{ background: "var(--bg-warm)" }}>
      <div className="mx-auto max-w-5xl px-6 py-20">
        <h2
          className="mb-10 font-mono text-xs uppercase tracking-[0.14em]"
          style={{ color: "var(--ink-mute)" }}
        >
          So funktioniert es
        </h2>
        <ol className="grid gap-6 sm:grid-cols-4">
          {steps.map(([n, h, b]) => (
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
  );
}
