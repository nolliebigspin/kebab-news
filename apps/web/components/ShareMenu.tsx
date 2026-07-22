"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { FiCheck, FiCopy, FiShare2 } from "react-icons/fi";

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
      <button
        type="button"
        onClick={nativeShare}
        className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand-ink focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
      >
        <FiShare2 aria-hidden /> {t("native")}
      </button>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-2 text-sm hover:border-brand focus-visible:outline-2 focus-visible:outline-brand"
      >
        {copied ? <FiCheck aria-hidden /> : <FiCopy aria-hidden />}{" "}
        {copied ? t("copied") : t("copy")}
      </button>
      <details className="relative">
        <summary className="cursor-pointer list-none rounded-full border border-line px-3 py-2 text-sm hover:border-brand focus-visible:outline-2 focus-visible:outline-brand">
          {t("more")}
        </summary>
        <div className="absolute right-0 z-20 mt-2 grid min-w-40 rounded-xl border border-line bg-bg p-2 shadow-xl">
          {targets.map((target) => (
            <a
              key={target.channel}
              href={target.href}
              target={target.channel === "email" ? undefined : "_blank"}
              rel="noopener noreferrer"
              onClick={() => track(target.channel)}
              className="rounded-lg px-3 py-2 text-sm hover:bg-bg-warm focus-visible:outline-2 focus-visible:outline-brand"
            >
              {target.label}
            </a>
          ))}
        </div>
      </details>
    </div>
  );
}
