"use client";

import type { DownvoteReason } from "@kebab/db";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { FiThumbsDown, FiThumbsUp } from "react-icons/fi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { SummaryRatingSnapshot } from "@/lib/summary-ratings";

const reasons: DownvoteReason[] = [
  "missing_information",
  "misleading",
  "unbalanced_sources",
  "weak_framing_analysis",
  "outdated",
  "factual_error",
  "other",
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
  const t = useTranslations("story.rating");
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
        toast.error(t("error"));
        return;
      }
      setSnapshot(body.snapshot);
      setShowReasons(value === -1 && !reason);
      toast.success(value === null ? t("removed") : t("saved"));
    });
  }

  return (
    <section aria-labelledby="rating-heading" className="rounded-2xl bg-bg-warm p-6 sm:p-8">
      <h2 id="rating-heading" className="font-display text-title">
        {t("heading")}
      </h2>
      <p className="mt-2 text-ink-soft text-sm">{t("description")}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={pending || !isAuthenticated}
          aria-pressed={snapshot.userValue === 1}
          onClick={() => rate(snapshot.userValue === 1 ? null : 1)}
        >
          <FiThumbsUp aria-hidden /> {t("up")} <span className="tabular-nums">{snapshot.up}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending || !isAuthenticated}
          aria-pressed={snapshot.userValue === -1}
          onClick={() => rate(snapshot.userValue === -1 ? null : -1)}
        >
          <FiThumbsDown aria-hidden /> {t("down")}{" "}
          <span className="tabular-nums">{snapshot.down}</span>
        </Button>
        <span className="text-ink-mute text-sm tabular-nums">
          {t("score", { score: snapshot.score })}
        </span>
      </div>
      {!isAuthenticated && (
        <p className="mt-4 text-ink-soft text-sm">
          <Link className="text-brand-ink underline underline-offset-4" href="/anmelden">
            {t("login")}
          </Link>{" "}
          {t("login_suffix")}
        </p>
      )}
      {showReasons && snapshot.userValue === -1 && (
        <fieldset className="mt-5 border-line border-t pt-4">
          <legend className="px-1 font-medium text-sm">{t("reason_heading")}</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {reasons.map((reason) => (
              <Button
                key={reason}
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => rate(-1, reason)}
              >
                {t(`reason.${reason}`)}
              </Button>
            ))}
          </div>
        </fieldset>
      )}
    </section>
  );
}
