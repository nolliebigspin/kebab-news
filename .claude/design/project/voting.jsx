/* Voting view: vote budget, filters, submit modal, in-progress timeline */

function ProposeModal({ open, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [cat, setCat] = useState("Umwelt");
  const [sources, setSources] = useState("");
  const cats = ["Umwelt","Gesundheit","Haushalt","Wohnen","Energie","Bildung","Verkehr","Finanzen","Sonstiges"];
  const submit = () => {
    if (title.trim().length < 10) return;
    onSubmit({ title: title.trim(), tag: cat, why, sources });
    setTitle(""); setWhy(""); setSources("");
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Thema vorschlagen" maxWidth="620px">
      <div className="space-y-5">
        <div>
          <label className="text-[11px] font-mono uppercase tracking-[0.12em] ink-mute block mb-1.5">
            Deine Frage — prüfbar formuliert
          </label>
          <textarea
            value={title} onChange={e => setTitle(e.target.value)}
            placeholder={"z. B. \u201eWie viel Glyphosat wurde in Region X wirklich gespr\u00fcht?\u201c"}
            rows={2}
            className="w-full text-[15px] font-serif border hairline rounded-md px-3 py-2.5 leading-snug"
          />
          <div className="text-[11px] ink-mute mt-1 font-mono">
            {title.length} Zeichen · mind. 10
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-mono uppercase tracking-[0.12em] ink-mute block mb-1.5">
              Kategorie
            </label>
            <select value={cat} onChange={e => setCat(e.target.value)}
                    className="w-full text-[13.5px] border hairline rounded-md px-3 py-2 bg-white">
              {cats.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-mono uppercase tracking-[0.12em] ink-mute block mb-1.5">
              Warum wichtig? (optional)
            </label>
            <input value={why} onChange={e => setWhy(e.target.value)}
                   placeholder="eine kurze Begründung"
                   className="w-full text-[13.5px] border hairline rounded-md px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-mono uppercase tracking-[0.12em] ink-mute block mb-1.5">
            Mögliche Primärquellen (optional)
          </label>
          <input value={sources} onChange={e => setSources(e.target.value)}
                 placeholder="UBA, Destatis, Bundesrechnungshof …"
                 className="w-full text-[13.5px] font-mono border hairline rounded-md px-3 py-2" />
        </div>

        <div className="border hairline-soft rounded-md bg-warm p-3 text-[12px] ink-soft flex gap-2.5">
          <Icon name="Info" size={13} className="text-accent shrink-0 mt-0.5" />
          <span>
            Gute Fragen sind <span className="ink font-medium">prüfbar</span> — sie lassen sich durch Daten beantworten, nicht durch Meinungen.
            Die Redaktion prüft jeden Vorschlag vor der Freigabe zur Abstimmung.
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <button onClick={onClose} className="text-[13px] ink-mute hover:ink px-3 py-2">
            Abbrechen
          </button>
          <button
            onClick={submit}
            disabled={title.trim().length < 10}
            className="inline-flex items-center gap-2 bg-accent text-white text-[13px] rounded-md px-4 py-2 disabled:opacity-40 hover:opacity-90">
            Einreichen <Icon name="ArrowRight" size={13} />
          </button>
        </div>
      </div>
    </Modal>
  );
}

function TopicRow({ topic, onVote, voted, budgetLeft, featured, onOpen }) {
  const p = pct(topic.votes, topic.goal);
  const [bump, setBump] = useState(false);
  const canVote = voted || budgetLeft > 0;
  const handleVote = e => {
    e.stopPropagation();
    if (!canVote) return;
    onVote(topic.id);
    setBump(true);
    setTimeout(() => setBump(false), 650);
  };
  const reached = p >= 100;

  return (
    <article className={"py-7 " + (featured ? "" : "border-t hairline-soft")}>
      <div className="flex items-start gap-5">
        {/* upvote */}
        <div className="flex flex-col items-center gap-1.5 pt-1 shrink-0">
          <button
            onClick={handleVote}
            disabled={!canVote}
            className={
              "relative w-11 h-11 rounded-full border transition flex items-center justify-center " +
              (voted
                ? "border-transparent bg-accent text-white"
                : canVote
                  ? "hairline hover:border-[var(--accent)] hover:text-accent-ink bg-white ink-soft"
                  : "hairline bg-white ink-mute cursor-not-allowed opacity-50")
            }
            aria-label="Upvote"
            title={canVote ? "Stimme geben" : "Keine Stimmen mehr übrig"}
          >
            <span className={bump ? "pulse absolute inset-0 rounded-full" : "hidden"} />
            <Icon name="ArrowUp" size={18} strokeWidth={2} />
          </button>
          <div className="text-[11px] font-mono ink-mute">{Math.round(topic.votes/100)/10}k</div>
        </div>

        {/* body */}
        <div className="min-w-0 flex-1 cursor-pointer" onClick={onOpen}>
          <div className="flex items-center gap-2.5 text-[11px] font-mono uppercase tracking-[0.14em] ink-mute">
            <span>{topic.tag}</span>
            {topic.proposer && <><span>·</span><span>@{topic.proposer}</span><span>·</span><span>{topic.proposedAgo}</span></>}
            {topic.commissionedAgo && <><span>·</span><span>beauftragt {topic.commissionedAgo}</span></>}
            {topic.publishedAgo && <><span>·</span><span>{topic.publishedAgo}</span></>}
          </div>
          <h3 className={"mt-2 font-serif ink " + (featured ? "text-[26px] leading-[1.15]" : "text-[20px] leading-[1.2]")}
              style={{textWrap:"pretty"}}>
            {topic.title}
          </h3>

          {/* status-spezifisch */}
          {topic.status === "voting" && (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{background:"var(--line-soft)"}}>
                <div className="h-full rounded-full transition-[width] duration-500"
                     style={{ width: p + "%", background: "var(--accent)" }} />
              </div>
              <div className="text-[12px] font-mono ink-mute w-[130px] text-right shrink-0">
                {reached ? <span className="text-accent-ink">Ziel erreicht</span>
                         : <><span className="ink">{fmt(topic.votes)}</span> / {fmt(topic.goal)}</>}
              </div>
            </div>
          )}

          {topic.status === "investigating" && (
            <InvestigationTimeline progress={topic.progress} label={topic.progressLabel} />
          )}

          {topic.status === "done" && (
            <div className="mt-4 flex items-center gap-4 text-[12.5px] ink-soft">
              <span className="inline-flex items-center gap-1.5"><Icon name="FileText" size={12} className="ink-mute" /> {topic.sourcesN} Primär­quellen</span>
              <span className="ink-mute">·</span>
              <span className="inline-flex items-center gap-1.5"><Icon name="MessageSquare" size={12} className="ink-mute" /> {topic.commentsN} Beiträge</span>
              <span className="flex-1" />
              <span className="inline-flex items-center gap-1 text-accent-ink font-medium">
                Artikel öffnen <Icon name="ArrowRight" size={12} />
              </span>
            </div>
          )}
        </div>

        {/* status right */}
        <div className="hidden md:block shrink-0 pt-1">
          <StatusBadge status={topic.status} />
        </div>
      </div>
    </article>
  );
}

function InvestigationTimeline({ progress, label }) {
  const steps = [
    { key: "agg",    label: "KI-Aggregation",       at: 25 },
    { key: "extract",label: "Fakten-Extraktion",    at: 50 },
    { key: "review", label: "Redaktions-Review",    at: 75 },
    { key: "publish",label: "Veröffentlichung",     at: 100 },
  ];
  return (
    <div className="mt-4">
      <div className="relative h-[28px]">
        {/* axis line */}
        <div className="absolute left-0 right-0 top-[11px] h-[2px] rounded-full" style={{background:"var(--line-soft)"}} />
        <div className="absolute left-0 top-[11px] h-[2px] rounded-full transition-[width] duration-500"
             style={{background:"var(--accent)", width: progress + "%"}} />
        {/* steps */}
        {steps.map(s => {
          const reached = progress >= s.at;
          const active = progress >= s.at - 24 && progress < s.at;
          return (
            <div key={s.key} className="absolute -translate-x-1/2" style={{left: s.at + "%"}}>
              <div className={"w-[12px] h-[12px] rounded-full border-2 flex items-center justify-center mt-[6px] " +
                             (reached ? "" : "bg-white")}
                   style={{
                     borderColor: reached || active ? "var(--accent)" : "var(--line)",
                     background: reached ? "var(--accent)" : active ? "var(--accent-wash)" : "white"
                   }}>
              </div>
              <div className="text-[9.5px] font-mono uppercase tracking-[0.08em] mt-1 whitespace-nowrap -translate-x-1/2 absolute left-1/2"
                   style={{color: reached || active ? "var(--accent-ink)" : "var(--ink-mute)"}}>
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-8 text-[12px] ink-soft flex items-center gap-2">
        <Icon name="Activity" size={12} className="text-accent" />
        <span className="font-mono">{label}</span>
        <span className="ink-mute">· {progress} %</span>
      </div>
    </div>
  );
}

function FilterBar({ active, setActive, counts, sort, setSort }) {
  const tabs = [
    { key: "voting",        label: "In Abstimmung", n: counts.voting },
    { key: "investigating", label: "In Untersuchung", n: counts.investigating },
    { key: "done",          label: "Abgeschlossen", n: counts.done },
  ];
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-1 border hairline-soft rounded-full p-1 text-[12.5px]">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActive(t.key)}
                  className={"px-3 py-1.5 rounded-full transition flex items-center gap-1.5 " +
                    (active === t.key ? "bg-warm ink" : "ink-mute hover:ink")}>
            {t.label}
            <span className="font-mono text-[10.5px] ink-mute">{t.n}</span>
          </button>
        ))}
      </div>
      {active === "voting" && (
        <div className="flex items-center gap-2 text-[12px] ink-mute">
          <Icon name="ArrowDownWideNarrow" size={13} />
          <select value={sort} onChange={e => setSort(e.target.value)}
                  className="bg-transparent outline-none hover:ink">
            <option value="votes">Meiste Stimmen</option>
            <option value="close">Kurz vor Ziel</option>
            <option value="new">Neueste</option>
          </select>
        </div>
      )}
    </div>
  );
}

function VisionBlock() {
  return (
    <details className="mt-6 border hairline-soft rounded-lg bg-warm/50 group">
      <summary className="flex items-center justify-between p-5 cursor-pointer">
        <div className="flex items-center gap-3">
          <Icon name="Compass" size={15} className="text-accent" />
          <span className="font-serif text-[17px] ink">Warum es uns gibt</span>
        </div>
        <Icon name="ChevronDown" size={15} className="ink-mute group-open:rotate-180 transition" />
      </summary>
      <div className="px-5 pb-6 fade-up">
        <p className="text-[15.5px] ink-soft leading-[1.6] max-w-[580px]" style={{textWrap:"pretty"}}>
          In einer Welt voller Meinungen müssen wir die Fakten oft mühsam suchen.
          <span className="ink"> unsere.news nimmt das in die Hand</span> — als Gemeinschaft, nicht als Redaktion.
          Wir schauen, wie weltweit berichtet wird, und bleiben nicht dort stehen.
          <span className="ink"> Du entscheidest mit, welchen Fragen wir wissenschaftlich auf den Grund gehen.</span>
          Wir nutzen KI und Expertenwissen nicht, um neue Narrative zu schaffen, sondern um Primärquellen
          sichtbar zu machen. Nicht gegen jemanden — für mehr Durchblick und echte Sachlichkeit.
        </p>
      </div>
    </details>
  );
}

function VotingView({ topics, vote, votedIds, budget, onPropose, onOpenArticle }) {
  const [filter, setFilter] = useState("voting");
  const [sort, setSort] = useState("votes");

  const counts = {
    voting: topics.filter(t => t.status === "voting").length,
    investigating: topics.filter(t => t.status === "investigating").length,
    done: topics.filter(t => t.status === "done").length,
  };

  let list = topics.filter(t => t.status === filter);
  if (filter === "voting") {
    if (sort === "close") list = [...list].sort((a,b) => (b.votes/b.goal) - (a.votes/a.goal));
    else if (sort === "new") list = [...list].reverse();
    else list = [...list].sort((a,b) => b.votes - a.votes);
  }

  const [featured, ...rest] = list;
  const budgetLeft = budget.total - budget.used;

  return (
    <div className="max-w-[780px] mx-auto px-6 md:px-10 pt-12 pb-24">
      {/* lead */}
      <div className="mb-10">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="text-[11.5px] font-mono uppercase tracking-[0.16em] ink-mute">
            Woche 17 · Community-Board
          </div>
          <VoteBudget remaining={budgetLeft} total={budget.total} />
        </div>
        <h1 className="font-serif text-[46px] md:text-[54px] leading-[1.02] ink" style={{textWrap:"balance"}}>
          Was sollen wir als&nbsp;nächstes recherchieren?
        </h1>
        <p className="mt-5 text-[16px] ink-soft leading-relaxed max-w-[560px]" style={{textWrap:"pretty"}}>
          Erreicht ein Vorschlag die Schwelle, starten wir einen Deep-Dive — nur mit Primär­quellen, jede Zahl belegbar.
        </p>

        <div className="mt-7 flex items-center gap-3">
          <button
            onClick={onPropose}
            className="inline-flex items-center gap-2 bg-accent text-white text-[13.5px] rounded-md px-4 py-2.5 hover:opacity-90">
            <Icon name="Plus" size={14} />
            Eigenes Thema vorschlagen
          </button>
          <span className="text-[12px] ink-mute">
            {budgetLeft > 0 ? <>Du hast <span className="ink font-medium">{budgetLeft} Stimmen</span> diese Woche übrig</>
                            : "Alle Stimmen vergeben · neue Stimmen am Montag"}
          </span>
        </div>

        <VisionBlock />
      </div>

      <div className="mb-6">
        <FilterBar active={filter} setActive={setFilter} counts={counts} sort={sort} setSort={setSort} />
      </div>

      {/* list */}
      {featured && (
        <TopicRow topic={featured} voted={votedIds.has(featured.id)} onVote={vote} budgetLeft={budgetLeft} featured
                  onOpen={() => featured.articleId && onOpenArticle(featured.articleId)} />
      )}
      {rest.map(t => (
        <TopicRow key={t.id} topic={t} voted={votedIds.has(t.id)} onVote={vote} budgetLeft={budgetLeft}
                  onOpen={() => t.articleId && onOpenArticle(t.articleId)} />
      ))}

      {list.length === 0 && (
        <div className="py-16 text-center ink-mute text-[14px]">Keine Einträge in dieser Ansicht.</div>
      )}

      {/* Methodik — klappbar unten */}
      <details className="mt-20 border-t hairline-soft pt-8">
        <summary className="flex items-center justify-between">
          <span className="font-serif text-[19px] ink">Wie funktioniert das hier?</span>
          <Icon name="Plus" size={15} className="ink-mute" />
        </summary>
        <ol className="mt-6 space-y-4 text-[15px] ink-soft max-w-[560px] leading-relaxed fade-up">
          <li><span className="ink font-medium">1. Vorschlag.</span> Jedes Mitglied reicht prüfbare Fragen ein.</li>
          <li><span className="ink font-medium">2. Abstimmung.</span> 10 Stimmen pro Woche — gegen Spam und Kampagnen.</li>
          <li><span className="ink font-medium">3. Recherche.</span> KI aggregiert Primärquellen, Redaktion prüft manuell.</li>
          <li><span className="ink font-medium">4. Veröffentlichung.</span> Fakten-Karten statt Fließtext. Eine Quelle pro Aussage.</li>
        </ol>
      </details>
    </div>
  );
}

Object.assign(window, { VotingView, ProposeModal });
