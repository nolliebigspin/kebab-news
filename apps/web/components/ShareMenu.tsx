"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { FiCheck, FiChevronDown, FiCopy, FiShare2 } from "react-icons/fi";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Channel =
  | "native"
  | "copy"
  | "x"
  | "linkedin"
  | "facebook"
  | "whatsapp"
  | "telegram"
  | "email";

export function ShareMenu({
  summaryId,
  title,
  sourceCount,
  canonicalUrl,
}: {
  summaryId: string;
  title: string;
  sourceCount: number;
  canonicalUrl: string;
}) {
  const t = useTranslations("story.share");
  const [copied, setCopied] = useState(false);
  const text = t("text", { sourceCount, title });

  function track(channel: Channel) {
    void fetch("/api/share", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ summaryId, channel }),
      keepalive: true,
    });
  }

  async function nativeShare() {
    if (navigator.share) {
      await navigator.share({ title, text, url: canonicalUrl });
      track("native");
      return;
    }
    await copyLink();
  }

  async function copyLink() {
    await navigator.clipboard.writeText(canonicalUrl);
    setCopied(true);
    track("copy");
    window.setTimeout(() => setCopied(false), 1800);
  }

  const targets: Array<{ channel: Channel; label: string; href: string }> = [
    {
      channel: "x",
      label: t("channel.x"),
      href: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(canonicalUrl)}`,
    },
    {
      channel: "linkedin",
      label: t("channel.linkedin"),
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl)}`,
    },
    {
      channel: "facebook",
      label: t("channel.facebook"),
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}`,
    },
    {
      channel: "whatsapp",
      label: t("channel.whatsapp"),
      href: `https://wa.me/?text=${encodeURIComponent(`${text} ${canonicalUrl}`)}`,
    },
    {
      channel: "telegram",
      label: t("channel.telegram"),
      href: `https://t.me/share/url?url=${encodeURIComponent(canonicalUrl)}&text=${encodeURIComponent(text)}`,
    },
    {
      channel: "email",
      label: t("channel.email"),
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${canonicalUrl}`)}`,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("group_label")}>
      <Button type="button" onClick={nativeShare}>
        <FiShare2 aria-hidden /> {t("native")}
      </Button>
      <Button type="button" variant="outline" onClick={copyLink} aria-live="polite">
        {copied ? <FiCheck aria-hidden /> : <FiCopy aria-hidden />}
        {copied ? t("copied") : t("copy")}
      </Button>
      <details className="group/share relative">
        <summary
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "list-none [&::-webkit-details-marker]:hidden"
          )}
        >
          {t("more")}
          <FiChevronDown aria-hidden className="transition-transform group-open/share:rotate-180" />
        </summary>
        {/* Anchored left: when the row wraps on phones, "Mehr" sits at the left edge. */}
        <div className="absolute left-0 z-20 mt-2 grid w-48 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface-raised p-2 shadow-xl">
          {targets.map((target) => (
            <a
              key={target.channel}
              href={target.href}
              target={target.channel === "email" ? undefined : "_blank"}
              rel="noopener noreferrer"
              onClick={() => track(target.channel)}
              className="rounded-xl px-3 py-2 text-sm outline-none hover:bg-bg-warm focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              {target.label}
            </a>
          ))}
        </div>
      </details>
    </div>
  );
}
