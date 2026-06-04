/**
 * Worker schedule — kept dependency-free on purpose. The web app imports this
 * into a client component (the "next ingest" countdown), so it must not pull
 * in @kebab/db or the Anthropic SDK. No imports here beyond the standard Date.
 */

/**
 * UTC hours at which the long-running ingest worker runs a full pass. Mirrors
 * the previous Vercel cron (`0 6,12,18 * * *` UTC → 07/13/19 CET, 08/14/20
 * CEST; we accept the 1h DST drift). Single source of truth for both the
 * worker's sleep loop and the web app's countdown.
 */
export const RUN_HOURS_UTC = [6, 12, 18];

/**
 * The next scheduled worker run at or after `now`, derived from RUN_HOURS_UTC.
 */
export function nextRunDate(now: Date = new Date()): Date {
  const candidates: Date[] = [];
  for (const dayOffset of [0, 1]) {
    for (const hour of RUN_HOURS_UTC) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() + dayOffset);
      d.setUTCHours(hour, 0, 0, 0);
      if (d.getTime() > now.getTime()) candidates.push(d);
    }
  }
  candidates.sort((a, b) => a.getTime() - b.getTime());
  return candidates[0];
}
