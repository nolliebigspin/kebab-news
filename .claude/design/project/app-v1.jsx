const { useState, useEffect, useMemo, useRef } = React;

/* ---------- tiny Icon wrapper around Lucide ---------- */
const Icon = ({ name, size = 16, className = "", strokeWidth = 1.75, ...rest }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const svg = lucide.createElement(lucide.icons[name] || lucide.icons.Circle);
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("stroke-width", strokeWidth);
    ref.current.appendChild(svg);
  }, [name, size, strokeWidth]);
  return <span ref={ref} className={"inline-flex items-center " + className} {...rest} />;
};

/* ---------- seed data ---------- */
const SEED_TOPICS = [
  {
    id: "t-glyphosat",
    title: "Untersuchung der Glyphosat-Belastung in deutschen Grundwasser­messstellen",
    tag: "Umwelt · Landwirtschaft",
    proposer: "anna_k.",
    proposedAgo: "vor 3 Tagen",
    votes: 4821,
    goal: 5000,
    needed: "Primärquellen · UBA, BfR, LANUV-Daten",
    stage: "Voting",
  },
  {
    id: "t-sondervermoegen",
    title: "Transparenzbericht: Wohin fließen die 100 Mrd. € des Bundeswehr-Sondervermögens?",
    tag: "Haushalt · Verteidigung",
    proposer: "redaktion",
    proposedAgo: "vor 6 Tagen",
    votes: 7340,
    goal: 7500,
    needed: "BMVg-Vergabedaten · Haushaltsausschuss-Protokolle",
    stage: "Voting",
  },
  {
    id: "t-mieten",
    title: "Mietpreis­entwicklung 2019–2026 in den 40 größten deutschen Städten",
    tag: "Wohnen · Wirtschaft",
    proposer: "j.mertens",
    proposedAgo: "vor 1 Woche",
    votes: 2104,
    goal: 5000,
    needed: "Mikrozensus · empirica · Mietspiegel-Rohdaten",
    stage: "Voting",
  },
  {
    id: "t-netz",
    title: "Wie belastbar ist das deutsche Stromnetz bei 80 % Erneuerbaren?",
    tag: "Energie",
    proposer: "lotte_w",
    proposedAgo: "vor 2 Wochen",
    votes: 1390,
    goal: 5000,
    needed: "BNetzA-Monitoring · ENTSO-E",
    stage: "Voting",
  },
  {
    id: "t-pflege",
    title: "Pflegenotstand in Zahlen: Personalschlüssel vs. gemeldete Engpässe",
    tag: "Gesundheit",
    proposer: "caregiver_de",
    proposedAgo: "vor 4 Tagen",
    votes: 3210,
    goal: 5000,
    needed: "PKV · GKV-Spitzenverband · Destatis",
    stage: "Voting",
  },
];

