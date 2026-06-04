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
import { nextRunDate, RUN_HOURS_UTC } from "@kebab/core";
import { runIngest } from "./ingest";
import { runAutoRewrites } from "./rewrite";

function log(event: string, fields: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...fields }));
}

/** Milliseconds from `now` until the next scheduled UTC hour. */
function msUntilNextRun(now: Date): { ms: number; at: Date } {
  const at = nextRunDate(now);
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

    // After ingest, pick up any story that has crossed the vote threshold and
    // has no rewrite yet. Votes are recorded by the web app; the AI rewrite
    // runs only here (CLAUDE.md rule #5).
    const auto = await runAutoRewrites(log);
    if (auto.triggered > 0) log("worker.auto_rewrites_done", auto);
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
