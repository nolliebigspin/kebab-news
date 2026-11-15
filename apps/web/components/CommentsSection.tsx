"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type FormEvent, useState, useTransition } from "react";
import { FiFlag, FiMessageCircle, FiThumbsUp, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

export type PublicComment = {
  id: string;
  content: string;
  userId: string;
  authorName: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  helpfulCount: number;
};

export function CommentsSection({
  summaryId,
  comments,
  currentUserId,
}: {
  summaryId: string;
  comments: PublicComment[];
  currentUserId?: string;
}) {
  const t = useTranslations("story.comments");
  const router = useRouter();
  const [content, setContent] = useState("");
  const [sort, setSort] = useState<"newest" | "helpful">("newest");
  const [pending, startTransition] = useTransition();
  const ordered = [...comments].sort((a, b) =>
    sort === "helpful" ? b.helpfulCount - a.helpfulCount : b.createdAt.localeCompare(a.createdAt)
  );

  async function mutate(payload: Record<string, unknown>) {
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("request_failed");
    router.refresh();
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      try {
        await mutate({ action: "create", summaryId, content });
        setContent("");
        toast.success(t("published"));
      } catch {
        toast.error(t("publish_error"));
      }
    });
  }

  function act(payload: Record<string, unknown>, success: string) {
    startTransition(async () => {
      try {
        await mutate(payload);
        toast.success(success);
      } catch {
        toast.error(t("action_error"));
      }
    });
  }

  return (
    <section aria-labelledby="comments-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="comments-heading" className="font-display text-title">
            {t("heading")} <span className="text-ink-mute">{comments.length}</span>
          </h2>
          <p className="mt-2 text-ink-soft text-sm">{t("description")}</p>
        </div>
        <label className="text-ink-soft text-sm">
          {t("sort_label")}{" "}
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as "newest" | "helpful")}
            className="h-9 rounded-full border border-line bg-surface-raised px-3 text-ink outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <option value="newest">{t("sort_newest")}</option>
            <option value="helpful">{t("sort_helpful")}</option>
          </select>
        </label>
      </div>

      {currentUserId ? (
        <form onSubmit={submit} className="mt-6 rounded-2xl bg-bg-warm p-4">
          <label htmlFor="new-comment" className="sr-only">
            {t("comment_label")}
          </label>
          <textarea
            id="new-comment"
            required
            minLength={3}
            maxLength={2000}
            rows={3}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={t("placeholder")}
            className="w-full resize-y rounded-xl border border-line bg-surface-raised p-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          />
          <div className="mt-3 flex items-center justify-between gap-4">
            <span className="text-ink-mute text-xs">{t("limit")}</span>
            <Button type="submit" disabled={pending || content.trim().length < 3}>
              {t("submit")}
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-6 rounded-2xl bg-bg-warm p-4 text-ink-soft text-sm">
          <Link href="/anmelden" className="text-brand-ink underline underline-offset-4">
            {t("login")}
          </Link>
          {t("login_suffix")}
        </p>
      )}

      {ordered.length === 0 ? (
        <p className="mt-8 text-ink-mute text-sm">{t("empty")}</p>
      ) : (
        <ol className="mt-8 space-y-5">
          {ordered.map((comment) => (
            <li
              key={comment.id}
              className={`border-line-soft border-t pt-5 ${comment.parentId ? "ml-4 border-l-2 border-l-brand-wash pl-4 sm:ml-10" : ""}`}
            >
              <header className="flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-mute text-sm">
                <span className="font-semibold text-ink">{comment.authorName}</span>
                <time dateTime={comment.createdAt}>
                  {formatDate(comment.createdAt, "datetime")}
                </time>
                {comment.updatedAt !== comment.createdAt && <span>{t("edited")}</span>}
              </header>
              <p className="mt-2 whitespace-pre-wrap text-[0.9375rem] leading-relaxed">
                {comment.content}
              </p>
              {currentUserId && (
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-ink-mute text-sm">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      act({ action: "helpful", commentId: comment.id }, t("helpful_saved"))
                    }
                    className="inline-flex items-center gap-1.5 hover:text-brand-ink"
                  >
                    <FiThumbsUp aria-hidden /> {t("helpful")} {comment.helpfulCount}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      const reply = window.prompt(t("reply_prompt"));
                      if (reply)
                        act(
                          { action: "create", summaryId, parentId: comment.id, content: reply },
                          t("reply_published")
                        );
                    }}
                    className="inline-flex items-center gap-1.5 hover:text-brand-ink"
                  >
                    <FiMessageCircle aria-hidden /> {t("reply")}
                  </button>
                  {comment.userId === currentUserId ? (
                    <>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          const edited = window.prompt(t("edit_prompt"), comment.content);
                          if (edited && edited !== comment.content)
                            act(
                              { action: "edit", commentId: comment.id, content: edited },
                              t("edit_saved")
                            );
                        }}
                        className="hover:text-brand-ink"
                      >
                        {t("edit")}
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          window.confirm(t("delete_confirm")) &&
                          act({ action: "delete", commentId: comment.id }, t("deleted"))
                        }
                        className="inline-flex items-center gap-1.5 hover:text-destructive"
                      >
                        <FiTrash2 aria-hidden /> {t("delete")}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        act(
                          {
                            action: "report",
                            commentId: comment.id,
                            reason: t("report_reason"),
                          },
                          t("reported")
                        )
                      }
                      className="inline-flex items-center gap-1.5 hover:text-warn"
                    >
                      <FiFlag aria-hidden /> {t("report")}
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
