import "@kebab/env/load";
/**
 * Long-running ingest worker. Replaces the old Vercel-Cron → route-handler
 * path. Runs as a single persistent process (e.g. a Dokploy container) and
 * paces itself: it sleeps until the next scheduled UTC hour, runs one full
 * ingest pass, then sleeps again. No external queue, no HTTP layer.
 *
 * The schedule mirrors the previous Vercel cron (`0 6,12,18 * * *` UTC →
 * 07/13/19 CET, 08/14/20 CEST). RUN_HOURS_UTC is the single knob.
 */
import { runIngest } from "./ingest";

const RUN_HOURS_UTC = [6, 12, 18];

function log(event: string, fields: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...fields }));
}

/** Milliseconds from `now` until the next scheduled UTC hour. */
function msUntilNextRun(now: Date): { ms: number; at: Date } {
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
  const at = candidates[0];
  return { ms: at.getTime() - now.getTime(), at };
}

async function safeRun(reason: string): Promise<void> {
  log("worker.run_start", { reason });
  try {
    const result = await runIngest();
    log("worker.run_done", {
      runId: result.runId,
      newArticles: result.newArticles,
      newStories: result.newStories,
      durationMs: result.durationMs,
    });
  } catch (err) {
    // Never let one failed pass kill the scheduler loop.
    log("worker.run_error", { error: err instanceof Error ? err.message : String(err) });
  }
}

let stopped = false;

async function main(): Promise<void> {
  // RUN_ON_BOOT=true triggers an immediate pass when the container starts —
  // handy for the first deploy and for `bun run start` smoke checks.
  if (process.env.RUN_ON_BOOT === "true") {
    await safeRun("boot");
  }

  log("worker.scheduler_started", { runHoursUtc: RUN_HOURS_UTC });

  while (!stopped) {
    const { ms, at } = msUntilNextRun(new Date());
    log("worker.sleeping", { nextRunAt: at.toISOString(), sleepMs: ms });
    await new Promise((resolve) => setTimeout(resolve, ms));
    if (stopped) break;
    await safeRun("scheduled");
  }
}

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    log("worker.shutdown", { signal: sig });
    stopped = true;
    process.exit(0);
  });
}

main().catch((err) => {
  log("worker.fatal", { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
