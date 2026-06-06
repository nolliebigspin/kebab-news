"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Shows the "logged in" toast after a magic-link redirect. The magic-link lands
 * via a server redirect, so there's no client login event to hook into — the
 * LoginForm appends ?angemeldet=1 to the callbackURL and this component, mounted
 * in the root layout, consumes the marker once and strips it from the URL.
 */
export function LoginToast() {
  const t = useTranslations("auth");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // StrictMode runs effects twice in dev; guard against a duplicate toast.
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    if (searchParams.get("angemeldet") !== "1") return;
    shown.current = true;

    toast.success(t("toast_logged_in"));

    // Strip the marker without a navigation/reload so a refresh won't re-toast.
    const params = new URLSearchParams(searchParams);
    params.delete("angemeldet");
    const query = params.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }, [pathname, searchParams, t]);

  return null;
}
