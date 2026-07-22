"use client";

import type { DownvoteReason } from "@kebab/db";
import Link from "next/link";
import { useState, useTransition } from "react";
import { FiThumbsDown, FiThumbsUp } from "react-icons/fi";
import { toast } from "sonner";
import type { SummaryRatingSnapshot } from "@/lib/summary-ratings";

const reasons: Array<{ value: DownvoteReason; label: string }> = [
  { value: "missing_information", label: "Wichtige Information fehlt" },
  { value: "misleading", label: "Zusammenfassung ist missverständlich" },
  { value: "unbalanced_sources", label: "Quellen wirken unausgewogen" },
  { value: "weak_framing_analysis", label: "Framing-Analyse überzeugt nicht" },
  { value: "outdated", label: "Inhalt ist veraltet" },
  { value: "factual_error", label: "Sachlicher Fehler" },
  { value: "other", label: "Sonstiges" },
];

export function QualityRating({
  summaryId,
  initial,
  isAuthenticated,
}: {
  summaryId: string;
  initial: SummaryRatingSnapshot;
  isAuthenticated: boolean;
}) {
  const [snapshot, setSnapshot] = useState(initial);
  const [showReasons, setShowReasons] = useState(false);
  const [pending, startTransition] = useTransition();

  function rate(value: -1 | 1 | null, reason?: DownvoteReason) {
    if (!isAuthenticated) return;
    startTransition(async () => {
      const response = await fetch("/api/summary-rating", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ summaryId, value, reason }),
      });
      const body = (await response.json().catch(() => null)) as {
        ok: true;
        snapshot: SummaryRatingSnapshot;
      } | null;
      if (!response.ok || !body?.ok) {
        toast.error("Bewertung konnte nicht gespeichert werden.");
        return;
      }
      setSnapshot(body.snapshot);
      setShowReasons(value === -1 && !reason);
      toast.success(value === null ? "Bewertung entfernt." : "Danke für dein Feedback.");
    });
  }

  return (
    <section
      aria-labelledby="rating-heading"
      className="rounded-2xl border border-line bg-card p-6"
    >
      <p className="font-mono text-[11px] text-brand-ink uppercase tracking-[0.14em]">
        Qualitätsfeedback
      </p>
      <h2 id="rating-heading" className="mt-2 font-display text-xl">
        Ist diese Zusammenfassung hilfreich und vertrauenswürdig?
      </h2>
      <p className="mt-2 text-ink-soft text-sm">
        Bewerte die Qualität dieser Zusammenfassung – nicht, ob dir die Nachricht gefällt.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending || !isAuthenticated}
          aria-pressed={snapshot.userValue === 1}
          onClick={() => rate(snapshot.userValue === 1 ? null : 1)}
          className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm transition hover:border-brand focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50 aria-pressed:border-brand aria-pressed:bg-brand-wash"
        >
          <FiThumbsUp aria-hidden /> Hilfreich <span className="tabular-nums">{snapshot.up}</span>
        </button>
        <button
          type="button"
          disabled={pending || !isAuthenticated}
          aria-pressed={snapshot.userValue === -1}
          onClick={() => rate(snapshot.userValue === -1 ? null : -1)}
          className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm transition hover:border-warn focus-visible:outline-2 focus-visible:outline-warn disabled:opacity-50 aria-pressed:border-warn aria-pressed:bg-warn-wash"
        >
          <FiThumbsDown aria-hidden /> Nicht hilfreich{" "}
          <span className="tabular-nums">{snapshot.down}</span>
        </button>
        <span className="font-mono text-ink-mute text-xs">Gesamt {snapshot.score}</span>
      </div>
      {!isAuthenticated && (
        <p className="mt-4 text-ink-soft text-sm">
          <Link className="text-brand-ink underline underline-offset-4" href="/anmelden">
            Anmelden
          </Link>{" "}
          zum Bewerten.
        </p>
      )}
      {showReasons && snapshot.userValue === -1 && (
        <fieldset className="mt-5 border-line-soft border-t pt-4">
          <legend className="px-1 font-medium text-sm">
            Was sollten wir verbessern? (optional)
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {reasons.map((reason) => (
              <button
                key={reason.value}
                type="button"
                disabled={pending}
                onClick={() => rate(-1, reason.value)}
                className="rounded-full bg-bg-warm px-3 py-1.5 text-ink-soft text-xs hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-brand"
              >
                {reason.label}
              </button>
            ))}
          </div>
        </fieldset>
      )}
    </section>
  );
}
