# Phase 1: Database Foundation — Pattern Map

**Mapped:** 2026-04-27
**Files analyzed:** 21 (new) / 4 (modified)
**Analogs found:** 25 / 25 (4 internal, 21 external authoritative)

---

## Greenfield Notice

**This is the project's first DB layer.** The kebab.news codebase currently contains only:

- `src/app/[locale]/...` — next-intl App Router pages
- `src/components/*.tsx` — landing-page UI components
- `src/i18n/{routing.ts,request.ts}` — next-intl config
- `src/lib/constants.ts` — single shared constants module
- `src/middleware.ts` — next-intl locale middleware
- `next.config.ts`, `biome.json`, `tsconfig.json`, `mise.toml`, `package.json`

There is **no `src/lib/db/`, no `src/lib/auth/`, no `tests/`, no `drizzle/`, no `scripts/`**, and the only third-party deps are Next 16 + react + next-intl + react-icons + Biome + TS + Tailwind. There are **no internal analogs for ORM clients, schema definitions, migrations, env validation, or test files** — the planner cannot point at "an existing controller pattern" because none exists.

Consequently, **most analogs in this map are external authoritative sources** (Drizzle docs, Neon docs, T3 Env docs, drizzle-orm source) — these are the canonical patterns the codebase will adopt, all already cited in `01-RESEARCH.md §17`. The few **internal patterns that DO exist and must be respected** are conventions: file layout (`src/lib/`), import alias (`@/*`), Biome formatting, the `check:*` script naming, and the `bun` runtime contract from `mise.toml`.

The planner should:
1. Treat external analogs as the **shape** (imports, API surface, key arguments).
2. Treat internal conventions as **non-negotiable wrappers** (filename casing, alias usage, formatter rules, script naming).
3. Not invent additional internal patterns — there are none to copy.

---

## File Classification

### New files

| New file | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `src/lib/env.ts` | config / validation | request-response (module-load) | T3 Env docs (`env.t3.gg/docs/nextjs`) | external-exact |
| `src/lib/db/index.ts` | service / DB client | request-response | Drizzle Neon HTTP quick-start (`orm.drizzle.team/docs/connect-neon`) | external-exact |
| `src/lib/db/schema.ts` | model / schema | declarative (no I/O) | Drizzle docs `pgTable`, `pgEnum`, `unique` + `drizzle-orm/neon` `usersSync` source | external-exact |
| `src/lib/auth/server.ts` | service / auth (stub) | request-response | Neon Auth Next.js guide (`neon.com/guides/neon-auth-nextjs`) | external-exact |
| `src/lib/auth/client.ts` | service / auth client (stub) | client-side | Neon Auth Next.js guide | external-exact |
| `src/lib/qstash.ts` | service / job queue client | event-driven (deferred) | Upstash QStash README + qstash-js source | external-exact |
| `drizzle.config.ts` | config | build-tooling | `orm.drizzle.team/docs/drizzle-config-file` | external-exact |
| `drizzle/0000_enable_pgvector.sql` | migration (custom) | DDL / one-shot | `orm.drizzle.team/docs/extensions/pg` + custom-migration docs | external-exact |
| `drizzle/0001_initial_schema.sql` | migration (generated) | DDL / one-shot | drizzle-kit `generate` output | auto-generated |
| `drizzle/meta/_journal.json` + `*_snapshot.json` | migration metadata (auto) | n/a | drizzle-kit auto-emit | auto-generated |
| `vitest.config.ts` | config / test framework | build-tooling | Vitest docs default config | external-exact |
| `tests/db/setup.ts` | test fixture | shared utility | Drizzle/Postgres truncate-fixture pattern | external-exact |
| `tests/db/users.schema.test.ts` | test (unit) | query introspection | Vitest + Drizzle introspection pattern | external-exact |
| `tests/db/topics.schema.test.ts` | test (unit) | query introspection | Vitest + Drizzle introspection pattern | external-exact |
| `tests/db/votes.unique.test.ts` | test (integration) | DB write | Vitest + Drizzle `expect.rejects` pattern | external-exact |
| `tests/qstash.init.test.ts` | test (unit) | module-load | RESEARCH.md §11 sample | spec-exact |
| `tests/env.test.ts` | test (unit) | module-load | T3-Env validation test pattern | external-exact |
| `tests/env.example.test.ts` | test (unit) | file I/O | RESEARCH.md §11 sample | spec-exact |
| `scripts/probe-pgvector.ts` | smoke probe | DB query | RESEARCH.md §11 sample | spec-exact |
| `scripts/probe-migration-idempotent.sh` | smoke probe | shell | RESEARCH.md §11 sample | spec-exact |
| `docker-compose.yml` (optional, per Q4) | local dev infra | infra config | RESEARCH.md §10 sample | spec-exact |

