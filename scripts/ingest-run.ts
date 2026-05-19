/**
 * Manually trigger the ingest cron route against a running dev server (or
 * any host you point INGEST_URL at).
 *
 * Usage:
 *   mise exec -- bun ingest:run                 # localhost:3000
 *   INGEST_URL=https://kebab.news mise exec -- bun ingest:run
 *
 * Reads CRON_SECRET from .env.local / .env so you never paste the secret
 * on the command line.
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const baseUrl = process.env.INGEST_URL ?? "http://localhost:3000";
const secret = process.env.CRON_SECRET;

if (!secret) {
  console.error("CRON_SECRET not set in .env / .env.local");
  process.exit(1);
}

const url = `${baseUrl.replace(/\/$/, "")}/api/cron/ingest`;
console.log(`→ GET ${url}`);

const startedAt = Date.now();
const response = await fetch(url, {
  headers: { authorization: `Bearer ${secret}` },
});

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
