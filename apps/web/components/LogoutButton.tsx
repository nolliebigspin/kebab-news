"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const t = useTranslations("header");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      // Better Auth's sign-out handler parses the request body as JSON, so an
      // empty body with a JSON content-type 500s ("Unexpected end of JSON
      // input"). Send an empty object.
      await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      // The Toaster lives in the root layout, so the toast survives the refresh.
      toast.success(t("toast_logged_out"));
      router.refresh();
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={pending}>
      <span className="font-mono text-xs">{t("logout")}</span>
    </Button>
  );
}
