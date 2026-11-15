"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { FiArrowUp, FiCheckCircle, FiLogIn } from "react-icons/fi";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  storyId: string;
  initialCount: number;
  /** Whether the reader is logged in. Voting requires an account. */
  isAuthenticated: boolean;
};

type Status = "idle" | "voted" | "duplicate" | "error" | "login";

const PILL_CLASS = cn(buttonVariants({ variant: "outline", size: "sm" }));
const COUNT_CLASS =
  "-mr-1 rounded-full bg-bg-warm px-2 py-0.5 text-[0.75rem] text-ink-soft tabular-nums";

export function VoteButton({ storyId, initialCount, isAuthenticated }: Props) {
  const t = useTranslations("radar");
  const [count, setCount] = useState(initialCount);
  const [status, setStatus] = useState<Status>("idle");
  const [pending, startTransition] = useTransition();

  // Once the server confirms this account already voted, lock the button —
  // re-clicking would just re-trigger a "duplicate" round-trip.
  const locked = status === "voted" || status === "duplicate";

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
      <div className="flex items-start">
        <Link href="/anmelden" className={PILL_CLASS}>
          <FiLogIn aria-hidden />
          <span>{t("vote.login_cta")}</span>
          <span className={COUNT_CLASS}>{count}</span>
        </Link>
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
    <div className="flex items-start">
      <button
        type="button"
        onClick={onClick}
        disabled={pending || locked}
        aria-busy={pending}
        aria-pressed={locked}
        className={cn(PILL_CLASS, locked && "border-brand bg-brand-wash text-brand-ink")}
      >
        {locked ? <FiCheckCircle aria-hidden /> : <FiArrowUp aria-hidden />}
        <span>{label}</span>
        <span className={COUNT_CLASS}>{count}</span>
      </button>
    </div>
  );
}
