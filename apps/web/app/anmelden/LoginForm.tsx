"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

type Status = "idle" | "sent" | "error";

export function LoginForm() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/sign-in/magic-link", {
          method: "POST",
          headers: { "content-type": "application/json" },
          // callbackURL is where the magic-link lands after verification.
          body: JSON.stringify({ email, callbackURL: "/radar" }),
        });
        setStatus(res.ok ? "sent" : "error");
      } catch {
        setStatus("error");
      }
    });
  }

  if (status === "sent") {
    return (
      <div className="rounded-md border border-brand/40 bg-brand/5 px-4 py-5">
        <h2 className="font-display text-ink text-lg">{t("link_sent_title")}</h2>
        <p className="mt-2 text-ink-soft text-sm leading-relaxed">
          {t("link_sent_body", { email })}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block font-mono text-[11px] text-ink-mute uppercase tracking-[0.12em]"
        >
          {t("email_label")}
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("email_placeholder")}
          className="w-full rounded-md border border-line bg-bg-warm px-3 py-2 text-base text-ink outline-none transition-colors focus:border-brand"
        />
      </div>

      {status === "error" && <p className="text-red-600 text-sm">{t("error")}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t("sending") : t("send_link")}
      </Button>

      <p className="text-ink-mute text-xs leading-relaxed">{t("consent")}</p>
    </form>
  );
}
