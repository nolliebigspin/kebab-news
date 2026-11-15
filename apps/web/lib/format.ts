import { formatDistanceStrict } from "date-fns";
import { de } from "date-fns/locale";

/**
 * The one place dates are formatted for readers. Every absolute date is pinned
 * to Europe/Berlin so server renders (UTC on Vercel) and browsers agree, and
 * relative ages use proper German case ("vor 18 Tagen", not "vor 18 Tage").
 */
const TIME_ZONE = "Europe/Berlin";

const formatters = {
  /** 15.11.2026 */
  short: new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: TIME_ZONE,
  }),
  /** 15. Nov. 2026 */
  long: new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeZone: TIME_ZONE }),
  /** 15. Nov. 2026, 14:05 */
  datetime: new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TIME_ZONE,
  }),
} as const;

export type DateStyle = keyof typeof formatters;

export function formatDate(date: Date | string, style: DateStyle = "long"): string {
  return formatters[style].format(typeof date === "string" ? new Date(date) : date);
}

/** "vor 3 Stunden", "vor 18 Tagen". */
export function formatRelative(date: Date | string, now: Date = new Date()): string {
  const value = typeof date === "string" ? new Date(date) : date;
  if (now.getTime() - value.getTime() < 60_000) return "gerade eben";
  return formatDistanceStrict(value, now, { addSuffix: true, locale: de });
}
