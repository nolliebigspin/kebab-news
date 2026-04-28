import { sql } from "drizzle-orm";

import { db } from "@/lib/db";

const result = await db.execute(sql`SELECT extname FROM pg_extension WHERE extname = 'vector'`);
if (result.rows.length === 0) {
  console.error("FAIL: pgvector extension not enabled");
  process.exit(1);
}
console.log("PASS: pgvector extension enabled");
