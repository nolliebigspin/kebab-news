"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

type Props = {
  storyId: string;
  initialCount: number;
  /** Cumulative votes needed before the story qualifies for a rewrite. */
  threshold?: number;
};

type Status = "idle" | "voted" | "duplicate" | "error";

export function VoteButton({ storyId, initialCount, threshold }: Props) {
  const t = useTranslations("radar");
  const [count, setCount] = useState(initialCount);
  const [status, setStatus] = useState<Status>("idle");
  const [pending, startTransition] = useTransition();

  // Once the server confirms the IP already voted today, lock the button
  // — re-clicking would just re-trigger a "duplicate" round-trip.
  const locked = status === "voted" || status === "duplicate";

  const reached = threshold !== undefined && count >= threshold;

  function onClick() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/vote", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ storyId }),
        });
        const body = (await res.json()) as
          | { ok: true; kind: "recorded" | "duplicate"; count: number }
          | { ok: false; error: string };

        if (!body.ok) {
          setStatus("error");
          return;
        }
        setCount(body.count);
        setStatus(body.kind === "recorded" ? "voted" : "duplicate");
      } catch {
        setStatus("error");
      }
    });
  }

  const label =
    status === "duplicate"
      ? t("vote.already_voted")
      : status === "voted"
        ? t("vote.voted")
        : status === "error"
          ? t("vote.error")
          : t("vote.cta");

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending || locked}
        aria-busy={pending}
        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-bg-warm px-3 py-1 font-mono text-[11px] text-ink uppercase tracking-[0.12em] transition-colors hover:border-brand hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-line disabled:hover:bg-bg-warm disabled:hover:text-ink"
      >
        <span aria-hidden>▲</span>
        <span>{label}</span>
        <span className="font-mono tabular-nums">{count}</span>
      </button>
      {threshold !== undefined && (
        <span className="font-mono text-[10px] text-ink-mute uppercase tracking-[0.12em]">
          {reached
            ? t("vote.threshold_reached")
            : t("vote.threshold_progress", { count, threshold })}
        </span>
      )}
    </div>
  );
}
