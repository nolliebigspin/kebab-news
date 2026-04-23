/* Article view: fact cards with science-stamp, downloads, bias coverage, AI-moderated comments */

function FactCard({ card, n, total }) {
  const tone = {
    claim:    { label: "Versprechen", color: "var(--warn)" },
    evidence: { label: "Belegbar",    color: "var(--accent)" },
    context:  { label: "Kontext",     color: "var(--ink)" },
    openq:    { label: "Offen",       color: "var(--oerr)" },
  }[card.kind];

  return (
    <article className="py-10 border-t hairline-soft">
      <div className="flex items-center gap-3 text-[11.5px] font-mono uppercase tracking-[0.14em]" style={{color: tone.color}}>
        <span className="dot" style={{background: tone.color}}></span>
        <span>{tone.label}</span>
        <span className="ink-mute">· {card.label}</span>
        <span className="ml-auto ink-mute">{String(n).padStart(2,"0")} / {String(total).padStart(2,"0")}</span>
      </div>

      {card.figure ? (
        <div className="mt-6 grid grid-cols-12 gap-8 items-start">
          <p className="col-span-12 md:col-span-7 font-serif text-[24px] leading-[1.3] ink" style={{textWrap:"pretty"}}>
            {card.body}
          </p>
          <div className="col-span-12 md:col-span-5">
            <div className="font-serif text-[72px] md:text-[80px] leading-[0.95]" style={{color: tone.color}}>
              {card.figure.big}
            </div>
            <div className="text-[13px] ink-soft mt-2">{card.figure.sub}</div>
          </div>
        </div>
      ) : (
        <p className="mt-6 font-serif text-[24px] leading-[1.3] ink max-w-[640px]" style={{textWrap:"pretty"}}>
          {card.body}
        </p>
      )}

      {/* Wissenschafts-Stempel + Quellen */}
      <div className="mt-5 flex items-center gap-4 flex-wrap">
        <ScienceStamp level={card.confidence} />
        <span className="ink-mute text-[11px]">·</span>
        <details className="inline-block">
          <summary className="inline-flex items-center gap-1.5 text-[12px] ink-mute hover:ink">
            <Icon name="FileText" size={12} />
            {card.sources.length} Quelle{card.sources.length > 1 ? "n" : ""} ansehen
            <Icon name="ChevronDown" size={12} />
          </summary>
          <ul className="mt-3 space-y-2 fade-up max-w-[640px]">
            {card.sources.map(s => (
              <li key={s.id} className="flex items-center gap-3 text-[12.5px]">
                <span className="font-mono text-[10px] ink-mute w-9">{s.id}</span>
                <span className="ink-soft">{s.org}</span>
                <a href="#" className="ink hover:text-accent-ink flex items-center gap-1.5 min-w-0 underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--accent)]">
                  <span className="truncate">{s.doc}</span>
                </a>
                <span className="flex-1" />
                <span className="font-mono text-[10px] ink-mute">{s.date}</span>
                <a href="#" className="ink-mute hover:ink"><Icon name="ExternalLink" size={11} /></a>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </article>
  );
}

/* Bias / Ground-News-Effekt: Schlagzeilen-Gegenüberstellung */
function CoverageCompare({ coverage }) {
  const colorFor = side => side === "left" ? "var(--left)" : side === "right" ? "var(--right)" : "var(--oerr)";
  return (
    <div className="space-y-4 mt-3">
      <p className="text-[13px] ink-soft leading-relaxed max-w-[620px]">
        So haben verschiedene Medien über dieses Thema berichtet. Ziel ist nicht „die eine Wahrheit", sondern Perspektiven sichtbar zu machen.
      </p>
      {coverage.map(c => {
        const tonePct = Math.round(((c.tone + 1) / 2) * 100);
        const color = colorFor(c.side);
        return (
          <div key={c.side} className="border hairline-soft rounded-md p-4 bg-white">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-1 h-4 rounded-sm" style={{background: color}} />
                <span className="text-[13px] ink font-medium">{c.label}</span>
                <span className="text-[11px] ink-mute font-mono">· {c.outlets}</span>
              </div>
              <span className="text-[10.5px] ink-mute font-mono">{c.n} Artikel</span>
            </div>
            <ul className="space-y-1.5 mb-3">
              {c.headlines.map((h, i) => (
                <li key={i} className="text-[13.5px] ink-soft leading-snug pl-4 relative" style={{textWrap:"pretty"}}>
                  <span className="absolute left-0 top-2 w-1 h-1 rounded-full" style={{background: color}} />
                  „{h}"
                </li>
              ))}
            </ul>
            <div className="h-1 w-full rounded-full" style={{background:"var(--line-soft)"}}>
              <div className="h-full rounded-full" style={{
                marginLeft: `${Math.min(50, tonePct)}%`,
                width: `${Math.abs(tonePct - 50)}%`,
                background: color,
              }} />
            </div>
            <div className="mt-1 flex justify-between text-[9.5px] font-mono ink-mute uppercase tracking-[0.1em]">
              <span>kritisch</span>
              <span>neutral</span>
              <span>unterstützend</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Download-Bereich: alle Dokumente */
function DownloadBlock({ cards }) {
  const all = cards.flatMap(c => c.sources.map(s => ({...s, cardLabel: c.label})));
  const totalSize = "17,6 MB";
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] ink-soft max-w-[480px]">
          Alle Primärdokumente dieses Artikels — frei herunterladbar zum Nachprüfen.
        </p>
        <button className="inline-flex items-center gap-1.5 text-[12px] border hairline-soft rounded-md px-3 py-1.5 hover:bg-warm">
          <Icon name="Download" size={12} />
          Alle als ZIP ({totalSize})
        </button>
      </div>
      <ul className="border hairline-soft rounded-md divide-y hairline-soft overflow-hidden bg-white">
        {all.map(s => (
          <li key={s.id} className="flex items-center gap-3 px-4 py-2.5 text-[12.5px] hover:bg-warm transition">
            <Icon name="FileText" size={13} className="ink-mute shrink-0" />
            <span className="font-mono text-[10px] ink-mute w-9">{s.id}</span>
            <div className="min-w-0 flex-1">
              <div className="ink truncate">{s.doc}</div>
              <div className="ink-mute text-[10.5px] font-mono truncate">{s.org} · {s.cardLabel}</div>
            </div>
            <span className="font-mono text-[10.5px] ink-mute hidden md:inline">{s.size}</span>
            <a href="#" className="ink-mute hover:ink"><Icon name="Download" size={12} /></a>
            <a href="#" className="ink-mute hover:ink"><Icon name="ExternalLink" size={12} /></a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* KI-Moderator-Warnung */
function ModeratorHint({ onDismiss }) {
  return (
    <div className="border rounded-md p-3.5 flex gap-3 fade-up"
         style={{borderColor: "var(--accent)", background: "var(--accent-wash)"}}>
      <div className="shrink-0 mt-0.5">
        <Icon name="Bot" size={15} style={{color: "var(--accent-ink)"}} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-mono uppercase tracking-[0.12em]" style={{color: "var(--accent-ink)"}}>
          KI-Moderator
        </div>
        <p className="mt-1 text-[13.5px] ink-soft leading-relaxed" style={{textWrap:"pretty"}}>
          Bitte belege deine Aussage mit einer Quelle, damit wir sie in den Artikel aufnehmen können.
          Unsachliche Beiträge ohne Beleg werden nach 24 Std. ausgeblendet.
        </p>
        <div className="mt-2 flex items-center gap-3 text-[12px]">
          <button className="inline-flex items-center gap-1.5 ink hover:text-accent-ink font-medium">
            <Icon name="Paperclip" size={12} />
            Quelle hinzufügen
          </button>
          <button onClick={onDismiss} className="ink-mute hover:ink">Verstanden</button>
        </div>
      </div>
    </div>
  );
}

function CommentForm() {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [card, setCard] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Simuliere KI-Moderation: wenn Text unsachlich → Hinweis
  const aiWarn = /lüg|fake|propaganda|schwachsinn/i.test(text) && !url;

  return (
    <div className="border hairline-soft rounded-md bg-warm p-4">
      <div className="text-[11px] font-mono uppercase tracking-[0.12em] ink-mute mb-3">
        Beitrag, Korrektur oder Quelle einreichen
      </div>
      <div className="space-y-3">
        <select value={card} onChange={e => setCard(e.target.value)}
                className="w-full text-[13px] border hairline-soft bg-white rounded-md px-3 py-2">
          <option value="">Bezieht sich auf … (optional)</option>
          <option>Karte 02 · Stand heute</option>
          <option>Karte 03 · Haushaltsmittel</option>
          <option>Karte 05 · Noch offen</option>
        </select>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={2}
                  placeholder="Dein Beitrag — je konkreter, desto besser"
                  className="w-full text-[13.5px] border hairline-soft bg-white rounded-md px-3 py-2 leading-snug" />
        <div className="flex items-center gap-2 text-[12.5px]">
          <Icon name="Paperclip" size={12} className="ink-mute" />
          <input value={url} onChange={e => setUrl(e.target.value)}
                 placeholder="URL einer Primärquelle (PDF, Dokument, Datensatz)"
                 className="flex-1 font-mono text-[12.5px] border hairline-soft bg-white rounded-md px-3 py-1.5" />
        </div>
        {aiWarn && <ModeratorHint onDismiss={() => {}} />}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="text-[11px] ink-mute font-mono inline-flex items-center gap-1.5">
            <Icon name="ShieldCheck" size={11} />
            Beiträge mit Quelle werden bevorzugt geprüft
          </div>
          <button
            disabled={text.trim().length < 5}
            onClick={() => { setSubmitting(true); setTimeout(() => { setSubmitting(false); setText(""); setUrl(""); }, 800); }}
            className="inline-flex items-center gap-2 bg-accent text-white text-[12.5px] rounded-md px-3.5 py-2 disabled:opacity-40 hover:opacity-90">
            {submitting ? "Wird eingereicht …" : <>Einreichen <Icon name="ArrowRight" size={12} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

function CommentItem({ c }) {
  const [dismissed, setDismissed] = useState(false);
  return (
    <div className="flex gap-4">
      <div className="w-9 h-9 rounded-full bg-warm border hairline-soft flex items-center justify-center font-mono text-[11px] ink-soft shrink-0">
        {c.user.slice(0,2)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[12px] flex-wrap">
          <span className="ink font-medium">@{c.user}</span>
          <span className="ink-mute">· {c.role}</span>
          <span className="ink-mute">· {c.when}</span>
          {c.editorPicked && (
            <span className="text-[10px] font-mono uppercase tracking-[0.1em] px-1.5 py-0.5 rounded"
                  style={{background:"var(--accent-wash)", color:"var(--accent-ink)"}}>
              Redaktion übernommen
            </span>
          )}
          {c.flaggedByAI && (
            <span className="text-[10px] font-mono uppercase tracking-[0.1em] px-1.5 py-0.5 rounded"
                  style={{background:"var(--warn-wash)", color:"var(--warn)"}}>
              KI-Moderator: ohne Quelle
            </span>
          )}
        </div>
        <p className="mt-1 text-[14px] ink-soft leading-relaxed" style={{textWrap:"pretty"}}>{c.body}</p>
        {c.sourceBadge && (
          <a href="#" className="mt-2 inline-flex items-center gap-2 text-[12px] border hairline-soft rounded-md px-2.5 py-1.5 hover:bg-warm">
            <Icon name="Paperclip" size={12} className="text-accent" />
            <span className="font-mono ink-mute">{c.sourceBadge.type}:</span>
            <span className="ink">{c.sourceBadge.doc}</span>
            <Icon name="ExternalLink" size={11} className="ink-mute" />
          </a>
        )}
        {c.flaggedByAI && !dismissed && (
          <div className="mt-2">
            <ModeratorHint onDismiss={() => setDismissed(true)} />
          </div>
        )}
        <div className="mt-1.5 flex items-center gap-3 text-[11.5px] ink-mute">
          <button className="inline-flex items-center gap-1 hover:ink"><Icon name="ArrowUp" size={11}/> {c.up}</button>
          {c.down > 0 && <button className="inline-flex items-center gap-1 hover:ink"><Icon name="ArrowDown" size={11}/> {c.down}</button>}
          <button className="hover:ink">Antworten</button>
          <button className="hover:ink">Anfechten</button>
        </div>
      </div>
    </div>
  );
}

function Discussion() {
  const [filter, setFilter] = useState("all");
  const list = filter === "sourced"
    ? DISCUSSION_SEED.filter(c => c.sourceBadge)
    : DISCUSSION_SEED;

  return (
    <div className="mt-3 space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="inline-flex items-center gap-1 border hairline-soft rounded-full p-1 text-[12px]">
          {[{k:"all",l:"Alle"},{k:"sourced",l:"Mit Quelle"}].map(t => (
            <button key={t.k} onClick={() => setFilter(t.k)}
                    className={"px-3 py-1 rounded-full " + (filter===t.k ? "bg-warm ink" : "ink-mute hover:ink")}>
              {t.l}
            </button>
          ))}
        </div>
        <div className="text-[11px] ink-mute font-mono inline-flex items-center gap-1.5">
          <Icon name="Bot" size={11} className="text-accent" />
          KI-Moderator aktiv · Hassrede wird automatisch ausgeblendet
        </div>
      </div>

      <CommentForm />

      <ul className="space-y-6 pt-2">
        {list.map((c, i) => <li key={i}><CommentItem c={c} /></li>)}
      </ul>

      <button className="text-[12.5px] ink-mute hover:ink">
        Alle 128 Beiträge ansehen →
      </button>
    </div>
  );
}

function ExpandableBlock({ title, subtitle, icon, children, defaultOpen }) {
  return (
    <details className="border-b hairline-soft pb-3 group" open={defaultOpen}>
      <summary className="flex items-center gap-4 py-4">
        <Icon name={icon} size={16} className="ink-mute" />
        <div className="flex-1">
          <div className="font-serif text-[18px] ink">{title}</div>
          <div className="text-[12px] ink-mute mt-0.5 font-mono">{subtitle}</div>
        </div>
        <Icon name="ChevronDown" size={16} className="ink-mute group-open:rotate-180 transition" />
      </summary>
      <div className="pt-2 pb-4 fade-up">{children}</div>
    </details>
  );
}

function ArticleView({ setView }) {
  const totalSources = ARTICLE.cards.reduce((n,c)=>n+c.sources.length,0);
  return (
    <div className="max-w-[780px] mx-auto px-6 md:px-10 pt-10 pb-24">
      <button onClick={() => setView("voting")} className="inline-flex items-center gap-2 text-[12.5px] ink-mute hover:ink mb-10">
        <Icon name="ArrowLeft" size={13} />
        Zurück zum Community-Board
      </button>

      {/* headline */}
      <header>
        <div className="flex items-center gap-2.5 text-[11.5px] font-mono uppercase tracking-[0.14em] ink-mute flex-wrap">
          <StatusBadge status="done" />
          <span>·</span>
          <span>{ARTICLE.tag}</span>
          <span>·</span>
          <span style={{color:"var(--accent-ink)"}}>von {fmt(ARTICLE.votesWhenCommissioned)} Mitgliedern beauftragt</span>
        </div>
        <h1 className="mt-5 font-serif text-[42px] md:text-[50px] leading-[1.05] ink" style={{textWrap:"balance"}}>
          {ARTICLE.title}
        </h1>
        <p className="mt-6 font-serif text-[20px] leading-[1.45] ink-soft" style={{textWrap:"pretty"}}>
          {ARTICLE.summary}
        </p>

        <div className="mt-8 flex items-center gap-5 text-[12px] ink-mute font-mono flex-wrap">
          <span>{ARTICLE.readtime}</span>
          <span>·</span>
          <span>{ARTICLE.updated}</span>
          <span>·</span>
          <span>{totalSources} Primär­quellen</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1"><Icon name="Bot" size={11} /> KI-Recherche · Redaktions-Review</span>
        </div>
      </header>

      {/* fact cards */}
      <section className="mt-14">
        {ARTICLE.cards.map((c, i) => (
          <FactCard key={i} card={c} n={i+1} total={ARTICLE.cards.length} />
        ))}
      </section>

      {/* Vertiefung */}
      <div className="mt-14 border-t hairline-soft pt-8 space-y-0">
        <ExpandableBlock
          title="Wie andere Medien darüber berichten"
          subtitle={`Bias-Radar · ${ARTICLE.coverage.reduce((n,c)=>n+c.n,0)} Artikel aus ${ARTICLE.coverage.length * 3} Outlets`}
          icon="Scale"
          defaultOpen
        >
          <CoverageCompare coverage={ARTICLE.coverage} />
        </ExpandableBlock>
        <ExpandableBlock
          title="Alle Dokumente herunterladen"
          subtitle={`${totalSources} Primärquellen · PDFs, Datensätze, Protokolle`}
          icon="Download"
        >
          <DownloadBlock cards={ARTICLE.cards} />
        </ExpandableBlock>
        <ExpandableBlock
          title="Diskussion & Korrekturen"
          subtitle="128 Beiträge · 19 eingereichte Quellen · KI-moderiert"
          icon="MessageSquare"
        >
          <Discussion />
        </ExpandableBlock>
      </div>
    </div>
  );
}

Object.assign(window, { ArticleView });
