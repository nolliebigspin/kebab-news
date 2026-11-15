import type { OutletLean } from "@kebab/db";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { leanColor } from "@/lib/lean";
import { cn } from "@/lib/utils";

/** Filled stop in the lean's colour; hollow when the lean did not report. */
export function LeanDot({
  lean,
  hollow,
  className,
}: {
  lean: OutletLean;
  hollow?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 shrink-0 rounded-full border-2", className)}
      style={{
        background: hollow ? "var(--skewer-ring, var(--bg))" : leanColor(lean),
        borderColor: hollow ? "var(--line)" : leanColor(lean),
      }}
    />
  );
}

export function LeanLabel({ lean }: { lean: OutletLean }) {
  const t = useTranslations("radar");
  return <>{t(`lean.${lean}`)}</>;
}

export function LeanBadge({ lean, className }: { lean: OutletLean; className?: string }) {
  return (
    <Badge variant="outline" className={cn("gap-1.5 text-ink-soft", className)}>
      <LeanDot lean={lean} />
      <LeanLabel lean={lean} />
    </Badge>
  );
}