### Modified files

| Modified file | Role | What changes | Internal analog |
|---------------|------|--------------|-----------------|
| `package.json` | manifest | add deps + db scripts; rewire `build` | existing `package.json` (preserve `check:*` + scripts conventions) |
| `.env.example` | env scaffold | augment with NEON_AUTH_*, milestone comments; remove BETTER_AUTH_* | existing `.env.example` (preserve format, augment only) |
| `.gitignore` | ignore list | add `drizzle/meta/` if Neon recommends it; keep `.env*` rules | existing `.gitignore` (preserve all) |
| `next.config.ts` (conditional) | bundler config | possibly `serverExternalPackages: ['@neondatabase/serverless']` | existing `next.config.ts` (preserve `withNextIntl` wrap) |
| `CONTRIBUTING.md` (optional) | docs | add Docker fallback section | existing `CONTRIBUTING.md` |

---

## Internal Conventions (must be preserved across ALL new files)

These are extracted from the existing codebase and apply to every new TypeScript file the planner creates.

### Convention 1 — Path alias `@/*` → `./src/*`

**Source:** `tsconfig.json` lines 21-23

```json
"paths": {
  "@/*": ["./src/*"]
}
```

**Apply to:** Every new `.ts` file under `src/` and every test/script importing from `src/`. Use `import { env } from "@/lib/env"` not `import { env } from "../../lib/env"`. The existing `src/app/[locale]/layout.tsx` already demonstrates this:

```typescript
// src/app/[locale]/layout.tsx lines 6-9
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { routing } from "@/i18n/routing";
import { BASE_URL } from "@/lib/constants";
```

### Convention 2 — Biome formatter contract

**Source:** `biome.json` lines 12-28

| Rule | Value | Implication for new code |
|------|-------|--------------------------|
| `indentStyle` | `space` | 2-space indent everywhere |
| `indentWidth` | `2` | — |
| `lineWidth` | `100` | wrap long imports/SQL strings at 100 cols |
| `lineEnding` | `lf` | no CRLF |
| `semicolons` | `always` | every statement terminated with `;` |
| `quoteStyle` | `double` | `"double quotes"` for strings |
| `trailingCommas` | `es5` | trailing comma in arrays/objects, NOT in function params |
| `arrowParentheses` | `always` | `(x) =>`, never `x =>` |
| Imports organize on save | `assist.actions.source.organizeImports: on` | rely on Biome to sort imports — do not hand-order |

**Apply to:** All new `.ts` and `.tsx` files. Run `bun check:format` and `bun check:lint` before commit.

### Convention 3 — TS strict mode + ES2017 + bundler resolution

**Source:** `tsconfig.json` lines 4-12

```json
"target": "ES2017",
"lib": ["dom", "dom.iterable", "esnext"],
"strict": true,
"esModuleInterop": true,
"module": "esnext",
"moduleResolution": "bundler",
"resolveJsonModule": true,
"isolatedModules": true
```

**Apply to:** All new files type-check cleanly under `strict: true`. No `any` shortcuts. `tsc --noEmit` is part of `check:all` and must stay green.

### Convention 4 — Single-export-per-file under `src/lib/`

**Source:** `src/lib/constants.ts` (the only existing file in `src/lib/`)

```typescript
// src/lib/constants.ts
export const GITHUB_URL = "https://github.com/nolliebigspin/kebab-news";
export const BASE_URL = "https://kebab.news";
```

**Pattern:** Lowercase filename, named exports only (no `default` exports for lib modules), one concern per file.

**Apply to:**
- `src/lib/env.ts` → `export const env = createEnv(...)`
- `src/lib/db/index.ts` → `export const db = drizzle(...)` + `export type DB`
- `src/lib/db/schema.ts` → named table exports only (`users`, `topics`, `votes`, `topicStatusEnum`, `usersSync` re-export, type aliases)
- `src/lib/qstash.ts` → `export const qstash = new Client(...)`
- `src/lib/auth/server.ts` → `export const auth = createNeonAuth(...)`
- `src/lib/auth/client.ts` → `export const authClient = createAuthClient()` + `"use client"` directive

### Convention 5 — `bun` everywhere, scripts named `<verb>:<noun>`

**Source:** `package.json` lines 5-14 + `mise.toml`

```json
"check:lint": "biome lint --write ./",
"check:format": "biome format --write ./",
"check:imports": "biome check --formatter-enabled=false --linter-enabled=false --write ./",
"check:ts": "tsc --noEmit",
"check:all": "bun check:imports && bun check:format && bun check:lint && bun check:ts"
```

