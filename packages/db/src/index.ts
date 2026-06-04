import { env } from "@kebab/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

// Standard Postgres wire-protocol driver (postgres-js). Works against Neon
// today and any self-hosted Postgres later — switching providers is a
// DATABASE_URL change, nothing else. `prepare: false` keeps it compatible
// with connection poolers (pgbouncer / Neon pooled endpoint) that don't
// support the extended protocol's prepared statements.
const client = postgres(env.DATABASE_URL, { prepare: false });

export const db = drizzle(client, { schema });
export type DB = typeof db;

export * from "./schema";
