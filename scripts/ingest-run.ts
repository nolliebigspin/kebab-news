/**
 * Manually trigger the ingest cron route against a running dev server (or
 * any host you point INGEST_URL at).
 *
 * Usage:
 *   mise exec -- bun ingest:run                 # localhost:3000
 *   INGEST_URL=https://kebab.news mise exec -- bun ingest:run
 *   INGEST_TIMEOUT_MS=180000 mise exec -- bun ingest:run
 *
 * Reads CRON_SECRET from .env.local / .env so you never paste the secret
 * on the command line. Aborts after INGEST_TIMEOUT_MS (default 90s) — the
 * server keeps running in the background; logs still land in Vercel or the
 * `bun dev` terminal.
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const baseUrl = process.env.INGEST_URL ?? "http://localhost:3000";
const secret = process.env.CRON_SECRET;
const timeoutMs = Number(process.env.INGEST_TIMEOUT_MS ?? 90_000);

if (!secret) {
  console.error("CRON_SECRET not set in .env / .env.local");
  process.exit(1);
}
if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
  console.error(
    `INGEST_TIMEOUT_MS must be a positive number, got ${process.env.INGEST_TIMEOUT_MS}`
  );
  process.exit(1);
}

const url = `${baseUrl.replace(/\/$/, "")}/api/cron/ingest`;
console.log(`→ GET ${url}  (timeout ${(timeoutMs / 1000).toFixed(0)}s)`);

const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

const startedAt = Date.now();
let response: Response;
try {
  response = await fetch(url, {
    headers: { authorization: `Bearer ${secret}` },
    signal: controller.signal,
  });
} catch (err) {
  clearTimeout(timeoutId);
  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
  if (err instanceof Error && err.name === "AbortError") {
    console.error(`✕ aborted after ${elapsedSec}s (INGEST_TIMEOUT_MS=${timeoutMs})`);
    console.error(
      "  The server keeps running — check Vercel logs / `bun dev` terminal for the result."
    );
  } else {
    console.error(`✕ fetch failed after ${elapsedSec}s`);
    console.error(err);
  }
  process.exit(1);
}
clearTimeout(timeoutId);

const body = await response.text();
const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);

if (!response.ok) {
  console.error(`← ${response.status} ${response.statusText} (${elapsedSec}s)`);
  console.error(body.slice(0, 1000));
  process.exit(1);
}

try {
  const json = JSON.parse(body);
  console.log(`← 200 OK (${elapsedSec}s)\n`);
  console.log(JSON.stringify(json, null, 2));
} catch {
  console.log(body);
}