**Pattern:** lowercase, colon-separated, `<verb>:<noun>`. Scripts compose via `bun <other-script>` (not `npm run` / not `pnpm`).

**Apply to new scripts (planner adds these, in this exact naming style):**

```json
"db:generate": "drizzle-kit generate",
"db:migrate":  "drizzle-kit migrate",
"db:push":     "drizzle-kit push",
"db:studio":   "drizzle-kit studio",
"test":        "vitest run",
"test:db":     "vitest run tests/db",
"test:watch":  "vitest"
```

And modify `build`:

```json
"build": "bun db:migrate && next build"
```

The `&&` chaining mirrors the existing `check:all` style. Do NOT introduce `npm run` or `pnpm exec` in any script — Bun is the contract per `mise.toml`.

### Convention 6 — `next.config.ts` shape: wrap with `withNextIntl`

**Source:** `next.config.ts` (full file, 9 lines)

```typescript
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
```

**If `serverExternalPackages` is needed for `@neondatabase/serverless`** (researcher flagged this as conditional), the planner MUST preserve the `withNextIntl(nextConfig)` wrap and add the option inside the `nextConfig` object. Example modification (only if needed):

```typescript
const nextConfig: NextConfig = {
  serverExternalPackages: ["@neondatabase/serverless"],
};
```

Never bypass the next-intl plugin wrapper.

### Convention 7 — `.env.example` augment, never replace

