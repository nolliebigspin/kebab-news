"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { FiMoon, FiSun } from "react-icons/fi";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("header");
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const label = isDark ? t("theme_to_light") : t("theme_to_dark");

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={className}
      aria-label={label}
      title={label}
      disabled={!mounted}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted && isDark ? <FiSun aria-hidden /> : <FiMoon aria-hidden />}
    </Button>
  );
}
