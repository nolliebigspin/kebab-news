/* Shared primitives */

const { useState, useEffect, useRef } = React;

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

const fmt = n => n.toLocaleString("de-DE");
const pct = (a, b) => Math.min(100, Math.round((a / b) * 100));

/* Vote-Budget Pill */
function VoteBudget({ remaining, total }) {
  const used = total - remaining;
  return (
    <div className="inline-flex items-center gap-2.5 border hairline-soft rounded-full pl-1 pr-3 py-1">
      <span className="inline-flex items-center gap-1 bg-warm rounded-full px-2 py-0.5">
        <Icon name="Zap" size={11} className="text-accent" />
        <span className="text-[11.5px] font-mono ink">{remaining}</span>
      </span>
      <span className="text-[11.5px] ink-mute">von {total} Stimmen diese Woche</span>
      <div className="flex gap-0.5">
        {Array.from({length: total}).map((_,i) => (
          <span key={i} className="w-[3px] h-[10px] rounded-sm" style={{
            background: i < used ? "var(--line)" : "var(--accent)",
            opacity: i < used ? 0.5 : 1
          }} />
        ))}
      </div>
    </div>
  );
}

/* Status-Badge */
function StatusBadge({ status, size = "sm" }) {
  const map = {
    voting:        { label: "Abstimmung", color: "var(--ink-mute)", bg: "var(--line-soft)" },
    investigating: { label: "In Untersuchung", color: "var(--accent-ink)", bg: "var(--accent-wash)", pulse: true },
    done:          { label: "Veröffentlicht", color: "oklch(0.35 0.04 150)", bg: "oklch(0.94 0.03 150)" },
  };
  const s = map[status] || map.voting;
  const pad = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]";
  return (
    <span className={"inline-flex items-center gap-1.5 rounded-full font-mono uppercase tracking-[0.1em] " + pad}
          style={{background: s.bg, color: s.color}}>
      {s.pulse && <span className="relative flex w-1.5 h-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{background: s.color}} />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{background: s.color}} />
      </span>}
      {s.label}
    </span>
  );
}

/* Science-Stempel: Konfidenz-Indikator */
function ScienceStamp({ level }) {
  const map = {
    primary:     { label: "Primärquelle", icon: "ShieldCheck", color: "var(--accent)" },
    conflicting: { label: "Widersprüchliche Datenlage", icon: "AlertTriangle", color: "var(--warn)" },
    insufficient:{ label: "Datenlage unzureichend", icon: "HelpCircle", color: "var(--oerr)" },
  };
  const s = map[level] || map.primary;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.1em]"
          style={{color: s.color}}>
      <Icon name={s.icon} size={12} />
      {s.label}
    </span>
  );
}

/* Modal wrapper */
function Modal({ open, onClose, title, children, maxWidth = "560px" }) {
  useEffect(() => {
    if (!open) return;
    const onEsc = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
         style={{background:"oklch(0.22 0.03 250 / .4)"}}
         onClick={onClose}>
      <div className="bg-white border hairline rounded-lg shadow-xl w-full fade-up"
           style={{maxWidth}}
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b hairline-soft">
          <h3 className="font-serif text-[20px] ink">{title}</h3>
          <button onClick={onClose} className="ink-mute hover:ink"><Icon name="X" size={18} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

Object.assign(window, { Icon, fmt, pct, VoteBudget, StatusBadge, ScienceStamp, Modal });