**Source:** existing `.env.example` (22 lines, currently lists `DATABASE_URL`, `QSTASH_*`, `BETTER_AUTH_*`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_APP_URL`).

**Pattern:** Header comment lines start with `#`; one var per line; format `KEY=` (empty value placeholder); group with blank lines.

**Apply:** Use the exact augmented form in `01-RESEARCH.md §9` (lines 685-723). Add milestone-tagged section dividers (`# v0.2 — Database (Phase 1)`, etc.). Per RESEARCH.md A1, remove `BETTER_AUTH_*` (planner should confirm with user before deleting; the lock decision in CONTEXT.md D-16 says "BETTER_AUTH_* stay"; researcher concluded they're vestigial — **flag this conflict to planner: D-16 says keep, RESEARCH §7 says remove. Planner asks user during plan-check.**).

---

## Pattern Assignments

### `src/lib/env.ts` — config / validation

**Closest analog:** External — T3 Env Next.js docs (`env.t3.gg/docs/nextjs`). No internal analog exists.

**Internal convention to preserve:** Single-export-per-file (Convention 4); path alias not needed (no internal imports).

**Pattern to copy** (verified spec from RESEARCH.md §9 lines 615-680):

```typescript
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url().min(1),
    NEON_AUTH_BASE_URL: z.string().url().min(1),
    NEON_AUTH_COOKIE_SECRET: z.string().min(32),
    QSTASH_URL: z.string().url().default("https://qstash.upstash.io"),
    QSTASH_TOKEN: z.string().min(1).optional(),
    QSTASH_CURRENT_SIGNING_KEY: z.string().min(1).optional(),
    QSTASH_NEXT_SIGNING_KEY: z.string().min(1).optional(),
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEON_AUTH_BASE_URL: process.env.NEON_AUTH_BASE_URL,
    NEON_AUTH_COOKIE_SECRET: process.env.NEON_AUTH_COOKIE_SECRET,
    QSTASH_URL: process.env.QSTASH_URL,
    QSTASH_TOKEN: process.env.QSTASH_TOKEN,
    QSTASH_CURRENT_SIGNING_KEY: process.env.QSTASH_CURRENT_SIGNING_KEY,
    QSTASH_NEXT_SIGNING_KEY: process.env.QSTASH_NEXT_SIGNING_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
```

**Why each piece matters:**
- `server` vs `client` split — T3 Env strips server vars from client bundle (V5/V14 ASVS)
- `runtimeEnv` must be hand-spread — Next.js bundler requirement, NOT optional
- `skipValidation` — allows `bun check:lint` in CI without secrets
- `emptyStringAsUndefined: true` — treats `KEY=` as missing, makes `.env.example` zero-config

---

### `src/lib/db/index.ts` — DB client

**Closest analog:** External — Drizzle Neon HTTP docs (`orm.drizzle.team/docs/connect-neon`). No internal analog.

**Internal conventions to preserve:** Path alias (Convention 1), single-export (Convention 4).

**Pattern to copy** (RESEARCH.md §4 lines 346-360):

```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { env } from "@/lib/env";
import * as schema from "@/lib/db/schema";

const sql = neon(env.DATABASE_URL);

export const db = drizzle({ client: sql, schema });
export type DB = typeof db;

// Re-export for convenience — app code imports tables from "@/lib/db"
export * from "@/lib/db/schema";
```

**Why:**
- `neon()` — HTTP driver, edge-safe (CONTEXT D-02)
- `drizzle({ client, schema })` — typed query builder; passing `schema` enables `db.query.users.findFirst()` style API
- `export *` — single import surface; app code does `import { db, users, topics, votes } from "@/lib/db"`

---

### `src/lib/db/schema.ts` — schema definitions

**Closest analog:** External — `drizzle-orm/neon/neon-auth.js` (verified source, version-tracked) for `usersSync`; Drizzle docs for `pgTable`, `pgEnum`, `unique`.

**Internal convention to preserve:** Single-file domain grouping; named exports only.

**Pattern to copy** (RESEARCH.md §4 lines 213-342, full schema):

```typescript
import { sql } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { usersSync } from "drizzle-orm/neon";

export { usersSync };

// users — id is TEXT (matches usersSync.id), not uuid
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .references(() => usersSync.id, { onDelete: "cascade" }),
  trustScore: integer("trust_score").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const topicStatusValues = ["voting", "investigating", "done"] as const;
export const topicStatusEnum = pgEnum("topic_status", topicStatusValues);
export type TopicStatus = (typeof topicStatusValues)[number];

export const topics = pgTable("topics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  originalSubmission: text("original_submission").notNull(),
  neutralRewrite: text("neutral_rewrite"),
  status: topicStatusEnum("status").notNull().default("voting"),
  voteCount: integer("vote_count").notNull().default(0),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const votes = pgTable(
  "votes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    weekBucket: text("week_bucket").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("votes_user_topic_week_unique").on(t.userId, t.topicId, t.weekBucket),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Topic = typeof topics.$inferSelect;
export type NewTopic = typeof topics.$inferInsert;
export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
```

**Critical pattern callouts:**
1. **`users.id` is `text`, NOT `uuid`** — matches `usersSync.id` type (RESEARCH §1 finding 2, Pitfall 1). Wrong type → cross-schema FK fails at migrate time.
2. **`pgEnum` values are `as const`** — required for type inference of `TopicStatus`.
3. **Composite unique uses callback signature** — third arg of `pgTable` returns array `(t) => [unique("name").on(...)]`. This is the modern (drizzle-orm 0.36+) syntax; do NOT use legacy `uniqueIndex`.
4. **`.references()` uses arrow callback** — `() => users.id`, never `users.id` directly (avoids circular-import / hoisting issues).

---

### `drizzle.config.ts` — drizzle-kit config

**Closest analog:** External — `orm.drizzle.team/docs/drizzle-config-file`. No internal analog.

**Pattern to copy** (RESEARCH.md §5 lines 376-401):

```typescript
import { defineConfig } from "drizzle-kit";

import { env } from "@/lib/env";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  schemaFilter: ["public"],
  strict: false,
  verbose: true,
});
```

**Watchpoints (RESEARCH §14 Pitfall 5):**
- `schemaFilter: ["public"]` only affects `pull`/`push`, NOT `generate`/`migrate`. The cross-schema FK to `neon_auth.users_sync` is emitted from `schema.ts` and that's what we want.
- `strict: false` — non-interactive on Vercel build.
- `out: "./drizzle"` is the default but explicit for clarity.

---

### `drizzle/0000_enable_pgvector.sql` — custom migration

**Closest analog:** External — `orm.drizzle.team/docs/extensions/pg`.

**Generation:**

```bash
bun drizzle-kit generate --custom --name=enable_pgvector
```

This creates an empty file. Hand-edit to:

```sql
-- drizzle/0000_enable_pgvector.sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**Why isolated migration (RESEARCH §14 Pitfall 3):** Extension creation in a separate transaction from schema DDL prevents race conditions on fresh Postgres instances. The `IF NOT EXISTS` makes it safe to re-run.

---

### `drizzle/0001_initial_schema.sql` — generated migration

**Auto-generated** by `bun drizzle-kit generate --name=initial_schema` from `schema.ts`.

**Expected output** (RESEARCH §15 Example C, sanity-check before commit):

- `CREATE TYPE "public"."topic_status" AS ENUM('voting', 'investigating', 'done');`
- `CREATE TABLE "users"` with `id text PRIMARY KEY`, FK → `neon_auth.users_sync(id)`
- `CREATE TABLE "topics"` with `id uuid` + `gen_random_uuid()`, FK → `users(id)`
- `CREATE TABLE "votes"` with composite unique constraint
- `--> statement-breakpoint` separators between statements

**Verification step:** After `bun db:generate`, manually inspect the SQL for:
- `users.id` declared as `text` (NOT `uuid`) — guards against Pitfall 1
- FK to `"neon_auth"."users_sync"("id")` present
- Composite unique constraint named `votes_user_topic_week_unique` (or near-equivalent — exact text may vary)

---

### `src/lib/qstash.ts` — QStash client

**Closest analog:** External — Upstash QStash README + verified source `qstash-js@2.10.1/src/client/client.ts`.

**Internal conventions to preserve:** Single-export, path alias for `env` import.

**Pattern to copy** (RESEARCH.md §8 lines 565-589):

```typescript
import { Client } from "@upstash/qstash";

import { env } from "@/lib/env";

/**
 * QStash client — initialized at module load.
 *
 * Phase 1: present but never invoked.
 * Phase 6+: dispatches deep-dive workflow jobs.
 *
 * Construction is safe with missing/placeholder token (see qstash-js source).
 */
export const qstash = new Client({
  token: env.QSTASH_TOKEN,
  baseUrl: env.QSTASH_URL,
});

export type QStashClient = typeof qstash;
```

**Why:**
- Constructor does not make a network call → safe to import unconditionally.
- `env.QSTASH_TOKEN` is optional in env.ts → empty/undefined token does not throw.
- Phase 1 verifies via `tests/qstash.init.test.ts` that the import succeeds.

---

### `src/lib/auth/server.ts` — Neon Auth server stub

**Closest analog:** External — `neon.com/guides/neon-auth-nextjs`.

**Pattern to copy** (RESEARCH.md §7 lines 521-532):

```typescript
import { createNeonAuth } from "@neondatabase/auth/next/server";

import { env } from "@/lib/env";

export const auth = createNeonAuth({
  baseUrl: env.NEON_AUTH_BASE_URL,
  cookies: {
    secret: env.NEON_AUTH_COOKIE_SECRET,
  },
});
```

**Phase boundary:** Phase 1 only constructs; Phase 2 wires `app/api/auth/[...path]/route.ts` and middleware. No imports from this file in any route in Phase 1.

---

### `src/lib/auth/client.ts` — Neon Auth client stub

**Closest analog:** External — `neon.com/guides/neon-auth-nextjs`.

**Pattern to copy** (RESEARCH.md §7 lines 537-543):

```typescript
"use client";

import { createAuthClient } from "@neondatabase/auth/next";

export const authClient = createAuthClient();
```

**Note:** `"use client"` directive is REQUIRED — this is a browser module. Phase 1 does not use this client; Phase 2 components import it.

---

### `vitest.config.ts` — test framework config

**Closest analog:** External — Vitest default config docs. No internal analog (no test infrastructure exists).

**Pattern (minimum viable for Phase 1):**

```typescript
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/db/setup.ts"],
  },
});
```

**Why the alias block:** Vitest does NOT read `tsconfig.json` paths automatically — must be re-declared. The `@/*` → `./src/*` mapping mirrors `tsconfig.json` Convention 1.

**Open question (RESEARCH §21 Q2 / A4):** vitest vs `bun test`. CONTEXT.md does not pin. Recommend planner asks user during plan-check; default to vitest per RESEARCH.

---

### `tests/db/setup.ts` — shared test fixtures

**Closest analog:** External — Drizzle/Postgres test patterns. No internal analog.

**Pattern (sketch — the planner expands):**

```typescript
import { afterEach, beforeAll } from "vitest";
import { sql } from "drizzle-orm";

import { db } from "@/lib/db";

beforeAll(async () => {
  // Optional: seed neon_auth.users_sync with a fixture row to satisfy FK
  // when running against a Neon dev branch where the auth schema exists.
  // For local Docker fallback, tests that exercise users.id FK should be skipped.
});

afterEach(async () => {
  // Truncate in dependency order — votes → topics → users
  await db.execute(sql`TRUNCATE TABLE votes, topics, users CASCADE`);
});
```

**Note:** The planner must decide whether to skip FK-dependent tests in local Docker mode (no `neon_auth` schema) or require Neon dev branch for tests. RESEARCH §10 leans toward Neon dev branch.

---

### `tests/db/users.schema.test.ts` / `topics.schema.test.ts` — unit tests

**Closest analog:** External — Vitest + Drizzle introspection. No internal analog.

**Pattern (planner expands per INFRA-01/02):**

```typescript
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db } from "@/lib/db";

describe("users schema", () => {
  it("has trust_score column with default 0", async () => {
    const rows = await db.execute(sql`
      SELECT column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'trust_score'
    `);
    expect(rows.rows[0]?.column_default).toBe("0");
  });
});
```

---

### `tests/db/votes.unique.test.ts` — integration test

**Pattern** (RESEARCH §11 lines 914-933, copy verbatim):

```typescript
import { describe, expect, it } from "vitest";
import { db, votes } from "@/lib/db";

describe("votes composite unique", () => {
  it("rejects duplicate (user_id, topic_id, week_bucket)", async () => {
    const userId = "test-user-id";
    const topicId = "00000000-0000-0000-0000-000000000001";
    const weekBucket = "2026-W17";

    await db.insert(votes).values({ userId, topicId, weekBucket });

    await expect(
      db.insert(votes).values({ userId, topicId, weekBucket }),
    ).rejects.toThrow(/duplicate key|unique constraint|votes_user_topic_week_unique/i);
  });
});
```

**Note:** Requires FK satisfaction — the test setup must seed a `users` row first; if running against Neon dev branch, also a corresponding `neon_auth.users_sync` row.

---

### `tests/qstash.init.test.ts` — module-load test

**Pattern** (RESEARCH §11 lines 898-910, copy verbatim):

```typescript
import { describe, expect, it } from "vitest";

describe("QStash client init", () => {
  it("imports without throwing on missing token", async () => {
    const original = process.env.QSTASH_TOKEN;
    process.env.QSTASH_TOKEN = "";
    process.env.SKIP_ENV_VALIDATION = "1";
    await expect(import("@/lib/qstash")).resolves.toBeDefined();
    process.env.QSTASH_TOKEN = original;
  });
});
```

---

### `tests/env.example.test.ts` — coverage test

**Pattern** (RESEARCH §11 lines 873-893, copy verbatim):

```typescript
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe(".env.example", () => {
  it("declares every server var validated by env.ts", () => {
    const example = readFileSync(".env.example", "utf-8");
    const required = [
      "DATABASE_URL",
      "NEON_AUTH_BASE_URL",
      "NEON_AUTH_COOKIE_SECRET",
      "QSTASH_URL",
      "QSTASH_TOKEN",
      "ANTHROPIC_API_KEY",
      "NEXT_PUBLIC_APP_URL",
    ];
    for (const key of required) {
      expect(example).toMatch(new RegExp(`^${key}=`, "m"));
    }
  });
});
```

---

### `tests/env.test.ts` — runtime validation test

**Pattern (planner sketches):**

```typescript
import { describe, expect, it } from "vitest";

describe("env validation", () => {
  it("throws when DATABASE_URL is missing", async () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    delete process.env.SKIP_ENV_VALIDATION;
    await expect(import("@/lib/env")).rejects.toThrow();
    process.env.DATABASE_URL = original;
  });
});
```

---

### `scripts/probe-pgvector.ts` — smoke probe

**Pattern** (RESEARCH §11 lines 841-853, copy verbatim):

```typescript
import { sql } from "drizzle-orm";

import { db } from "@/lib/db";

const result = await db.execute(
  sql`SELECT extname FROM pg_extension WHERE extname = 'vector'`,
);
if (result.rows.length === 0) {
  console.error("FAIL: pgvector extension not enabled");
  process.exit(1);
}
console.log("PASS: pgvector extension enabled");
```

**Run via:** `bun run scripts/probe-pgvector.ts` (top-level await OK in Bun + ESM).

---

### `scripts/probe-migration-idempotent.sh` — idempotency probe

**Pattern** (RESEARCH §11 lines 858-868, copy verbatim):

```bash
#!/usr/bin/env bash
set -euo pipefail
bun db:migrate
OUTPUT=$(bun db:migrate 2>&1)
if echo "$OUTPUT" | grep -qE "already applied|0 migrations to apply|nothing to migrate"; then
  echo "PASS: migration is idempotent"
  exit 0
fi
echo "FAIL: second migration run produced unexpected output:"
echo "$OUTPUT"
exit 1
```

**chmod:** Make executable: `chmod +x scripts/probe-migration-idempotent.sh`.

---

### `package.json` — modify

**Internal analog:** existing `package.json` (preserve all current `check:*` scripts, the script naming convention, dep style).

**Diff to apply:**

```jsonc
// scripts — preserve existing, augment in this order:
"scripts": {
  "dev": "next dev",
  "build": "bun db:migrate && next build",         // ← changed: prepend migrate
  "start": "next start",
  "db:generate": "drizzle-kit generate",            // ← added
  "db:migrate":  "drizzle-kit migrate",             // ← added
  "db:push":     "drizzle-kit push",                // ← added
  "db:studio":   "drizzle-kit studio",              // ← added
  "test":        "vitest run",                      // ← added
  "test:db":     "vitest run tests/db",             // ← added
  "test:watch":  "vitest",                          // ← added
  "check:lint":    "biome lint --write ./",
  "check:format":  "biome format --write ./",
  "check:imports": "biome check --formatter-enabled=false --linter-enabled=false --write ./",
  "check:ts":      "tsc --noEmit",
  "check:all":     "bun check:imports && bun check:format && bun check:lint && bun check:ts"
}
```

**Add to `dependencies`** (per RESEARCH §2 pinned versions):
- `@neondatabase/serverless`: `^1.1.0`
- `@neondatabase/auth`: `^0.2.0-beta.1`
- `drizzle-orm`: `^0.45.2`
- `@upstash/qstash`: `^2.10.1`
- `zod`: `^4.3.6`
- `@t3-oss/env-nextjs`: `^0.13.11`
- `date-fns`: `^4.1.0`

**Add to `devDependencies`:**
- `drizzle-kit`: `^0.31.10`
- `vitest`: `^2.x` (planner verifies latest)
- `@vitest/coverage-v8`: `^2.x`

---

### `.env.example` — modify (augment)

**Internal analog:** existing `.env.example` (22 lines).

**Pattern to apply** (full augmented version, RESEARCH §9 lines 685-723):

```bash
# kebab.news — environment variables
# Copy to .env.local and fill in values. Never commit .env.local.

# =============================================================================
# v0.2 — Database (Phase 1)
# =============================================================================
DATABASE_URL=

# =============================================================================
# v0.2 — Neon Auth (Phase 2)
# =============================================================================
# Format: https://ep-xxx.neonauth.<region>.aws.neon.build/<dbname>/auth
NEON_AUTH_BASE_URL=

# Cookie HMAC secret — at least 32 characters
# Generate: openssl rand -base64 32
NEON_AUTH_COOKIE_SECRET=

# =============================================================================
# v0.2 — Upstash QStash (env scaffold; client invoked starting v0.4)
# =============================================================================
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=

# =============================================================================
# v0.3 — Anthropic (Claude API for Objectivity Filter)
# =============================================================================
ANTHROPIC_API_KEY=

# =============================================================================
# App
# =============================================================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Conflict to flag (CONTEXT D-16 vs RESEARCH §7):**
- CONTEXT.md D-16: keep `BETTER_AUTH_*` vars (defensive).
- RESEARCH.md §7 + §14 Pitfall 4: remove them (they're not used by `@neondatabase/auth`).
- **Planner action:** Ask user during plan-check. If unresolved, default to KEEP per CONTEXT.md (D-16 is the locked decision; RESEARCH is advisory).

---

### `.gitignore` — modify (minor)

**Internal analog:** existing `.gitignore` (33 lines, already covers `.env*`, `node_modules`, `.next`, `.vercel`, `*.tsbuildinfo`).

**Possible additions (planner decides):**
- `drizzle/meta/` — NO, do NOT ignore. Snapshots and journal are versioned per Drizzle convention.
- Nothing else needed for Phase 1.

**Likely no change required** — current `.gitignore` already covers all secret/build artifacts.

---

### `next.config.ts` — modify (conditional)

**Internal analog:** existing `next.config.ts` (9 lines, wraps with `withNextIntl`).

**Conditional change (only if `@neondatabase/serverless` requires it — researcher flagged "Next.js 16 may handle this automatically"):**

```typescript
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  serverExternalPackages: ["@neondatabase/serverless"],  // ← only if needed
};

export default withNextIntl(nextConfig);
```

**Verification step for the planner:** Add a Wave 0 task: "run `bun build` after installing `@neondatabase/serverless`; if bundling errors mention WebSocket / `bufferutil` / `utf-8-validate`, add `serverExternalPackages`. Otherwise leave file untouched."

---

## Shared Patterns (cross-cutting)

### Shared Pattern 1 — Env access

**Source:** `src/lib/env.ts` (Phase 1 creates this).
**Apply to:** Every file that reads any env var. NEVER use `process.env.X` directly outside `src/lib/env.ts` `runtimeEnv` mapping.

```typescript
import { env } from "@/lib/env";
// ✓ const url = env.DATABASE_URL;
// ✗ const url = process.env.DATABASE_URL;
```

**Exception:** Test files setting up env state (e.g., `tests/qstash.init.test.ts`) may write to `process.env` directly to simulate missing values.

### Shared Pattern 2 — DB import surface

**Source:** `src/lib/db/index.ts` (re-exports schema).
**Apply to:** All app code, scripts, and tests touching the database.

```typescript
// ✓ import { db, users, topics, votes, usersSync } from "@/lib/db";
// ✗ import { db } from "@/lib/db";
//   import { users } from "@/lib/db/schema";   // ← needless dual-source
```

The single import surface keeps query call sites short and centralizes any future swap (e.g., to `postgres` driver).

### Shared Pattern 3 — Type-only imports

**Convention from existing code (Biome's `organizeImports` honors this):**

```typescript
import type { NextConfig } from "next";        // type-only at top
import createNextIntlPlugin from "next-intl/plugin";  // value
```

**Apply to:** Every type-only import from packages or `@/lib/db` schema (`User`, `Topic`, `NewVote`, etc.):

```typescript
import type { Topic, User } from "@/lib/db";
```

Biome enforces this on `bun check:imports`.

### Shared Pattern 4 — `defineNow()` / `withTimezone: true` for all timestamps

**Source:** RESEARCH §4 schema (every `timestamp` column).
**Apply to:** Any future migration that adds a timestamp column. Always:

```typescript
timestamp("col_name", { withTimezone: true }).notNull().defaultNow()
```

UTC-anchored. No naive timestamps. Prevents Phase 5 timezone bugs.

### Shared Pattern 5 — Migration ordering

**Source:** RESEARCH §6.
**Apply:** Custom (DDL/extension-only) migrations get the LOWEST tag (e.g., `0000_*`). Schema migrations come AFTER (`0001_*`+). Never put `CREATE EXTENSION` in a generated schema migration.

### Shared Pattern 6 — Lazy module init for external services

**Source:** `src/lib/qstash.ts` and `src/lib/auth/server.ts`.
**Apply to:** Any future service-client module (Resend, Anthropic, etc.). Constructor must NOT make a network call at import time. Errors only surface when methods are invoked.

---

## No Internal Analog Available

The following files have **no internal analog whatsoever** — kebab.news has never had this kind of code. The planner relies solely on the external authoritative source listed.

| File | Authoritative source | Section in RESEARCH.md |
|------|---------------------|------------------------|
| `src/lib/env.ts` | `env.t3.gg/docs/nextjs` | §9 |
| `src/lib/db/index.ts` | `orm.drizzle.team/docs/connect-neon` | §4 |
| `src/lib/db/schema.ts` | `drizzle-orm/neon/neon-auth.js` source + `orm.drizzle.team/docs/column-types/pg` | §4 |
| `src/lib/auth/server.ts` | `neon.com/guides/neon-auth-nextjs` | §7 |
| `src/lib/auth/client.ts` | `neon.com/guides/neon-auth-nextjs` | §7 |
| `src/lib/qstash.ts` | `qstash-js@2.10.1/src/client/client.ts` source | §8 |
| `drizzle.config.ts` | `orm.drizzle.team/docs/drizzle-config-file` | §5 |
| `drizzle/0000_enable_pgvector.sql` | `orm.drizzle.team/docs/extensions/pg` + `kit-custom-migrations` | §6 |
| `vitest.config.ts` | Vitest docs default | §11 (A4) |
| All `tests/**/*.ts` | Vitest + Drizzle introspection | §11 |
| `scripts/probe-*.{ts,sh}` | RESEARCH.md spec | §11 |

This is **expected and appropriate** for a greenfield phase. The planner must NOT search for "an existing service pattern in `src/lib/`" — there is only `constants.ts`, which is a single-line export and offers no architectural guidance for any of the above.

---

## Watchpoints for the Planner

1. **CONTEXT D-16 vs RESEARCH §7 conflict on `BETTER_AUTH_*`** — locked decision says keep, research says remove. Planner asks user during plan-check; defaults to keep if unresolved.
2. **`vitest` vs `bun test`** (RESEARCH A4, Q2) — CONTEXT.md doesn't pin; default to vitest, planner asks user.
3. **Docker `pg17` vs `pg16`** (RESEARCH Q3) — default `pg17`, document `pg16` alternate.
4. **`docker-compose.yml` Phase 1 inclusion** (RESEARCH Q4) — recommend include (~10 lines, large value); planner confirms.
5. **`next.config.ts` `serverExternalPackages` need** — verify empirically post-install; touch file only if `bun build` complains.
6. **drizzle-kit emitted SQL exact text** (RESEARCH §15 A3) — planner adds a Wave 0 task to capture actual generated SQL and confirm `users.id` is `text` (not `uuid`) before committing migration files.
7. **Neon dev branch vs Docker for tests** — FK to `neon_auth.users_sync` only exists on Neon. If contributor uses local Docker, FK-dependent tests must skip or seed a stub `neon_auth` schema. Planner picks a strategy.

---

## Metadata

**Analog search scope:**
- Internal: full `src/` tree, all root config files, all `.planning/phases/01-database-foundation/*`
- External: every URL in RESEARCH.md §17 (referenced inline above where applicable)

**Files scanned (internal):** 17 (all `src/` source + all root configs + CONTRIBUTING + LIESMICH + GSD)

**Pattern extraction date:** 2026-04-27