const ARTICLE = {
  id: "a-wasserstoff",
  title: "Wasserstoff-Strategie 2030: Was die Bundesregierung versprach — und was belegbar ist.",
  tag: "Energie · Industriepolitik",
  published: "Veröffentlicht 18. April 2026",
  updated: "Zuletzt geprüft heute, 09:14",
  authors: ["KI-Deep-Dive · Modell v4.2", "Redaktions-Review: M. Breuer, L. Ostrowski"],
  votesWhenCommissioned: 6842,
  readtime: "14 min · 27 Primärquellen",
  summary:
    "Im Juli 2020 kündigte die Bundesregierung eine \u201eNationale Wasserstoff­strategie\u201c mit 9 Mrd. € Förderung an. Wir gleichen jede Zusage mit Haushaltsplänen, BNetzA-Daten und Unternehmensberichten ab.",
  cards: [
    {
      kind: "claim",
      label: "Behauptung der Bundesregierung · Juli 2020",
      body:
        "\u201eBis 2030 werden in Deutschland Elektrolyseure mit einer Gesamt­leistung von mindestens 10 Gigawatt errichtet.\u201c",
      sources: [
        { org: "BMWK", doc: "Nationale Wasserstoffstrategie (PDF)", date: "10. Juni 2020", id: "S-01" },
      ],
    },
    {
      kind: "evidence",
      label: "Belegbarer Stand · März 2026",
      body:
        "Laut BNetzA-Monitoring sind in Deutschland 0,81 GW Elektrolyse­kapazität in Betrieb. Weitere 2,4 GW befinden sich in gesichertem Bau, 3,1 GW in Genehmigung.",
      figure: { big: "0,81", unit: "GW in Betrieb", sub: "Ziel 2030: 10 GW · Fortschritt 8,1 %" },
      sources: [
        { org: "Bundesnetzagentur", doc: "Monitoringbericht Wasserstoff Q1/2026", date: "12. März 2026", id: "S-02" },
        { org: "DENA", doc: "H2-Projektlandkarte (Rohdaten-CSV)", date: "01. April 2026", id: "S-03" },
      ],
    },
    {
      kind: "evidence",
      label: "Haushaltsmittel · tatsächlich abgeflossen",
      body:
        "Von den zugesagten 9,0 Mrd. € wurden bis Ende 2025 2,31 Mrd. € verausgabt. 4,1 Mrd. € sind gebunden, 2,59 Mrd. € noch nicht vergeben.",
      figure: { big: "2,31", unit: "Mrd. € abgeflossen", sub: "26 % des Gesamt­volumens · Stand 31.12.2025" },
      sources: [
        { org: "Bundesrechnungshof", doc: "Bericht §99 BHO zur H2-Förderung", date: "05. Februar 2026", id: "S-04" },
        { org: "BMF", doc: "Haushaltsrechnung 2025, Einzelplan 09", date: "20. März 2026", id: "S-05" },
      ],
    },
    {
      kind: "context",
      label: "Kontext — was das heißt",
      body:
        "Um das 10-GW-Ziel 2030 zu erreichen, müsste die installierte Leistung ab heute um den Faktor 12,3 wachsen. Vergleichswert: Der PV-Zubau 2015–2023 wuchs um Faktor 2,8.",
      sources: [
        { org: "Fraunhofer ISE", doc: "Energy-Charts · Zeitreihe Elektrolyse", date: "laufend", id: "S-06" },
      ],
    },
    {
      kind: "openq",
      label: "Offene Frage · noch nicht belegbar",
      body:
        "Der Anteil \u201egrüner\u201c Wasserstoff (aus zusätzlichen EE-Anlagen) lässt sich aktuell nicht unabhängig verifizieren — die Herkunftsnachweis­register sind erst ab Mai 2026 live.",
      sources: [
        { org: "UBA", doc: "Konsultation Herkunftsnachweis­register H2", date: "18. März 2026", id: "S-07" },
      ],
    },
  ],
  bias: {
    outlet_left: { label: "Links", tone: -0.4, note: "betont Ziel­verfehlung und Industrie­subvention" },
    outlet_oerr: { label: "ÖRR", tone: 0.05, note: "beschreibt Fortschritt + Rückstand parallel" },
    outlet_right: { label: "Rechts", tone: 0.35, note: "betont erreichte Pilot­projekte" },
  },
};

/* ---------- helpers ---------- */
const fmt = n => n.toLocaleString("de-DE");
const pct = (a, b) => Math.min(100, Math.round((a / b) * 100));

/* ============================================================
   HEADER
   ============================================================ */
