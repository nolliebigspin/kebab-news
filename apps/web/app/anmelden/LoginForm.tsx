"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useId, useState, useTransition } from "react";
import { FiCheckCircle } from "react-icons/fi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const t = useTranslations("auth");
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [errored, setErrored] = useState(false);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrored(false);
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/sign-in/magic-link", {
          method: "POST",
          headers: { "content-type": "application/json" },
          // callbackURL is where the magic-link lands after verification. The
          // ?angemeldet=1 marker is consumed once by <LoginToast> to show the
          // "logged in" toast, then stripped from the URL.
          body: JSON.stringify({ email, callbackURL: "/radar?angemeldet=1" }),
        });
        if (res.ok) setSent(true);
        else setErrored(true);
      } catch {
        setErrored(true);
      }
    });
  }

  if (sent) {
    return (
      <Alert>
        <FiCheckCircle aria-hidden />
        <AlertTitle>{t("link_sent_title")}</AlertTitle>
        <AlertDescription>{t("link_sent_body", { email })}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field data-invalid={errored || undefined}>
        <FieldLabel htmlFor={emailId}>{t("email_label")}</FieldLabel>
        <Input
          id={emailId}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("email_placeholder")}
          aria-invalid={errored || undefined}
          aria-describedby={errored ? `${emailId}-error` : `${emailId}-consent`}
        />
        {errored ? (
          <FieldError id={`${emailId}-error`}>{t("error")}</FieldError>
        ) : (
          <FieldDescription id={`${emailId}-consent`}>{t("consent")}</FieldDescription>
        )}
      </Field>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t("sending") : t("send_link")}
      </Button>
    </form>
  );
}
