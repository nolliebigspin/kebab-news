"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type Props = {
  storyId: string;
  initialCount: number;
  /** Cumulative votes needed before the story qualifies for a rewrite. */
  threshold?: number;
  /** Whether the reader is logged in. Voting requires an account. */
  isAuthenticated: boolean;
};

type Status = "idle" | "voted" | "duplicate" | "error" | "login";

const PILL_CLASS =
  "inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-bg-warm px-3 py-1 font-mono text-[11px] text-ink uppercase tracking-[0.12em] outline-none transition-colors hover:border-brand hover:bg-brand hover:text-white focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-line disabled:hover:bg-bg-warm disabled:hover:text-ink";

export function VoteButton({ storyId, initialCount, threshold, isAuthenticated }: Props) {
  const t = useTranslations("radar");
  const [count, setCount] = useState(initialCount);
  const [status, setStatus] = useState<Status>("idle");
  const [pending, startTransition] = useTransition();

  // Once the server confirms this account already voted, lock the button —
  // re-clicking would just re-trigger a "duplicate" round-trip.
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
        // Session expired between render and click — fall back to the login CTA.
        if (res.status === 401) {
          setStatus("login");
          return;
        }
        const body = (await res.json()) as
          | { ok: true; kind: "recorded" | "duplicate"; count: number }
          | { ok: false; error: string };

        if (!body.ok) {
          setStatus("error");
          toast.error(t("vote.toast_error"));
          return;
        }
        setCount(body.count);
        if (body.kind === "recorded") {
          setStatus("voted");
          toast.success(t("vote.toast_recorded"));
        } else {
          setStatus("duplicate");
          toast.info(t("vote.toast_duplicate"));
        }
      } catch {
        setStatus("error");
        toast.error(t("vote.toast_error"));
      }
    });
  }

  // Logged out (or session lapsed mid-session): render a login CTA instead of
  // the vote button. The server gates /api/vote regardless; this is UX only.
  if (!isAuthenticated || status === "login") {
    return (
      <div className="flex flex-col items-end gap-1">
        <Link href="/anmelden" className={PILL_CLASS}>
          <span aria-hidden>▲</span>
          <span>{t("vote.login_cta")}</span>
          <span className="font-mono tabular-nums">{count}</span>
        </Link>
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
        className={PILL_CLASS}
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
