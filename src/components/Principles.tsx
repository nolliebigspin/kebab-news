import { Code, ShieldCheck, Users } from "lucide-react";
import { PrincipleCard } from "@/components/PrincipleCard";

export const Principles = () => {
  return (
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
  );
}
