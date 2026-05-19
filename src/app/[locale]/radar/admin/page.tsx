import type { Metadata } from "next";

import { IngestButton } from "@/components/IngestButton";
import { Link } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Admin — kebab.news",
  robots: { index: false, follow: false },
};

export default function RadarAdminPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/radar"
          className="font-mono text-[11px] text-ink-mute uppercase tracking-[0.12em] hover:text-brand"
        >
          ← Zurück zum Radar
        </Link>
      </div>

      <header className="mb-10">
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">Radar — Admin</h1>
        <p className="mt-3 max-w-2xl text-base text-ink-soft leading-relaxed">
          Manueller Auslöser für den Ingest-Job (Feeds laden → einbetten → annotieren → clustern).
          Läuft sonst alle 30 Minuten per Vercel Cron. Strukturierte Logs landen in der Konsole
          (Vercel Logs oder <code className="font-mono text-sm">bun dev</code> Terminal) — pro Run
          gibt es eine eindeutige <code className="font-mono text-sm">runId</code>, nach der man
          filtern kann.
        </p>
      </header>

      <IngestButton />
    </section>
  );
}
