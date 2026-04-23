/* Orchestrator — loads after data.jsx, shared.jsx, voting.jsx, article.jsx */

function Header({ view, setView, onPropose, budget }) {
  return (
    <header className="border-b hairline-soft sticky top-0 z-30" style={{background:"var(--bg)"}}>
      <div className="max-w-[1100px] mx-auto px-6 md:px-10 py-4 flex items-center gap-8">
        <a href="#" onClick={e => { e.preventDefault(); setView("voting"); }} className="flex items-baseline gap-0.5 select-none">
          <span className="font-serif text-[20px] font-semibold tracking-tight ink">unsere</span>
          <span className="font-serif text-[20px] font-semibold tracking-tight" style={{color:"var(--accent)"}}>.news</span>
        </a>

        <nav className="hidden md:flex items-center gap-6 text-[13.5px] ml-4">
          <button
            onClick={() => setView("voting")}
            className={"py-1 transition border-b-2 " + (view === "voting" ? "ink" : "ink-mute hover:ink border-transparent")}
            style={view === "voting" ? {borderColor:"var(--accent)"} : {borderColor:"transparent"}}>
            Community-Board
          </button>
          <button
            onClick={() => setView("article")}
            className={"py-1 transition border-b-2 " + (view === "article" ? "ink" : "ink-mute hover:ink border-transparent")}
            style={view === "article" ? {borderColor:"var(--accent)"} : {borderColor:"transparent"}}>
            Beispiel-Artikel
          </button>
        </nav>

        <div className="flex-1" />

        <div className="hidden md:block">
          <VoteBudget remaining={budget.total - budget.used} total={budget.total} />
        </div>

        <button
          onClick={onPropose}
          className="inline-flex items-center gap-1.5 text-[13px] border hairline-soft rounded-md px-3 py-1.5 hover:bg-warm transition">
          <Icon name="Plus" size={13} />
          <span className="hidden sm:inline">Thema vorschlagen</span>
        </button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t hairline-soft mt-16">
      <div className="max-w-[1100px] mx-auto px-6 md:px-10 py-10 flex items-baseline justify-between gap-8 text-[12px] ink-mute flex-wrap">
        <div className="flex items-baseline gap-0.5">
          <span className="font-serif text-[15px] ink">unsere</span>
          <span className="font-serif text-[15px]" style={{color:"var(--accent)"}}>.news</span>
          <span className="ml-3">· gemeinnützig, werbefrei, Mitglieder-getragen</span>
        </div>
        <div className="flex items-center gap-5 flex-wrap">
          <a href="#" className="hover:ink">Methodik</a>
          <a href="#" className="hover:ink">KI-Transparenz</a>
          <a href="#" className="hover:ink">Finanzierung</a>
          <a href="#" className="hover:ink">Quellcode</a>
          <a href="#" className="hover:ink">Kontakt</a>
        </div>
      </div>
    </footer>
  );
}

/* Toast for new proposal */
function Toast({ msg, onClose }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  if (!msg) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white border hairline rounded-full shadow-lg px-5 py-2.5 flex items-center gap-2.5 fade-up text-[13px]">
      <Icon name="CheckCircle2" size={14} className="text-accent" />
      <span className="ink">{msg}</span>
    </div>
  );
}

function App() {
  const [view, setView] = useState(() => localStorage.getItem("un_view_v2") || "voting");
  const [topics, setTopics] = useState(TOPICS);
  const [votedIds, setVotedIds] = useState(() => new Set());
  const [budget, setBudget] = useState({ total: 10, used: 0 });
  const [proposeOpen, setProposeOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { localStorage.setItem("un_view_v2", view); }, [view]);

  const vote = (id) => {
    const already = votedIds.has(id);
    if (!already && budget.used >= budget.total) return;

    setTopics(prev => prev.map(t =>
      t.id === id ? { ...t, votes: t.votes + (already ? -1 : 1) } : t
    ));
    setVotedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
    setBudget(b => ({ ...b, used: b.used + (already ? -1 : 1) }));
  };

  const propose = ({ title, tag }) => {
    const newId = "t-new-" + Date.now();
    setTopics(prev => [
      {
        id: newId, title, tag,
        proposer: "du", proposedAgo: "gerade eben",
        votes: 1, goal: 5000, status: "voting",
        commentsN: 0, needed: "wird von Redaktion präzisiert",
      },
      ...prev
    ]);
    setVotedIds(prev => new Set(prev).add(newId));
    setBudget(b => ({ ...b, used: b.used + 1 }));
    setToast("Dein Vorschlag ist eingereicht — Redaktion prüft binnen 24 Std.");
  };

  const openArticle = () => setView("article");

  return (
    <div className="min-h-screen flex flex-col" data-screen-label={view === "voting" ? "01 Community-Board" : "02 Artikel"}>
      <Header view={view} setView={setView} onPropose={() => setProposeOpen(true)} budget={budget} />
      <main className="flex-1">
        {view === "voting"
          ? <VotingView topics={topics} vote={vote} votedIds={votedIds}
                        budget={budget} onPropose={() => setProposeOpen(true)}
                        onOpenArticle={openArticle} />
          : <ArticleView setView={setView} />}
      </main>
      <Footer />
      <ProposeModal open={proposeOpen} onClose={() => setProposeOpen(false)} onSubmit={propose} />
      <Toast msg={toast} onClose={() => setToast(null)} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