function Header({ view, setView }) {
  return (
    <header className="border-b hairline">
      <div className="max-w-[1180px] mx-auto px-8 py-4 flex items-center gap-8">
        <a href="#" onClick={e => { e.preventDefault(); setView("voting"); }} className="flex items-baseline gap-1 select-none">
          <span className="font-serif text-[22px] font-semibold tracking-tight ink">unsere</span>
          <span className="font-serif text-[22px] font-semibold tracking-tight" style={{color:"var(--accent)"}}>.news</span>
        </a>

        {/* view switcher, framed as the two product modes */}
        <nav className="hidden md:flex items-center gap-1 text-[13px] ml-2">
          <button
            onClick={() => setView("voting")}
            className={"px-3 py-1.5 rounded-md transition " +
              (view === "voting" ? "bg-warm ink" : "ink-mute hover:ink")}>
            Community-Voting
          </button>
          <button
            onClick={() => setView("article")}
            className={"px-3 py-1.5 rounded-md transition " +
              (view === "article" ? "bg-warm ink" : "ink-mute hover:ink")}>
            Fakten-Ansicht (Beispiel)
          </button>
        </nav>

        <div className="flex-1" />

        <div className="hidden md:flex items-center gap-2 text-[12px] ink-mute font-mono">
          <span className="dot" style={{background:"var(--accent)"}}></span>
          <span>v0.3 · MVP Prototyp</span>
        </div>

        <button className="inline-flex items-center gap-2 text-[13px] border hairline rounded-md px-3 py-1.5 hover:bg-warm transition">
          <Icon name="Plus" size={14} />
          Themen vorschlagen
        </button>
      </div>

      {/* sub-banner: mission */}
      <div className="bg-warm border-t hairline-soft">
        <div className="max-w-[1180px] mx-auto px-8 py-2.5 flex items-center gap-3 text-[12px] ink-soft">
          <Icon name="ShieldCheck" size={14} className="text-accent" />
          <span>
            Jede Zahl belegbar. Jeder Artikel KI-recherchiert, Redaktions-geprüft, auf Primär­quellen
            zurückführbar.
          </span>
          <span className="ink-mute mx-2">·</span>
          <span className="font-mono">gemeinnützig · werbefrei · Quellcode offen</span>
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   VOTING VIEW
   ============================================================ */
function StatsStrip() {
  const stats = [
    { k: "Aktive Vorschläge", v: "142" },
    { k: "Diese Woche beauftragt", v: "7" },
    { k: "Registrierte Mitglieder", v: "38.412" },
    { k: "Durchschn. Primär­quellen/Artikel", v: "24,6" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 border hairline rounded-lg overflow-hidden bg-white">
      {stats.map((s,i) => (
        <div key={s.k} className={"px-5 py-4 " + (i < 3 ? "border-r hairline-soft" : "")}>
          <div className="text-[11px] uppercase tracking-[0.14em] ink-mute font-mono">{s.k}</div>
          <div className="mt-1 font-serif text-[26px] ink leading-none">{s.v}</div>
        </div>
      ))}
    </div>
  );
}

function TopicCard({ topic, onVote, voted }) {
  const p = pct(topic.votes, topic.goal);
  const [bump, setBump] = useState(false);
  const handleVote = () => {
    onVote(topic.id);
    setBump(true);
    setTimeout(() => setBump(false), 650);
  };
  const reached = p >= 100;

  return (
    <article className="border hairline rounded-lg bg-white overflow-hidden">
      <div className="grid grid-cols-[auto_1fr] gap-5 p-5">
        {/* upvote column */}
        <div className="flex flex-col items-center gap-1.5 pt-1">
          <button
            onClick={handleVote}
            className={
              "relative w-11 h-11 rounded-md border transition flex items-center justify-center " +
              (voted
                ? "border-transparent bg-accent text-white"
                : "hairline hover:border-[var(--accent)] hover:text-accent-ink bg-white ink-soft")
            }
            aria-label="Upvote"
          >
            <span className={bump ? "pulse absolute inset-0 rounded-md" : "hidden"} />
            <Icon name="ArrowUp" size={18} strokeWidth={2} />
          </button>
          <div className="text-[13px] font-mono ink leading-tight">{fmt(topic.votes)}</div>
          <div className="text-[10px] font-mono ink-mute leading-tight">/ {fmt(topic.goal)}</div>
        </div>

        {/* body */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.12em] ink-mute">
            <span>{topic.tag}</span>
            <span>·</span>
            <span>vorgeschlagen von @{topic.proposer}</span>
            <span>·</span>
            <span>{topic.proposedAgo}</span>
          </div>
          <h3 className="mt-1.5 font-serif text-[19px] leading-snug ink pr-4" style={{textWrap:"pretty"}}>
            {topic.title}
          </h3>

          <div className="mt-3 flex items-center gap-2 text-[12px] ink-soft">
            <Icon name="FileText" size={13} className="ink-mute" />
            <span className="font-mono">Recherche-Basis: {topic.needed}</span>
          </div>

          {/* progress */}
          <div className="mt-4">
            <div className="flex items-end justify-between mb-1.5">
              <div className="text-[11px] font-mono ink-mute uppercase tracking-[0.12em]">
                Fortschritt zur Beauftragung
              </div>
              <div className="text-[12px] font-mono ink">
                {reached ? <span className="text-accent-ink">Schwelle erreicht — Recherche startet</span> : p + " %"}
              </div>
            </div>
            <div className="h-[6px] w-full rounded-full overflow-hidden" style={{background:"var(--line-soft)"}}>
              <div
                className="h-full rounded-full transition-[width]"
                style={{
                  width: p + "%",
                  background: reached ? "var(--accent)" : "var(--accent)",
                  opacity: reached ? 1 : 0.85,
                }}
              />
            </div>
            {/* tick markings */}
            <div className="relative mt-1 h-2 text-[10px] font-mono ink-mute">
              <div className="absolute left-0">0</div>
              <div className="absolute left-[25%] -translate-x-1/2">25</div>
              <div className="absolute left-[50%] -translate-x-1/2">50</div>
              <div className="absolute left-[75%] -translate-x-1/2">75</div>
              <div className="absolute right-0">Ziel</div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 text-[12px]">
            <button className="inline-flex items-center gap-1.5 ink-soft hover:ink">
              <Icon name="MessageSquare" size={13} /> 34 Kommentare
            </button>
            <span className="ink-mute">·</span>
            <button className="inline-flex items-center gap-1.5 ink-soft hover:ink">
              <Icon name="BookMarked" size={13} /> Quellen vorschlagen
            </button>
            <span className="ink-mute">·</span>
            <button className="inline-flex items-center gap-1.5 ink-soft hover:ink">
              <Icon name="Share2" size={13} /> Teilen
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function BiasRadarPreview() {
  /* mini-scale with three outlet positions */
  const outlets = [
    { key: "left",  label: "Linksliberal",   pos: -0.55, dots: 6, note: "taz, Freitag, nd" },
    { key: "oerr",  label: "Öffentlich-rechtlich", pos: -0.08, dots: 8, note: "ARD, ZDF, DLF" },
    { key: "right", label: "Konservativ/Wirtschaft", pos: 0.52, dots: 5, note: "WELT, FAZ, Handelsblatt" },
  ];
  return (
    <aside className="border hairline rounded-lg bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.12em] ink-mute">
            Bias-Radar · Top-Thema
          </div>
          <h4 className="mt-1 font-serif text-[17px] ink leading-snug">
            Wie berichten verschiedene Medien über das Sonder­vermögen?
          </h4>
        </div>
        <span className="text-[11px] font-mono ink-mute">19 Quellen · 7 Tage</span>
      </div>

      {/* scale */}
      <div className="mt-6">
        <div className="relative h-12">
          {/* axis */}
          <div className="absolute left-0 right-0 top-1/2 h-px" style={{background:"var(--line)"}} />
          {/* center tick */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-5" style={{background:"var(--line)"}} />
          {/* dots per outlet */}
          {outlets.map(o => {
            const left = `calc(50% + ${o.pos * 42}%)`;
            const color = o.key === "left" ? "var(--left)" : o.key === "oerr" ? "var(--oerr)" : "var(--right)";
            return (
              <div key={o.key} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2" style={{ left }}>
                {/* stacked dots visualizing volume */}
                <div className="flex flex-col-reverse items-center gap-[3px]">
                  {Array.from({ length: o.dots }).map((_,i) => (
                    <span key={i} className="dot" style={{background: color, opacity: 0.35 + (i/o.dots)*0.65}} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* axis labels */}
        <div className="flex justify-between text-[10px] font-mono ink-mute uppercase tracking-[0.1em] mt-1">
          <span>kritisch / Ziel­verfehlung</span>
          <span>neutral</span>
          <span>unterstützend / erfolgreich</span>
        </div>
      </div>

      {/* outlet legend */}
      <div className="mt-5 grid grid-cols-3 gap-3 text-[11px]">
        {outlets.map(o => {
          const color = o.key === "left" ? "var(--left)" : o.key === "oerr" ? "var(--oerr)" : "var(--right)";
          return (
            <div key={o.key} className="border-l pl-2" style={{borderColor: color}}>
              <div className="ink font-medium">{o.label}</div>
              <div className="ink-mute font-mono mt-0.5">{o.note}</div>
            </div>
          );
        })}
      </div>

      <button className="mt-5 w-full inline-flex items-center justify-center gap-1.5 border hairline rounded-md py-2 text-[12px] ink-soft hover:bg-warm">
        Vollen Bias-Report öffnen <Icon name="ArrowRight" size={13} />
      </button>
    </aside>
  );
}

function VotingView({ topics, vote, votedIds }) {
  return (
    <div className="max-w-[1180px] mx-auto px-8 py-10">
      {/* lead */}
      <div className="flex items-end justify-between gap-8 mb-8">
        <div className="max-w-[680px]">
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] ink-mute">
            Aktuell zur Abstimmung · Woche 17
          </div>
          <h1 className="mt-2 font-serif text-[40px] leading-[1.1] ink" style={{textWrap:"balance"}}>
            Welche Frage sollen wir als nächstes untersuchen?
          </h1>
          <p className="mt-3 text-[15px] ink-soft leading-relaxed max-w-[600px]">
            Erreicht ein Vorschlag die Schwelle, beauftragen wir einen KI-gestützten Deep-Dive
            ausschließlich auf Basis öffentlich zugänglicher Primärquellen. Jede Zahl, jedes Zitat
            wird zurück­verfolgbar verlinkt.
          </p>
        </div>
        <div className="hidden md:flex flex-col items-end gap-1 text-[12px] ink-mute font-mono">
          <div className="flex items-center gap-2"><span className="dot" style={{background:"var(--accent)"}}></span> 1 Mitglied = 1 Stimme</div>
          <div className="flex items-center gap-2"><span className="dot" style={{background:"var(--line)", border:"1px solid var(--ink-mute)"}}></span> Keine Bots · keine Bezahl-Boosts</div>
        </div>
      </div>

      <StatsStrip />

      <div className="mt-8 grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 border hairline rounded-md p-1 text-[12px]">
              {["Aktiv", "Kurz vor Ziel", "Neu", "Abgeschlossen"].map((t,i) => (
                <button key={t} className={"px-2.5 py-1 rounded " + (i===0 ? "bg-warm ink" : "ink-mute hover:ink")}>{t}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[12px] ink-mute">
              <Icon name="ArrowDownWideNarrow" size={13} />
              <span>Sortieren: Unterstützung</span>
            </div>
          </div>

          {topics.map(t => (
            <TopicCard key={t.id} topic={t} voted={votedIds.has(t.id)} onVote={vote} />
          ))}
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <BiasRadarPreview />

          {/* methodology card */}
          <div className="border hairline rounded-lg p-5 bg-warm">
            <div className="text-[11px] font-mono uppercase tracking-[0.12em] ink-mute">So funktioniert es</div>
            <ol className="mt-3 space-y-2.5 text-[13px] ink-soft">
              {[
                ["01", "Vorschlag", "Jedes Mitglied kann eine prüfbare Frage einreichen."],
                ["02", "Voting", "Themen mit genug Unterstützung werden beauftragt."],
                ["03", "Recherche", "KI sammelt Primärquellen, Redaktion prüft manuell."],
                ["04", "Veröffentlichung", "Fakten-Karten statt Fließtext — Quelle pro Aussage."],
              ].map(([n, h, b]) => (
                <li key={n} className="grid grid-cols-[28px_1fr] gap-2">
                  <span className="font-mono text-[11px] ink-mute pt-0.5">{n}</span>
                  <span><span className="ink font-medium">{h}.</span> {b}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ARTICLE / FAKTEN-ANSICHT
   ============================================================ */
function FactCard({ card, n }) {
  const styles = {
    claim:    { label: "Behauptung", color: "var(--warn)",  wash: "var(--warn-wash)",  icon: "Quote"      },
    evidence: { label: "Belegbar",   color: "var(--accent)",wash: "var(--accent-wash)",icon: "CheckCheck" },
    context:  { label: "Kontext",    color: "var(--ink)",   wash: "var(--bg-warm)",    icon: "Scale"      },
    openq:    { label: "Offene Frage", color:"var(--oerr)", wash: "oklch(0.95 0.02 280)", icon: "HelpCircle" },
  }[card.kind];

  return (
    <article className="border hairline rounded-lg bg-white overflow-hidden">
      <div className="grid grid-cols-[56px_1fr]">
        {/* rail */}
        <div className="relative border-r hairline-soft" style={{background: styles.wash}}>
          <div className="absolute inset-y-0 left-0 w-[3px]" style={{background: styles.color}} />
          <div className="p-3 h-full flex flex-col items-center gap-3">
            <div className="text-[10px] font-mono ink-mute">{String(n).padStart(2,"0")}</div>
            <Icon name={styles.icon} size={16} />
          </div>
        </div>

        {/* content */}
        <div className="p-5">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.12em]" style={{color: styles.color}}>
            <span className="dot" style={{background: styles.color}}></span>
            <span>{styles.label}</span>
            <span className="ink-mute">· {card.label}</span>
          </div>

          <div className="mt-2 grid grid-cols-12 gap-5">
            <p className={"col-span-12 " + (card.figure ? "md:col-span-7" : "md:col-span-12") +
                          " font-serif text-[17px] leading-snug ink"} style={{textWrap:"pretty"}}>
              {card.body}
            </p>

            {card.figure && (
              <div className="col-span-12 md:col-span-5 border-l hairline-soft pl-5">
                <div className="font-serif text-[44px] leading-none ink">{card.figure.big}</div>
                <div className="text-[12px] ink-soft mt-1">{card.figure.unit}</div>
                <div className="text-[11px] font-mono ink-mute mt-2">{card.figure.sub}</div>
              </div>
            )}
          </div>

          {/* sources */}
          <div className="mt-4 pt-3 border-t hairline-soft">
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] ink-mute mb-2">
              Primärquellen
            </div>
            <ul className="space-y-1.5">
              {card.sources.map(s => (
                <li key={s.id} className="flex items-center gap-3 text-[12.5px]">
                  <span className="font-mono text-[10px] ink-mute w-9">{s.id}</span>
                  <span className="ink-soft">{s.org}</span>
                  <a href="#" className="ink underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--accent)] flex items-center gap-1.5 min-w-0">
                    <Icon name="FileText" size={12} className="ink-mute" />
                    <span className="truncate">{s.doc}</span>
                  </a>
                  <span className="flex-1" />
                  <span className="font-mono text-[10px] ink-mute">{s.date}</span>
                  <a href="#" className="ink-mute hover:ink"><Icon name="ExternalLink" size={12} /></a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}

function ArticleBiasRow() {
  const outlets = Object.values(ARTICLE.bias).map((o, i) => ({ ...o, key: Object.keys(ARTICLE.bias)[i] }));
  return (
    <div className="border hairline rounded-lg bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-mono uppercase tracking-[0.12em] ink-mute">
          Wie andere Medien über dieses Thema berichten
        </div>
        <span className="text-[11px] font-mono ink-mute">42 Artikel · 12 Outlets</span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4">
        {outlets.map(o => {
          const tonePct = Math.round(((o.tone + 1) / 2) * 100);
          const color = o.key === "outlet_left" ? "var(--left)" : o.key === "outlet_oerr" ? "var(--oerr)" : "var(--right)";
          return (
            <div key={o.key} className="border hairline-soft rounded-md p-3">
              <div className="flex items-center justify-between">
                <div className="text-[12px] ink font-medium">{o.label}</div>
                <span className="font-mono text-[10px] ink-mute">{o.tone > 0 ? "+" : ""}{o.tone.toFixed(2)}</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full" style={{background:"var(--line-soft)"}}>
                <div className="h-full rounded-full" style={{
                  marginLeft: `${Math.min(50, tonePct)}%`,
                  width: `${Math.abs(tonePct - 50)}%`,
                  background: color,
                }} />
              </div>
              <div className="mt-2 text-[11.5px] ink-soft leading-snug">{o.note}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-[10.5px] font-mono ink-mute">
        Ton-Wert: −1 stark kritisch, 0 neutral, +1 stark unterstützend · Methodik offen einsehbar
      </div>
    </div>
  );
}

function CommentsSection() {
  const [submitting, setSubmitting] = useState(false);
  const [url, setUrl] = useState("");
  const [claim, setClaim] = useState("");

  const comments = [
    {
      user: "dr_m.sommer", role: "verifiziert · TU München",
      when: "vor 2 Std.",
      body: "Auf S. 12 des BNetzA-Berichts steht, dass die 0,81 GW auch Pilot­anlagen <100 kW enthalten. Sollte in der Fakten-Karte #2 erwähnt werden.",
      sourceBadge: { type: "Primärquelle eingereicht", doc: "BNetzA Monitoring Q1/2026 · Seite 12" },
      up: 48, down: 1,
      editorPicked: true,
    },
    {
      user: "energy_nerd",
      role: "Mitglied seit 2024",
      when: "vor 5 Std.",
      body: "Wie vergleichen sich die 0,81 GW eigentlich mit Frankreich und den Niederlanden? Wäre für Kontext-Karte spannend.",
      up: 21, down: 0,
    },
  ];

  return (
    <section className="border hairline rounded-lg bg-white">
      <header className="px-5 py-4 border-b hairline-soft flex items-center justify-between">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.12em] ink-mute">Diskussion & Quellenprüfung</div>
          <h3 className="mt-1 font-serif text-[18px] ink">128 Beiträge · 19 eingereichte Primär­quellen</h3>
        </div>
        <div className="flex items-center gap-2 text-[12px] ink-mute">
          <Icon name="Filter" size={13} />
          <span>Nur mit Quelle</span>
          <label className="relative inline-block w-8 h-4 ml-1">
            <input type="checkbox" defaultChecked className="peer sr-only" />
            <span className="absolute inset-0 rounded-full transition" style={{background:"var(--accent)"}}></span>
            <span className="absolute left-0.5 top-0.5 w-3 h-3 rounded-full bg-white transition peer-checked:translate-x-4"></span>
          </label>
        </div>
      </header>

      {/* submit form */}
      <div className="p-5 bg-warm border-b hairline-soft">
        <div className="text-[11px] font-mono uppercase tracking-[0.12em] ink-mute mb-3">
          Quelle oder Korrektur einreichen
        </div>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-5">
            <label className="text-[11px] ink-mute block mb-1">Bezieht sich auf Fakten-Karte</label>
            <select className="w-full text-[13px] border hairline bg-white rounded-md px-3 py-2">
              <option>Karte 02 · Belegbarer Stand · März 2026</option>
              <option>Karte 03 · Haushaltsmittel</option>
              <option>Karte 05 · Offene Frage / Herkunftsnachweis</option>
            </select>
          </div>
          <div className="col-span-12 md:col-span-7">
            <label className="text-[11px] ink-mute block mb-1">URL der Primärquelle (PDF, Behördendokument, Datensatz)</label>
            <input
              value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://www.bundesnetzagentur.de/…"
              className="w-full text-[13px] font-mono border hairline bg-white rounded-md px-3 py-2"
            />
          </div>
          <div className="col-span-12">
            <label className="text-[11px] ink-mute block mb-1">Was belegt / korrigiert diese Quelle?</label>
            <textarea
              value={claim} onChange={e => setClaim(e.target.value)}
              rows={2}
              placeholder={'Kurz und prüfbar — z. B. \u201eS. 12 unterscheidet zwischen Pilot- und industrieller Kapazität.\u201c'}
              className="w-full text-[13px] border hairline bg-white rounded-md px-3 py-2"
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3 text-[11px] ink-mute font-mono">
            <span className="inline-flex items-center gap-1"><Icon name="ShieldCheck" size={12} /> Einreichungen werden von Redaktion verifiziert</span>
          </div>
          <button
            onClick={() => { setSubmitting(true); setTimeout(() => setSubmitting(false), 900); }}
            className="inline-flex items-center gap-2 bg-accent text-white text-[13px] rounded-md px-4 py-2 hover:opacity-90">
            {submitting ? "Wird eingereicht…" : <>Quelle einreichen <Icon name="ArrowRight" size={13} /></>}
          </button>
        </div>
      </div>

      {/* thread */}
      <ul className="divide-y hairline-soft">
        {comments.map((c, i) => (
          <li key={i} className="px-5 py-4 grid grid-cols-[40px_1fr_auto] gap-4">
            <div className="w-10 h-10 rounded-full bg-warm border hairline flex items-center justify-center font-mono text-[12px] ink-soft">
              {c.user.slice(0,2)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[12px]">
                <span className="ink font-medium">@{c.user}</span>
                <span className="ink-mute">·</span>
                <span className="ink-mute">{c.role}</span>
                <span className="ink-mute">·</span>
                <span className="ink-mute font-mono">{c.when}</span>
                {c.editorPicked && (
                  <span className="ml-1 text-[10px] font-mono uppercase tracking-[0.12em] px-1.5 py-0.5 rounded border" style={{borderColor:"var(--accent)", color:"var(--accent-ink)"}}>
                    Redaktion hat übernommen
                  </span>
                )}
              </div>
              <p className="mt-1 text-[14px] ink-soft leading-relaxed" style={{textWrap:"pretty"}}>{c.body}</p>
              {c.sourceBadge && (
                <a href="#" className="mt-2 inline-flex items-center gap-2 text-[12px] border hairline rounded-md px-2.5 py-1.5 hover:bg-warm">
                  <Icon name="Paperclip" size={12} className="text-accent" />
                  <span className="font-mono ink-mute">{c.sourceBadge.type}:</span>
                  <span className="ink">{c.sourceBadge.doc}</span>
                  <Icon name="ExternalLink" size={11} className="ink-mute" />
                </a>
              )}
              <div className="mt-2 flex items-center gap-3 text-[11px] ink-mute">
                <button className="inline-flex items-center gap-1 hover:ink"><Icon name="ArrowUp" size={11}/> {c.up}</button>
                <button className="inline-flex items-center gap-1 hover:ink"><Icon name="ArrowDown" size={11}/> {c.down}</button>
                <button className="hover:ink">Antworten</button>
                <button className="hover:ink">Anfechten</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ArticleView({ setView }) {
  return (
    <div className="max-w-[1180px] mx-auto px-8 py-10">
      {/* breadcrumb */}
      <button onClick={() => setView("voting")} className="inline-flex items-center gap-2 text-[12px] ink-mute hover:ink mb-6">
        <Icon name="ArrowLeft" size={13} />
        Zurück zur Voting-Liste
      </button>

      {/* headline block */}
      <header className="border-b hairline pb-8">
        <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.14em] ink-mute">
          <span>{ARTICLE.tag}</span>
          <span>·</span>
          <span>Deep-Dive #DD-0427</span>
          <span>·</span>
          <span style={{color:"var(--accent-ink)"}}>von {fmt(ARTICLE.votesWhenCommissioned)} Mitgliedern beauftragt</span>
        </div>
        <h1 className="mt-3 font-serif text-[46px] leading-[1.05] ink max-w-[900px]" style={{textWrap:"balance"}}>
          {ARTICLE.title}
        </h1>
        <p className="mt-4 font-serif text-[19px] leading-snug ink-soft max-w-[760px]" style={{textWrap:"pretty"}}>
          {ARTICLE.summary}
        </p>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-5 text-[12px]">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] ink-mute">Recherche</div>
            <div className="mt-1 ink">{ARTICLE.authors[0]}</div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] ink-mute">Redaktions-Review</div>
            <div className="mt-1 ink">{ARTICLE.authors[1].replace("Redaktions-Review: ","")}</div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] ink-mute">Umfang</div>
            <div className="mt-1 ink font-mono">{ARTICLE.readtime}</div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] ink-mute">Version</div>
            <div className="mt-1 ink font-mono">{ARTICLE.updated}</div>
          </div>
        </div>
      </header>

      {/* toc + fact cards */}
      <div className="grid grid-cols-12 gap-10 mt-10">
        {/* TOC rail */}
        <aside className="col-span-12 lg:col-span-3 order-2 lg:order-1">
          <div className="lg:sticky lg:top-6">
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] ink-mute mb-3">Fakten-Karten</div>
            <ol className="space-y-2 text-[13px]">
              {ARTICLE.cards.map((c, i) => (
                <li key={i} className="grid grid-cols-[24px_1fr] gap-2">
                  <span className="font-mono text-[10px] ink-mute pt-0.5">{String(i+1).padStart(2,"0")}</span>
                  <a href="#" className="ink-soft hover:ink leading-snug">{c.label}</a>
                </li>
              ))}
            </ol>

            <div className="mt-8 p-4 rounded-lg border hairline-soft bg-warm">
              <div className="flex items-center gap-2 text-[11px] font-mono ink-mute uppercase tracking-[0.12em]">
                <Icon name="GitBranch" size={12} /> Änderungs­verlauf
              </div>
              <div className="mt-2 text-[12px] ink-soft leading-snug">
                3 Korrekturen durch Community, 1 Präzisierung durch Redaktion · alle einsehbar
              </div>
            </div>
          </div>
        </aside>

        {/* cards */}
        <main className="col-span-12 lg:col-span-9 order-1 lg:order-2 space-y-5">
          {ARTICLE.cards.map((c, i) => (
            <FactCard key={i} card={c} n={i+1} />
          ))}

          <ArticleBiasRow />

          <CommentsSection />
        </main>
      </div>
    </div>
  );
}

/* ============================================================
   APP
   ============================================================ */
function Footer() {
  return (
    <footer className="border-t hairline mt-16">
      <div className="max-w-[1180px] mx-auto px-8 py-8 grid grid-cols-12 gap-8 text-[12px]">
        <div className="col-span-12 md:col-span-4">
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-[18px] ink">unsere</span>
            <span className="font-serif text-[18px]" style={{color:"var(--accent)"}}>.news</span>
          </div>
          <p className="mt-2 ink-soft max-w-[320px] leading-relaxed">
            Vertrauen durch Transparenz. Gemeinnützig, werbefrei, Mitglieder-getragen.
          </p>
        </div>
        {[
          ["Plattform", ["Themen vorschlagen","Voting-Liste","Abgeschlossene Deep-Dives","Bias-Radar"]],
          ["Methodik",  ["Quellen-Richtlinie","KI-Transparenz","Redaktions­kodex","Korrekturen"]],
          ["Projekt",   ["Finanzierung (offen)","Quellcode","Team","Kontakt"]],
        ].map(([h, items]) => (
          <div key={h} className="col-span-6 md:col-span-2">
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] ink-mute">{h}</div>
            <ul className="mt-2 space-y-1.5">
              {items.map(it => <li key={it}><a href="#" className="ink-soft hover:ink">{it}</a></li>)}
            </ul>
          </div>
        ))}
        <div className="col-span-12 md:col-span-2 font-mono text-[11px] ink-mute">
          <div>build · 2026.04.r3</div>
          <div>commit · a1f3c02</div>
        </div>
      </div>
    </footer>
  );
}

function App() {
  const [view, setView] = useState(() => localStorage.getItem("un_view") || "voting");
  const [topics, setTopics] = useState(SEED_TOPICS);
  const [votedIds, setVotedIds] = useState(() => new Set());

  useEffect(() => { localStorage.setItem("un_view", view); }, [view]);

  const vote = (id) => {
    setTopics(prev => prev.map(t => {
      if (t.id !== id) return t;
      const already = votedIds.has(id);
      return { ...t, votes: t.votes + (already ? -1 : 1) };
    }));
    setVotedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header view={view} setView={setView} />
      <main className="flex-1">
        {view === "voting"
          ? <VotingView topics={topics} vote={vote} votedIds={votedIds} />
          : <ArticleView setView={setView} />}
      </main>
      <Footer />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
