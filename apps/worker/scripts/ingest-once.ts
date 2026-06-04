import "@kebab/env/load";
/**
 * Run one ingest pass against the configured DATABASE_URL and exit. This is
 * the manual operator trigger (`bun ingest:run` → `ingest:once`), replacing
 * the old HTTP-based scripts/ingest-run.ts. Importing @kebab/env loads the
 * repo-root .env, so no dotenv wiring is needed here.
 */
import { runIngest } from "../src/ingest";

const result = await runIngest();
console.log(JSON.stringify(result, null, 2));
process.exit(0);
