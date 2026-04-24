"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { routing } from "@/i18n/routing";

export const LanguageSwitcher = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (next: string) => {
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/"));
  };

  return (
    <div className="flex items-center gap-1 font-mono text-xs" style={{ color: "var(--ink-mute)" }}>
      {routing.locales.map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span style={{ color: "var(--line)" }}>·</span>}
          <button
            type="button"
            onClick={() => switchLocale(l)}
            className="cursor-pointer uppercase transition-colors hover:text-(--ink)"
            style={{
              color: l === locale ? "var(--ink)" : undefined,
              fontWeight: l === locale ? 500 : undefined,
            }}
          >
            {l}
          </button>
        </span>
      ))}
    </div>
  );
};
