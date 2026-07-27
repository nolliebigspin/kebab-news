"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { FiArrowUp, FiCheckCircle, FiLogIn } from "react-icons/fi";
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
  "inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface-raised px-3.5 py-2 font-semibold text-ink text-xs outline-none transition-all hover:border-brand/60 hover:bg-brand-wash hover:text-brand-ink focus-visible:ring-3 focus-visible:ring-brand/35 disabled:cursor-not-allowed disabled:opacity-60";

function VoteProgress({
  count,
  threshold,
  reached,
}: {
  count: number;
  threshold?: number;
  reached: boolean;
}) {
  const t = useTranslations("radar");
  if (threshold === undefined) return null;

  return (
    <span className="text-[11px] text-ink-mute leading-4">
      {reached ? t("vote.threshold_reached") : t("vote.threshold_progress", { count, threshold })}
    </span>
  );
}

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
      <div className="flex flex-col items-start gap-1.5">
        <Link href="/anmelden" className={PILL_CLASS}>
          <FiLogIn aria-hidden />
          <span>{t("vote.login_cta")}</span>
          <span className="rounded-md bg-brand-wash px-1.5 py-0.5 font-mono text-[10px] text-brand-ink tabular-nums">
            {count}
          </span>
        </Link>
        <VoteProgress count={count} threshold={threshold} reached={reached} />
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
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={onClick}
        disabled={pending || locked}
        aria-busy={pending}
        className={PILL_CLASS}
      >
        {locked ? <FiCheckCircle aria-hidden /> : <FiArrowUp aria-hidden />}
        <span>{label}</span>
        <span className="rounded-md bg-brand-wash px-1.5 py-0.5 font-mono text-[10px] text-brand-ink tabular-nums">
          {count}
        </span>
      </button>
      <VoteProgress count={count} threshold={threshold} reached={reached} />
    </div>
  );
}
