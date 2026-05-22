"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

type Props = {
  storyId: string;
  initialCount: number;
};

type Status = "idle" | "voted" | "duplicate" | "error";

export function VoteButton({ storyId, initialCount }: Props) {
  const t = useTranslations("radar");
  const [count, setCount] = useState(initialCount);
  const [status, setStatus] = useState<Status>("idle");
  const [pending, startTransition] = useTransition();

  // Once the server confirms the IP already voted today, lock the button
  // — re-clicking would just re-trigger a "duplicate" round-trip.
  const locked = status === "voted" || status === "duplicate";

  function onClick(e: React.MouseEvent) {
    // The button sits inside a parent <Link> on the radar list. Without this
    // the click bubbles up and navigates instead of voting.
    e.preventDefault();
    e.stopPropagation();

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
    <button
      type="button"
      onClick={onClick}
      disabled={pending || locked}
      aria-busy={pending}
      className="inline-flex items-center gap-2 rounded-full border border-line bg-bg-warm px-3 py-1 font-mono text-[11px] text-ink uppercase tracking-[0.12em] transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-line disabled:hover:text-ink"
    >
      <span aria-hidden>▲</span>
      <span>{label}</span>
      <span className="font-mono tabular-nums">{count}</span>
    </button>
  );
}
