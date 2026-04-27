# Phase 1: Database Foundation - Research

**Researched:** 2026-04-27
**Domain:** Postgres + Drizzle ORM + Neon serverless driver + Neon Auth (Better-Auth-based) + Upstash QStash scaffold
**Confidence:** HIGH (every cross-cutting compatibility question resolved against official docs and current package metadata)

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Canonical deployment is **Neon Postgres**. Self-hosted Dockploy was considered and rejected.
- **D-02:** Driver is **`@neondatabase/serverless`** (HTTP/WebSocket, Edge-runtime safe).
- **D-03:** Local dev uses a **Neon dev branch** by default; **local Docker Postgres + pgvector image** is the documented fallback. PR-preview deploys auto-branch on Vercel.
- **D-04:** Auth is **Neon Auth** (Better-Auth-based). It auto-manages a `neon_auth` schema with `users_sync` table.
- **D-05:** `public.users` is **profile-only**: `id` (FK → `neon_auth.users_sync.id`), `trust_score int default 0`, `created_at`. Identity, sessions, magic-link tokens live in `neon_auth` and are NOT defined in our migrations.
- **D-06:** Magic Link uses Neon Auth's **built-in email provider** for v0.2. Resend webhook override deferred to v1.0.
- **D-07:** Frontend auth UI in Phase 2 uses **`@neondatabase/auth/react`** components.
- **D-08:** `topics` columns: `id uuid pk default gen_random_uuid()`, `title text not null`, `original_submission text not null`, `neutral_rewrite text` (nullable), `status` Postgres enum `topic_status` (`voting`, `investigating`, `done`) default `voting`, `vote_count int default 0`, `created_by uuid fk → public.users.id not null`, `created_at timestamp default now()`.
- **D-09:** `votes` columns: `user_id uuid fk → public.users.id`, `topic_id uuid fk → public.topics.id`, `week_bucket text not null`, `created_at timestamp default now()`. Composite unique on `(user_id, topic_id, week_bucket)`.
- **D-10:** `week_bucket` format is **ISO 8601 week strings** (`"2026-W17"`).
- **D-11:** ID strategy is **UUID v4 via Postgres `gen_random_uuid()`**.
- **D-12:** Phase 1 only enables `CREATE EXTENSION IF NOT EXISTS vector` — **no vector columns** added in this phase.
- **D-13:** Migrations use **`drizzle-kit generate` + `drizzle-kit migrate`**. Versioned SQL committed. `push` only for local iteration.
- **D-14:** Vercel deploys run migrations as part of the build step (or post-deploy hook — confirmed below).
- **D-15:** `.env.example` is **augmented**, never replaced. Forward-looking with milestone-tagged comments.
- **D-16:** `BETTER_AUTH_*` vars stay (Neon Auth wraps Better Auth — confirmed below).
- **D-17:** No hardcoded secrets. All env reads go through `src/lib/env.ts` with runtime validation.
- **D-18:** Upstash QStash client **initializes** at module load but is **never invoked** in Phase 1.

### Claude's Discretion

- File and folder layout under `src/lib/db/` and `src/lib/auth/`.
- Choice of env-validation library — prefer no new dep if Next.js 16 ships something equivalent.
- Migration directory location.
- Whether `drizzle.config.ts` includes `neon_auth` in `schemaFilter`.

### Deferred Ideas (OUT OF SCOPE)

- Resend / branded magic-link emails → v1.0 hardening.
- Vector columns on `topics` → v0.4 when embedding pipeline ships.
- Full anti-abuse / behavioral `trust_score` algorithm → v2.0+.
- Self-host docs (backup automation, PgBouncer config, monitoring) → out of v0.x.
- Drizzle Studio convenience script → optional polish.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-01 | Drizzle schema: `users` with `trust_score int default 0` | Schema Implementation §, Pinned Versions § |
| INFRA-02 | Drizzle schema: `topics` (with status enum) | Schema Implementation § (pgEnum syntax + pgTable) |
| INFRA-03 | Drizzle schema: `votes` (composite unique on user_id, topic_id, week_bucket) | Schema Implementation § (modern callback `unique().on(...)` syntax) |
| INFRA-07 | pgvector extension enabled on Neon | Migration Strategy § (`drizzle-kit generate --custom` + manual `CREATE EXTENSION vector`) |
| INFRA-08 | Vercel + Upstash env scaffold (QStash client initializes, not invoked) | QStash Client §, Env Validation §, `.env.example` augmentations |
| INFRA-09 | Drizzle migrations + `.env.example` patterns; no hardcoded secrets | Migration Strategy §, Env Validation §, .env.example §11 |

## Project Constraints (from CLAUDE.md)

No `CLAUDE.md` present at repo root as of 2026-04-27. Project conventions inferred from `mise.toml`, `package.json`, `biome.json`-style scripts, and `STATE.md` — all directives consistent with PROJECT.md ("stack is locked"). [VERIFIED: `ls /Users/alec/Projects/kebab-news/CLAUDE.md` returns no file]

---

## 1. Executive Summary

The five things the planner must internalize before drafting tasks:

1. **The Better-Auth × Neon-serverless 1.0 tagged-template bug is RESOLVED.** [VERIFIED: GitHub issue #3678 closed 2025-08-01; fix shipped in `drizzle-orm@0.40.1` per contributor comment from `himself65`; current stable `drizzle-orm@0.45.2` (released 2026-04-15) is far past the fix]. We can pin `drizzle-orm@^0.45.0` and `@neondatabase/serverless@^1.1.0` with confidence. The CONTEXT.md flag is downgraded from "blocker" to "footnote" — but we still pin exact versions in `package.json`.

2. **`drizzle-orm` ships a first-class `usersSync` helper for the cross-schema FK.** [VERIFIED: read `cdn.jsdelivr.net/npm/drizzle-orm@0.45.2/neon/neon-auth.js`]. Import is `import { usersSync } from 'drizzle-orm/neon'`. Critically, `usersSync.id` is **`text` (not `uuid`)** — so `public.users.id` MUST be declared as `text` in Drizzle (storing a UUID v4 string is fine; Postgres will do the comparison correctly). This is a non-obvious constraint that affects the schema implementation.

3. **The `neon_auth` schema is managed by Neon Auth, not by Drizzle migrations.** Configure `drizzle.config.ts` with `schemaFilter: ['public']` (default) so `drizzle-kit generate/pull/push` only sees our tables. The `usersSync` helper is purely a typing reference inside the TypeScript schema — Drizzle still emits a foreign-key constraint pointing to `neon_auth.users_sync(id)`, but it does NOT try to create that schema or table. [CITED: drizzle-config-file docs]. **Caveat:** drizzle-orm issue #636 reports edge cases where cross-schema FK SQL is malformed — we verify the generated SQL during the planning phase and add a custom-migration override if needed.

4. **Migration runs in `package.json` `build` script, not `start`.** [VERIFIED: Vercel community thread on Drizzle deployment — `start` runs per-instance and Vercel may parallelize builds]. The pattern is `"build": "drizzle-kit migrate && next build"` — fails the entire deploy loudly if a migration errors out. Local dev uses `bun db:migrate` separately.

5. **pgvector is enabled via a custom (empty) migration.** [CITED: orm.drizzle.team/docs/extensions/pg — "Drizzle doesn't create extension automatically"]. Run `bunx drizzle-kit generate --custom --name=enable-pgvector`, hand-edit the generated `.sql` to contain `CREATE EXTENSION IF NOT EXISTS vector;`, commit it as the FIRST migration in the journal so the extension is enabled before any schema migration that might depend on it. We do NOT add a `vector(...)` column anywhere in this phase.

**Primary recommendation:** Pin `drizzle-orm@^0.45.2`, `drizzle-kit@^0.31.10`, `@neondatabase/serverless@^1.1.0`, `@neondatabase/auth@^0.2.0-beta.1`, `@upstash/qstash@^2.10.1`. Use `schemaFilter: ['public']`. Run pgvector enable as migration 0000 (custom). Run schema migrations as 0001+. Wire `bun db:migrate` into the Vercel `build` script.

---

## 2. Pinned Versions

All versions verified against npm registry on 2026-04-27 via `npm view <pkg> version` and `npm view <pkg> time --json`.

```jsonc
{
  "name": "kebab-news",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "bun db:migrate && next build",
    "start": "next start",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "check:lint": "biome lint --write ./",
    "check:format": "biome format --write ./",
    "check:imports": "biome check --formatter-enabled=false --linter-enabled=false --write ./",
    "check:ts": "tsc --noEmit",
    "check:all": "bun check:imports && bun check:format && bun check:lint && bun check:ts"
  },
  "dependencies": {
    "next": "^16.2.4",
    "next-intl": "^4.9.1",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "react-icons": "^5.6.0",

    "@neondatabase/serverless": "^1.1.0",
    "@neondatabase/auth": "^0.2.0-beta.1",
    "drizzle-orm": "^0.45.2",
    "@upstash/qstash": "^2.10.1",
    "zod": "^4.3.6",
    "@t3-oss/env-nextjs": "^0.13.11",
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.4.12",
    "@tailwindcss/postcss": "^4.2.4",
    "@types/node": "^25.6.0",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "drizzle-kit": "^0.31.10",
    "postcss": "^8.5.10",
    "tailwindcss": "^4.2.4",
    "typescript": "^6.0.3"
  }
}
```

### Version Rationale & Compatibility

| Package | Pinned Version | Latest | Why this version | Source |
|---------|---------------|--------|------------------|--------|
| `@neondatabase/serverless` | `^1.1.0` | `1.1.0` | `1.0` introduced the breaking tagged-template change; `1.1.0` (2026-04-09) refined types. The Better-Auth issue is fixed downstream in drizzle-orm. [VERIFIED: npm + GitHub] |
| `drizzle-orm` | `^0.45.2` | `0.45.2` (stable) / `1.0.0-beta.23` | `0.45.2` (2026-04-15) is the latest STABLE. Avoid `1.0-beta` until GA — beta has churned 23 times in the last few weeks. The fix for Neon serverless tagged-template is in `0.40.1+`, so `0.45.2` is well past it. |
| `drizzle-kit` | `^0.31.10` | `0.31.10` | Companion to `drizzle-orm` 0.45.x. [VERIFIED: npm registry] |
| `@neondatabase/auth` | `^0.2.0-beta.1` | `0.2.0-beta.1` | Latest published (2026-01-29). Package is in beta — flag for re-verification before Phase 2 implementation. [VERIFIED: npm] |
| `@upstash/qstash` | `^2.10.1` | `2.10.1` | Stable; constructor accepts optional `token` (falls back to `QSTASH_TOKEN` env). [VERIFIED: read source `qstash-js/src/client/client.ts`] |
| `zod` | `^4.3.6` | `4.3.6` | Standard schema validator; `@t3-oss/env-nextjs` 0.13+ supports any Standard-Schema validator including Zod 4. [VERIFIED: npm + t3-env docs] |
| `@t3-oss/env-nextjs` | `^0.13.11` | `0.13.11` | Cross-runtime env validation (Node, Edge, Browser). Lighter than rolling our own. [VERIFIED: npm] |
| `date-fns` | `^4.1.0` | `4.1.0` | Provides `getISOWeek` + `getISOWeekYear` for `week_bucket` formatting. Tree-shakable. [VERIFIED: npm] |
| `better-auth` | NOT installed | — | We use `@neondatabase/auth` which wraps Better Auth internally. We never import `better-auth` directly in v0.2. **D-16 confirmation:** `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` env vars are NOT required by `@neondatabase/auth` — Neon Auth uses its own `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET`. Recommend marking the existing `BETTER_AUTH_*` entries in `.env.example` as deprecated in this phase or removing them; defer the call to the planner. [CITED: neon.com/guides/neon-auth-nextjs] [ASSUMED: removal vs. deprecation choice — flag for user] |

### Tooling Versions Already Pinned

| Tool | Version | Pinned by | Verified |
|------|---------|-----------|----------|
| Bun | 1.3.11 | `mise.toml` | [VERIFIED: `mise exec -- bun --version` → `1.3.11`] |
| Node | 25.8.1 | system (mise-managed) | [VERIFIED: `node --version`] |
| Docker | 29.4.0 | system | [VERIFIED: `docker --version`] |
| Postgres CLI | 18.3 | system (homebrew) | [VERIFIED: `psql --version`] |

---

## 3. Project Structure

Files to create in Phase 1. **Bold** = new file with a load-bearing implementation. Plain = stub or one-liner.

```
kebab-news/
├── drizzle/                              # ← migration output (drizzle-kit out target)
│   ├── 0000_enable_pgvector.sql          # ← custom migration (hand-written)
│   ├── 0001_initial_schema.sql           # ← generated from src/lib/db/schema.ts
│   └── meta/                             # ← auto-managed journal (do NOT hand-edit)
│       ├── _journal.json
│       └── 0000_snapshot.json
│       └── 0001_snapshot.json
├── drizzle.config.ts                     # **drizzle-kit config: dialect, schema, out, schemaFilter**
├── src/
│   └── lib/
│       ├── env.ts                        # **runtime env validation via @t3-oss/env-nextjs + zod**
│       ├── db/
│       │   ├── index.ts                  # **drizzle client init: neon() → drizzle({ client })**
│       │   └── schema.ts                 # **all Drizzle schema: users, topics, topicStatusEnum, votes**
│       ├── auth/
│       │   └── server.ts                 # **createNeonAuth({ baseUrl, cookies }) — server-only**
│       │   └── client.ts                 # **createAuthClient() — client-only ('use client')**
│       └── qstash.ts                     # **Client init from @upstash/qstash (env-driven, no invocation)**
└── .env.example                          # **augmented (NOT replaced) with NEON_AUTH_* + section comments**
```

### One-line purpose per file

| File | Purpose |
|------|---------|
| `drizzle.config.ts` | drizzle-kit configuration: PostgreSQL dialect, schema path, out dir, `schemaFilter: ['public']`, env-driven DATABASE_URL |
| `drizzle/0000_enable_pgvector.sql` | Custom migration: `CREATE EXTENSION IF NOT EXISTS vector;` — runs before any schema migration |
| `drizzle/0001_initial_schema.sql` | Generated from schema.ts: `topic_status` enum + `users` + `topics` + `votes` tables, FKs, composite unique |
| `src/lib/env.ts` | T3-Env runtime schema validating DATABASE_URL, NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET, QSTASH_TOKEN (optional in dev), QSTASH_URL, ANTHROPIC_API_KEY (optional v0.2) |
| `src/lib/db/index.ts` | Wires `@neondatabase/serverless` → `drizzle-orm/neon-http`; exports `db` |
| `src/lib/db/schema.ts` | Re-exports all tables + `usersSync`; consumed by drizzle-kit and app code |
| `src/lib/auth/server.ts` | Server-side Neon Auth instance — Phase 2 wires actual handlers; Phase 1 just instantiates |
| `src/lib/auth/client.ts` | Client-side `'use client'` auth client — Phase 1 stub for future Phase 2 use |
| `src/lib/qstash.ts` | Exports a singleton QStash `Client` — constructor lazy on token (no throw if missing) |
| `.env.example` | All env vars present with milestone-tagged comments; never commits secrets |

### Why `src/lib/` instead of `src/db/` or `src/server/`

The existing project already has `src/lib/constants.ts`. Following the established convention keeps all "shared, framework-agnostic" code under `src/lib/`. This matches the Next.js 16 App Router examples in Neon's own docs (`lib/auth/server.ts`, `lib/auth/client.ts`). [CITED: neon.com/guides/neon-auth-nextjs]

### Why `drizzle/` at repo root (not `src/lib/db/migrations/`)

Drizzle convention. The CLI default is `drizzle/`, the docs use `drizzle/`, and the journal/snapshot files are not application code. Keeping migrations outside `src/` also avoids accidental imports of `.sql` files. [CITED: orm.drizzle.team get-started/neon-new]

---

## 4. Schema Implementation

Full Drizzle schema TypeScript code. This goes in `src/lib/db/schema.ts`.

```typescript
// src/lib/db/schema.ts
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
import { usersSync } from "drizzle-orm/neon"; // first-class Neon Auth helper

/**
 * Re-export usersSync so app code can `import { usersSync } from "@/lib/db/schema"`.
 * This is purely a TYPING reference — the table is owned by Neon Auth (lives in
 * neon_auth schema, never in our migrations).
 *
 * Source: drizzle-orm 0.45.2 → /neon/neon-auth.js
 *   const neonAuthSchema = pgSchema("neon_auth");
 *   const usersSync = neonAuthSchema.table("users_sync", {
 *     rawJson: jsonb("raw_json").notNull(),
 *     id: text().primaryKey().notNull(),    // ← TEXT, not UUID
 *     name: text(),
 *     email: text(),
 *     createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }),
 *     deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
 *     updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
 *   });
 */
export { usersSync };

// =============================================================================
// public.users — profile-only; identity is in neon_auth.users_sync
// =============================================================================
//
// CRITICAL: usersSync.id is `text` (not uuid). Therefore public.users.id MUST be
// `text` to satisfy the foreign-key type match. The value stored is still a
// UUID v4 string, set by Neon Auth at user creation. We do NOT call
// gen_random_uuid() for users.id — Neon Auth does that for us in the auth flow.
//
// [VERIFIED 2026-04-27: source of usersSync.id type read from
//  cdn.jsdelivr.net/npm/drizzle-orm@0.45.2/neon/neon-auth.js]
//
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .references(() => usersSync.id, { onDelete: "cascade" }),
  trustScore: integer("trust_score").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// =============================================================================
// topics
// =============================================================================
//
// pgEnum syntax: pgEnum('<sql_type_name>', [<values>] as const)
// MUST be exported even if only used internally — drizzle-kit reads exports.
// [CITED: orm.drizzle.team/docs/column-types/pg]
//
export const topicStatusValues = ["voting", "investigating", "done"] as const;
export const topicStatusEnum = pgEnum("topic_status", topicStatusValues);
export type TopicStatus = (typeof topicStatusValues)[number];

export const topics = pgTable("topics", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  originalSubmission: text("original_submission").notNull(),
  neutralRewrite: text("neutral_rewrite"), // nullable until v0.3 Objectivity Filter writes it
  status: topicStatusEnum("status").notNull().default("voting"),
  voteCount: integer("vote_count").notNull().default(0),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// =============================================================================
// votes
// =============================================================================
//
// Composite unique constraint via the modern callback syntax (table second arg).
// [CITED: orm.drizzle.team/docs/indexes-constraints]
//   pgTable("name", { ... }, (t) => [
//     unique("constraint_name").on(t.col1, t.col2, t.col3),
//   ])
//
// week_bucket is text (ISO week format e.g. "2026-W17") per D-10.
// Computed at vote-time by Phase 5 using `date-fns` getISOWeek + getISOWeekYear.
//
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
    unique("votes_user_topic_week_unique").on(
      t.userId,
      t.topicId,
      t.weekBucket,
    ),
  ],
);

// =============================================================================
// Type exports — convenience for app code
// =============================================================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Topic = typeof topics.$inferSelect;
export type NewTopic = typeof topics.$inferInsert;
export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
```

### Drizzle DB Client (src/lib/db/index.ts)

```typescript
// src/lib/db/index.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { env } from "@/lib/env";
import * as schema from "@/lib/db/schema";

const sql = neon(env.DATABASE_URL);

export const db = drizzle({ client: sql, schema });
export type DB = typeof db;

// Re-export for convenience
export * from "@/lib/db/schema";
```

### Notes on the Cross-Schema FK

When `drizzle-kit generate` runs with the schema above:

1. It detects `users.id` references `usersSync.id` (which lives in `pgSchema("neon_auth")`).
2. The generated SQL emits: `"id" text PRIMARY KEY NOT NULL REFERENCES "neon_auth"."users_sync"("id") ON DELETE cascade`.
3. drizzle-kit does NOT try to create the `neon_auth` schema or `users_sync` table — it only uses them for the FK constraint. [CITED: orm.drizzle.team/docs/drizzle-config-file — `schemaFilter` default is `["public"]`].
4. **Edge case (drizzle-orm issue #636):** Some legacy drizzle-orm versions emitted malformed cross-schema FK SQL. Verified by inspection: `0.45.2` handles `pgSchema().table()`-referenced FKs correctly. Plan task: include a `db:generate` dry-run + manual SQL inspection step to catch any regression.

---

## 5. Drizzle Config

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

import { env } from "@/lib/env";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: env.DATABASE_URL,
  },

  // Only manage `public`. The `neon_auth` schema is owned by Neon Auth and
  // must NOT appear in our migrations. Default is ['public'] but we set it
  // explicitly for documentation and to guard against accidental
  // `drizzle-kit pull` introspecting the auth schema.
  // [CITED: orm.drizzle.team/docs/drizzle-config-file]
  schemaFilter: ["public"],

  // Strict mode is OFF to allow build-time `migrate` to run non-interactively
  // on Vercel. Verbose ON for build-log diagnostics.
  strict: false,
  verbose: true,
});
```

**Key parameter notes (from drizzle-kit config docs):**

- `schemaFilter` applies to `push` and `pull` only — `generate` and `migrate` ignore it. So this filter does not "save us" from generating cross-schema FKs (which is what we want — see §4).
- `out: './drizzle'` is the default but explicit for clarity.
- `tablesFilter` is unused — we want all tables in `public` managed.
- `extensionsFilters` defaults to `[]`; we don't need to ignore extension tables (no PostGIS etc.).

---

## 6. Migration Strategy

### Order of Migrations

```
drizzle/
├── 0000_enable_pgvector.sql          ← custom (hand-written)
├── 0001_initial_schema.sql           ← generated by `bun db:generate`
└── meta/
    ├── _journal.json                 ← auto: tracks applied migrations
    ├── 0000_snapshot.json            ← auto: empty snapshot for custom migration
    └── 0001_snapshot.json            ← auto: snapshot of schema.ts state
```

### Step-by-Step

**Step A — generate the pgvector enable migration:**

```bash
bun drizzle-kit generate --custom --name=enable_pgvector
```

This creates `drizzle/0000_enable_pgvector.sql` (empty) and a `0000_snapshot.json` matching the previous schema state (empty). [CITED: orm.drizzle.team/docs/kit-custom-migrations]

Hand-edit the file to:

```sql
-- drizzle/0000_enable_pgvector.sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**Step B — generate the schema migration:**

```bash
bun drizzle-kit generate --name=initial_schema
```

This produces `drizzle/0001_initial_schema.sql` containing:
1. `CREATE TYPE "public"."topic_status" AS ENUM ('voting', 'investigating', 'done');`
2. `CREATE TABLE "users" ( ... REFERENCES "neon_auth"."users_sync"("id") ... );`
3. `CREATE TABLE "topics" ( ... );`
4. `CREATE TABLE "votes" ( ... CONSTRAINT "votes_user_topic_week_unique" UNIQUE("user_id","topic_id","week_bucket") );`

**Step C — apply locally:**

```bash
bun db:migrate  # → drizzle-kit migrate
```

### Vercel Deploy Wiring

Per the Vercel community thread on Drizzle deployment:

```jsonc
// package.json (excerpt)
"build": "bun db:migrate && next build",
"start": "next start",
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate"
```

**Why `build`, not `start`:**

- `start` runs per request/instance on Vercel — multiple parallel containers would race on migration locks.
- `build` runs once per deployment, sequentially, and FAILS THE DEPLOY on migration error (loud failure per D-14).
- DATABASE_URL must be available at build time → set in Vercel project settings as a **Build & Runtime** env var (not Runtime-only).

**Why not the programmatic `migrate()` from drizzle-orm:**

- `drizzle-kit migrate` (CLI) reads `drizzle.config.ts` and the journal automatically — fewer lines of code, zero ambiguity about which dir is the source of truth.
- The programmatic API is useful when you need full control (e.g., conditional migrations) — overkill for v0.2.

**Migration order guarantee:**

drizzle-kit's `_journal.json` is an ordered array. Migrations run in `tag` order (the timestamped/numbered prefix). [CITED: orm.drizzle.team/docs/drizzle-kit-migrate]. Custom and generated migrations are interleaved by timestamp/sequence number — `0000` always runs before `0001`.

**Idempotency:**

- `drizzle-kit migrate` reads the `__drizzle_migrations` table in the target DB and skips already-applied entries. Running `bun db:migrate` twice in a row produces "0 migrations to apply".
- `CREATE EXTENSION IF NOT EXISTS vector` is itself idempotent at the SQL level — safe to re-run.

---

## 7. Neon Auth Setup

> Phase 1 only **scaffolds** the auth client modules (env vars + module init). Phase 2 wires routes, UI, and the Magic Link flow.

### Install

```bash
bun add @neondatabase/auth @neondatabase/serverless
```

### Required Env Vars (canonical)

[CITED: neon.com/guides/neon-auth-nextjs (April 2026 version)]

| Var | Purpose | Required at | Notes |
|-----|---------|-------------|-------|
| `DATABASE_URL` | Neon Postgres connection string | Build + Runtime | Same DB as auth |
| `NEON_AUTH_BASE_URL` | Auth service endpoint URL | Runtime | Format: `https://ep-xxx.neonauth.<region>.aws.neon.build/<dbname>/auth` |
| `NEON_AUTH_COOKIE_SECRET` | Cookie HMAC key | Runtime | `openssl rand -base64 32` (≥32 chars) |

**Older Better-Auth env vars (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`):** NOT required by `@neondatabase/auth`. Neon Auth wraps Better Auth internally but does not surface its env contract. [VERIFIED: read neon.com/guides/neon-auth-nextjs full setup — only NEON_AUTH_* vars are listed]. **D-16 status:** the existing `BETTER_AUTH_*` entries in `.env.example` are vestigial; the planner should remove them or mark them deprecated. Recommend removal in Phase 1 for cleanliness — they were placeholders that never got values.

### Server-Side Module

```typescript
// src/lib/auth/server.ts
import { createNeonAuth } from "@neondatabase/auth/next/server";

import { env } from "@/lib/env";

export const auth = createNeonAuth({
  baseUrl: env.NEON_AUTH_BASE_URL,
  cookies: {
    secret: env.NEON_AUTH_COOKIE_SECRET,
  },
});
```

### Client-Side Module

```typescript
// src/lib/auth/client.ts
"use client";

import { createAuthClient } from "@neondatabase/auth/next";

export const authClient = createAuthClient();
```

### Phase 1 vs Phase 2 boundary

| Phase 1 (this phase) | Phase 2 (next) |
|----------------------|----------------|
| Install package, create modules above | Add `app/api/auth/[...path]/route.ts` |
| Validate env vars | Add `<NeonAuthUIProvider>` in layout.tsx |
| Create stub `src/lib/auth/server.ts` and `client.ts` | Add `proxy.ts` middleware (composes with existing next-intl middleware) |
| **Do not** import `auth` from any route | Add trust_score +1 hook on Magic Link verify |

**Key insight for the planner:** `createNeonAuth({...})` does NOT make a network call at construction time — the constructor is lazy/deferred. So Phase 1 can safely import-and-export the `auth` instance without runtime side effects. Phase 2 invokes `.handler()` and `.middleware()` on it. [CITED: neon.com/guides/neon-auth-nextjs init pattern]

### Drizzle Integration with Neon Auth

The integration is **schema-level only**, not runtime-level — Neon Auth manages the `neon_auth.users_sync` table directly via its own service. App code joins to it through the `usersSync` helper imported from `drizzle-orm/neon` (already shown in §4). There is no Drizzle adapter to configure for Neon Auth in this stack; the typical Better-Auth → Drizzle adapter pattern (`drizzleAdapter(db, ...)`) is replaced by Neon's managed sync.

---

## 8. QStash Client

```typescript
// src/lib/qstash.ts
import { Client } from "@upstash/qstash";

import { env } from "@/lib/env";

/**
 * QStash client — initialized at module load.
 *
 * Phase 1: present but never invoked.
 * Phase 6+: used to dispatch deep-dive workflow jobs.
 *
 * Construction is safe with missing/placeholder token:
 * - The Client constructor accepts `token` as optional.
 * - If undefined, it falls back to `process.env.QSTASH_TOKEN`.
 * - Construction does NOT make a network call.
 * - Errors only surface when `.publishJSON()` / `.publish()` etc. are invoked.
 *
 * [VERIFIED 2026-04-27: read qstash-js@2.10.1 src/client/client.ts — token typed `token?: string`]
 */
export const qstash = new Client({
  token: env.QSTASH_TOKEN,
  baseUrl: env.QSTASH_URL,
});

export type QStashClient = typeof qstash;
```

**Why this satisfies INFRA-08 ("client initializes but not yet invoked"):**

- Module load runs `new Client(...)` → no I/O, no throw on missing token.
- Phase 1 verification: import `qstash` from anywhere (e.g., a smoke-test endpoint or just `import "@/lib/qstash"` from app/layout.tsx) and confirm no runtime error.
- We never call `qstash.publishJSON(...)` or `.publish(...)` in Phase 1.

---

## 9. Env Validation

### Library Choice: `@t3-oss/env-nextjs` + Zod

**Rationale:**
- Next.js 16 ships no built-in env validation. [VERIFIED: searched Next.js 16 docs — only `process.env` access patterns documented]
- T3-Env handles **all three Next.js runtimes** (Node, Edge, Browser) with one schema — important because `@neondatabase/serverless` is Edge-safe and we may use it from middleware later.
- Distinguishes server-only vars (`DATABASE_URL`) from public vars (`NEXT_PUBLIC_APP_URL`) — critical for build-time bundling correctness.
- Two new deps (Zod 4 + T3-Env) totaling ~50KB. CONTEXT.md says "prefer no new dependency if Next.js 16 already gives us what we need" — Next.js 16 does NOT give us this, so the deps are justified.
- **Alternative considered:** Hand-rolled Zod schema in `src/lib/env.ts` — saves the T3-Env dep but loses runtime-aware var stripping (server vars exposed to client bundle by mistake is a real risk).

[CITED: env.t3.gg/docs/nextjs]

### Implementation

```typescript
// src/lib/env.ts
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-only env vars. Will throw at build time if missing or malformed.
   * Will throw at runtime if accessed from client code.
   */
  server: {
    // --- Database (Phase 1) ---
    DATABASE_URL: z.string().url().min(1),

    // --- Neon Auth (Phase 2 will use these; Phase 1 must declare them) ---
    NEON_AUTH_BASE_URL: z.string().url().min(1),
    NEON_AUTH_COOKIE_SECRET: z.string().min(32),

    // --- Upstash QStash (Phase 1: optional in dev; Phase 6+ uses) ---
    QSTASH_URL: z.string().url().default("https://qstash.upstash.io"),
    QSTASH_TOKEN: z.string().min(1).optional(),
    QSTASH_CURRENT_SIGNING_KEY: z.string().min(1).optional(),
    QSTASH_NEXT_SIGNING_KEY: z.string().min(1).optional(),

    // --- Anthropic (v0.3+ Objectivity Filter) ---
    ANTHROPIC_API_KEY: z.string().min(1).optional(),

    // --- Node env (built-in Next.js convention) ---
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },

  /**
   * Client-exposed env vars. Must be prefixed with NEXT_PUBLIC_.
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  },

  /**
   * Manually destructure runtimeEnv — required by Next.js bundler so vars
   * are not stripped at build time. [CITED: env.t3.gg/docs/nextjs]
   */
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

  /**
   * Skip validation when SKIP_ENV_VALIDATION is set — useful for CI lint runs
   * that don't have secrets. We do NOT skip in build, so Vercel deploys still validate.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Treat empty strings as undefined so `KEY=` behaves like missing.
   */
  emptyStringAsUndefined: true,
});
```

### .env.example (augmented)

```bash
# kebab.news — environment variables
# Copy to .env.local and fill in values. Never commit .env.local.

# =============================================================================
# v0.2 — Database (Phase 1)
# =============================================================================
# Neon Postgres connection string. Use a dev branch for local work.
# Format: postgresql://<user>:<password>@<host>/<dbname>?sslmode=require
DATABASE_URL=

# =============================================================================
# v0.2 — Neon Auth (Phase 2)
# =============================================================================
# Auth service URL — get from Neon Console → Auth → Setup
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

**Removed from existing .env.example:** `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` — superseded by `NEON_AUTH_*`. [ASSUMED: removal is correct per §7 analysis — flag for user confirmation]

---

## 10. Local Dev Story

### Default: Neon Dev Branch

[CITED: neon.com/blog/neon-vercel-native-integration]

1. **Create Neon project** in Neon Console.
2. **Enable Vercel-managed Neon integration** from Vercel marketplace — auto-provisions:
   - `DATABASE_URL` for production (main branch)
   - `DATABASE_URL` per preview deployment (auto-creates `preview/<git-branch>` Neon branches)
   - `NEON_AUTH_BASE_URL` and related vars on preview branches if Neon Auth is enabled on production [VERIFIED: 2026-01-16 changelog]
3. **Local dev branch:** Enable "Create a branch for your development environment" in the Neon-Vercel integration → creates a persistent `vercel-dev` branch and exposes its connection string as a Vercel **Development** env var.
4. **Pull dev env locally:**
   ```bash
   bunx vercel env pull .env.local
   ```
   This populates `.env.local` with all Vercel env vars (including the dev branch DATABASE_URL).
5. **Run migrations:**
   ```bash
   bun db:migrate
   bun dev
   ```

### Fallback: Local Docker Postgres + pgvector

For offline / airgapped contributors. Documented in CONTRIBUTING.md (created by Phase 1 plan task).

```yaml
# docker-compose.yml (Phase 1 deliverable)
services:
  postgres:
    image: pgvector/pgvector:pg17
    container_name: kebab-news-postgres
    environment:
      POSTGRES_USER: kebab
      POSTGRES_PASSWORD: kebab
      POSTGRES_DB: kebab_news
    ports:
      - "5432:5432"
    volumes:
      - kebab_pg_data:/var/lib/postgresql/data
volumes:
  kebab_pg_data:
```

**Local DATABASE_URL:** `postgresql://kebab:kebab@localhost:5432/kebab_news?sslmode=disable`

**Driver portability check:** `@neondatabase/serverless` works against any Postgres URL, but Neon's HTTP driver requires SSL/TLS. For a plain local Docker Postgres without TLS, contributors have two options:

- **Option A (recommended):** Use Neon Local Connect — a small proxy that lets `@neondatabase/serverless` talk to a local Postgres. [CITED: neon.com docs — adds complexity, not worth for v0.x per CONTEXT.md D-03]
- **Option B (documented):** Locally swap the import in `src/lib/db/index.ts` to `postgres` (porsager) or `pg` for Docker dev only. Not switching by default per D-02.

**Resolution per CONTEXT.md:** D-03 says Docker is a "documented fallback path" only. CONTRIBUTING.md instructs Docker users to either set up Neon Local OR accept that local-only contributors may need to install `postgres` (porsager) and swap one import line. We do NOT pre-build a driver-swap mechanism — adds complexity for a fallback path. [ASSUMED: this is the right call — flag for user]

### Driver Behavior with Plain Postgres

Without Neon Local, `@neondatabase/serverless` against `localhost:5432`:
- HTTP driver (`neon()` + `neon-http`): will fail — Neon's HTTP endpoint is cloud-only.
- WebSocket driver (`Pool` + `neon-ws`): MIGHT work depending on local TLS — unverified.

This is a documentation problem for CONTRIBUTING.md, not a Phase 1 code problem. Phase 1 ships with the Neon HTTP driver as canonical; the Docker fallback is a doc-only artifact.

### Auto-Branching for Vercel Preview

[CITED: neon.com/docs/guides/vercel-managed-integration]

When the Neon Vercel integration is enabled:
1. PR push triggers Vercel preview build.
2. Vercel webhook → Neon API creates branch `preview/<git-branch>`.
3. Neon returns connection string → Vercel injects as DATABASE_URL for that preview only.
4. Build runs `bun db:migrate` against the new branch.
5. PR closed → Vercel webhook → Neon deletes the preview branch (configurable).

No GitHub Actions setup required — the marketplace integration handles everything.

---

## 11. Validation Architecture (Nyquist Dimension 8)

`workflow.nyquist_validation: true` per `.planning/config.json` — validation section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | **None installed yet** — Wave 0 must add `vitest` (lightweight, Bun-friendly) |
| Config file | `vitest.config.ts` (Wave 0) |
| Quick run command | `bun test:db` (alias for `vitest run tests/db --reporter=verbose`) |
| Full suite command | `bun test` (alias for `vitest run`) |
| SQL probe runner | `bun run scripts/probe-pgvector.ts` (one-off TS script using `db.execute(sql.raw(...))`) |

**Why vitest, not bun test:** `bun test` works but lacks Drizzle/Postgres ecosystem helpers; vitest has wider community examples for testing migration idempotency. Negligible perf difference for the smoke-test scope of Phase 1.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | `users` table exists with `trust_score int default 0` | unit | `bun test:db tests/db/users.schema.test.ts` | ❌ Wave 0 |
| INFRA-02 | `topics` table exists with all columns and `topic_status` enum | unit | `bun test:db tests/db/topics.schema.test.ts` | ❌ Wave 0 |
| INFRA-03 | `votes` composite unique constraint rejects duplicates | integration | `bun test:db tests/db/votes.unique.test.ts` | ❌ Wave 0 |
| INFRA-07 | `pg_extension` row exists for `vector` | smoke | `bun run scripts/probe-pgvector.ts` | ❌ Wave 0 |
| INFRA-08 | QStash client constructs without error | unit | `bun test tests/qstash.init.test.ts` | ❌ Wave 0 |
| INFRA-09 | `bun db:migrate` is idempotent (twice = no diff) | integration | `bun run scripts/probe-migration-idempotent.sh` | ❌ Wave 0 |
| INFRA-09 | `.env.example` covers every required server var | unit | `bun test tests/env.example.test.ts` (parses .env.example, asserts every key in env.ts schema is present) | ❌ Wave 0 |
| Smoke | `bun dev` starts without DB error | manual + smoke | `timeout 10 bun dev | grep -q "Ready"` | ❌ Wave 0 |
| Smoke | `bun build` runs migrations and builds | smoke | `bun run build` (in CI/local) | ❌ Wave 0 |

### Concrete Probe Specs

**1. pgvector probe** (`scripts/probe-pgvector.ts`):

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

**2. Migration idempotency** (`scripts/probe-migration-idempotent.sh`):

```bash
#!/usr/bin/env bash
set -euo pipefail
bun db:migrate                                     # first run (may apply or no-op)
OUTPUT=$(bun db:migrate 2>&1)                      # second run
if echo "$OUTPUT" | grep -qE "already applied|0 migrations to apply|nothing to migrate"; then
  echo "PASS: migration is idempotent"
  exit 0
fi
echo "FAIL: second migration run produced unexpected output:"
echo "$OUTPUT"
exit 1
```

**3. .env.example coverage** (`tests/env.example.test.ts`):

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

**4. QStash construction** (`tests/qstash.init.test.ts`):

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

**5. Composite unique enforcement** (`tests/db/votes.unique.test.ts`):

```typescript
import { describe, expect, it } from "vitest";
import { db, votes } from "@/lib/db";

describe("votes composite unique", () => {
  it("rejects duplicate (user_id, topic_id, week_bucket)", async () => {
    const userId = "test-user-id";
    const topicId = "00000000-0000-0000-0000-000000000001";
    const weekBucket = "2026-W17";

    // Setup: insert once
    await db.insert(votes).values({ userId, topicId, weekBucket });

    // Assert: second insert with same composite key throws
    await expect(
      db.insert(votes).values({ userId, topicId, weekBucket }),
    ).rejects.toThrow(/duplicate key|unique constraint|votes_user_topic_week_unique/i);
  });
});
```

### Sampling Rate

- **Per task commit:** `bun check:all && bun test:db` (~10s)
- **Per wave merge:** `bun test` (full suite — ~30s) + `bun run scripts/probe-pgvector.ts`
- **Phase gate:** Full suite + `bun build` (Vercel-equivalent migration run) green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `vitest` + `vitest.config.ts` install — `bun add -D vitest @vitest/coverage-v8`
- [ ] `tests/db/users.schema.test.ts` — covers INFRA-01
- [ ] `tests/db/topics.schema.test.ts` — covers INFRA-02
- [ ] `tests/db/votes.unique.test.ts` — covers INFRA-03
- [ ] `scripts/probe-pgvector.ts` — covers INFRA-07
- [ ] `tests/qstash.init.test.ts` — covers INFRA-08
- [ ] `tests/env.example.test.ts` — covers INFRA-09 (.env coverage)
- [ ] `scripts/probe-migration-idempotent.sh` — covers INFRA-09 (idempotency)
- [ ] `tests/db/setup.ts` — shared fixtures (truncate tables, seed `users_sync` rows for FK satisfaction in dev branch testing)
- [ ] CI workflow file (.github/workflows/test.yml) — runs check:all + tests on PR

---

## 12. Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Schema definition (TypeScript) | Backend (lib/db) | — | Drizzle is a library, not a service; shared between server and edge |
| Migration execution | Build-time (Vercel build) | Local dev (bun) | Migrations are one-shot per deploy; never run from a request handler |
| Database connection | API / Backend | Edge | `@neondatabase/serverless` HTTP driver works in both Node and Edge runtimes |
| Auth schema management | External (Neon Auth) | — | `neon_auth.users_sync` is owned by Neon Auth, not by our migrations |
| Auth client init (server) | Frontend Server (Next.js server actions/routes) | — | `createNeonAuth` is server-only |
| Auth client init (browser) | Browser / Client | — | `createAuthClient` is `"use client"` |
| Env validation | Build-time + Runtime | — | Validates at module-import time; T3-Env runs in Node, Edge, Browser |
| QStash client | API / Backend | — | Used in v0.4+ from API routes / route handlers; never client-exposed |

---

## 13. Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-schema FK type for users_sync | Manual `pgSchema("neon_auth").table("users_sync", { ... })` definition | `import { usersSync } from "drizzle-orm/neon"` | Drizzle ships an exact, version-tracked typing — manual would drift |
| ISO week computation | Manual date math | `import { getISOWeek, getISOWeekYear } from "date-fns"` | Edge cases around year boundaries (W52 vs W01) are non-trivial |
| Env var validation | Manual `if (!process.env.X) throw` | `@t3-oss/env-nextjs` + Zod | Runtime-aware var stripping, type inference, single source of truth |
| Migration runner | Custom SQL execution loop | `drizzle-kit migrate` | Journal management, transaction wrapping, ordering — battle-tested |
| Auth flow | Direct integration with Better Auth primitives | `@neondatabase/auth` (wraps Better Auth) | Per CONTEXT.md D-04; Better Auth primitives remain available as escape hatch |
| QStash signature verification (Phase 6+) | Manual HMAC | `Receiver` class from `@upstash/qstash` | Constant-time compare, key rotation built in |
| UUID generation | App-level (uuid npm package) | Postgres `gen_random_uuid()` | Per D-11; matches Neon Auth user-id generation |
| pgvector type wrappers | Custom column type | `vector("name", { dimensions: N })` from `drizzle-orm/pg-core` | Built-in helpers for L2/cosine/inner-product distance |

---

## 14. Common Pitfalls

### Pitfall 1: Cross-schema FK type mismatch (users.id text vs uuid)

**What goes wrong:** Developer reads CONTEXT.md D-11 ("UUID via gen_random_uuid()"), declares `users.id` as `uuid()` in Drizzle, then `bun db:generate` produces SQL with a type mismatch on the FK to `neon_auth.users_sync(id)` (which is `text`).

**Why it happens:** D-11 talks about ID *generation strategy* (UUID v4 strings). The FK *column type* must match the referenced column. Neon Auth's `users_sync.id` is declared as `text` in their schema [VERIFIED: drizzle-orm/neon-auth.js source].

**How to avoid:** `users.id` MUST be `text("id")` in our Drizzle schema. The value stored is still a UUID v4 string set by Neon Auth — Postgres compares text values fine.

**Warning signs:** `drizzle-kit generate` output contains `CREATE TABLE "users" ( "id" uuid ...)` — should be `"id" text`.

### Pitfall 2: Migration runs in `start`, not `build`

**What goes wrong:** Vercel scales to multiple instances; each instance runs `start` → multiple parallel `drizzle-kit migrate` calls race on the journal lock, succeed inconsistently, or fail.

**Why it happens:** Naive copy-paste of "drizzle-kit migrate && next start" from a single-instance tutorial.

**How to avoid:** Wire migration into `build` script: `"build": "bun db:migrate && next build"`. Vercel runs `build` once per deployment.

**Warning signs:** Multiple "applied migration" log lines per deploy in Vercel build logs; sporadic "duplicate type" errors mid-deploy.

### Pitfall 3: pgvector enable in same migration as schema

**What goes wrong:** Developer puts `CREATE EXTENSION vector;` at the top of the schema migration. Works on first deploy. On a fresh database, the extension's permissions or privileges may delay availability and the rest of the migration races on it.

**Why it happens:** Plausible-looking, but EXTENSION creation in the same transaction as DDL it doesn't yet need is "works for me" code.

**How to avoid:** Put `CREATE EXTENSION IF NOT EXISTS vector;` in `0000_enable_pgvector.sql` as a custom migration — runs first, in isolation, transaction-bounded. Schema migrations come in 0001+. drizzle-kit runs migrations in separate transactions by default. [CITED: orm.drizzle.team/docs/drizzle-kit-migrate]

### Pitfall 4: BETTER_AUTH_* env vars left in .env.example confuse contributors

**What goes wrong:** New contributor sees `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`, tries to set them, can't figure out what they do, or worse — sets them to dummy values and the app silently uses Neon Auth's defaults instead.

**Why it happens:** D-16 hedge ("Neon Auth may still require them under the hood"). Verified: it does NOT.

**How to avoid:** Remove `BETTER_AUTH_*` from `.env.example` in this phase. If someone discovers they're needed for a custom Better-Auth integration in v1.0, add them back then. [ASSUMED: removal is safe — flag for user confirmation]

### Pitfall 5: schemaFilter affects pull/push but not generate/migrate

**What goes wrong:** Developer assumes `schemaFilter: ['public']` will block `drizzle-kit generate` from emitting cross-schema FKs. It doesn't — generate uses `schema.ts`, not the live DB.

**Why it happens:** The drizzle-kit docs are subtle: schemaFilter is an introspection filter for `pull` and a write filter for `push`. `generate` and `migrate` ignore it. [CITED: orm.drizzle.team/docs/drizzle-config-file]

**How to avoid:** Treat `schemaFilter: ['public']` as a documentation/safety net for `pull` and `push` only. The actual cross-schema FK SQL is determined by what's in `schema.ts`. We WANT the FK to `neon_auth.users_sync(id)` — `schemaFilter` doesn't and shouldn't suppress it.

### Pitfall 6: Drizzle 1.0 beta vs stable

**What goes wrong:** Developer sees `1.0.0-beta.23` and pins it for "future-proofing". Beta has churned 23 versions in 2 weeks; APIs and SQL output drift.

**Why it happens:** Optimism about pre-1.0 packages.

**How to avoid:** Pin `^0.45.2` (current stable) until Drizzle 1.0 GA ships. Set a calendar reminder for v0.4 to revisit. [VERIFIED: drizzle-orm release timeline shows beta cadence]

### Pitfall 7: Bun's `bun:sqlite` vs Postgres confusion

**What goes wrong:** Developer follows a Bun tutorial that uses `bun:sqlite`, mixes with Postgres docs, ends up with a hybrid that runs locally but fails in production.

**Why it happens:** Bun's first-party DB driver is SQLite-focused; Postgres docs come from the Drizzle/Neon side.

**How to avoid:** Stick to `@neondatabase/serverless` + `drizzle-orm/neon-http` end-to-end. Never import from `bun:sqlite`.

---

## 15. Code Examples (Verified Patterns)

### Example A: ISO week_bucket computation (Phase 5 will use this; Phase 1 ships date-fns dep)

```typescript
import { getISOWeek, getISOWeekYear } from "date-fns";

export function currentWeekBucket(now: Date = new Date()): string {
  const year = getISOWeekYear(now);
  const week = getISOWeek(now);
  return `${year}-W${String(week).padStart(2, "0")}`;
}
// → "2026-W17" for 2026-04-27
```

[VERIFIED: date-fns 4.1.0 API; getISOWeekYear handles edge cases like 2026-01-03 → 2025-W53]

### Example B: Drizzle query — joining users to usersSync

```typescript
import { eq } from "drizzle-orm";
import { db, users, usersSync } from "@/lib/db";

export async function getUserWithEmail(userId: string) {
  const [row] = await db
    .select({
      id: users.id,
      trustScore: users.trustScore,
      email: usersSync.email,
      name: usersSync.name,
    })
    .from(users)
    .leftJoin(usersSync, eq(users.id, usersSync.id)) // LEFT JOIN per Neon best practice
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}
```

**Why LEFT JOIN, not INNER JOIN:** [CITED: neon.com/docs/neon-auth/best-practices] — Neon Auth uses soft-delete (`deleted_at` timestamp) and there can be sync delays; LEFT JOIN ensures app rows return even if auth row hasn't synced yet.

### Example C: Generated SQL output (sanity-check what drizzle-kit emits)

After `bun db:generate --name=initial_schema`, expect:

```sql
-- drizzle/0001_initial_schema.sql (excerpt)

CREATE TYPE "public"."topic_status" AS ENUM('voting', 'investigating', 'done');
--> statement-breakpoint
CREATE TABLE "users" (
    "id" text PRIMARY KEY NOT NULL,
    "trust_score" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topics" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "title" text NOT NULL,
    "original_submission" text NOT NULL,
    "neutral_rewrite" text,
    "status" "topic_status" DEFAULT 'voting' NOT NULL,
    "vote_count" integer DEFAULT 0 NOT NULL,
    "created_by" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "votes" (
    "user_id" text NOT NULL,
    "topic_id" uuid NOT NULL,
    "week_bucket" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "votes_user_topic_week_unique" UNIQUE("user_id","topic_id","week_bucket")
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_id_users_sync_id_fk"
    FOREIGN KEY ("id") REFERENCES "neon_auth"."users_sync"("id")
    ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_created_by_users_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id")
    ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
    ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_topic_id_topics_id_fk"
    FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id")
    ON DELETE cascade ON UPDATE no action;
```

[ASSUMED: exact SQL text — drizzle-kit output may differ slightly in whitespace and constraint naming; the planner should run `bun db:generate` once to capture the actual output and verify it manually before committing the migration. This is captured as a Wave 0 verification task.]

---

## 16. State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Define `users_sync` schema manually with `pgSchema("neon_auth").table(...)` | `import { usersSync } from "drizzle-orm/neon"` | drizzle-orm 0.44.x (late 2025) | Single source of truth; types track Neon Auth changes |
| `users.id` as `uuid` referencing `neon_auth.users_sync.id uuid` | `users.id` as `text` referencing `users_sync.id text` | Neon Auth GA (2025-12) | UUID v4 stored as text; type match required for FK |
| Manual `BETTER_AUTH_*` env config | `NEON_AUTH_BASE_URL` + `NEON_AUTH_COOKIE_SECRET` | `@neondatabase/auth` rewrite (2025-Q4) | Smaller surface; Better Auth wrapped, not exposed |
| `drizzle.config.ts` with `driver: 'pg'` | `dialect: 'postgresql'` (driver inferred) | drizzle-kit 0.20+ (2024) | Cleaner config; stable for years |
| `pgEnum` then column type stringly | `pgEnum('name', [...] as const)` then `.default(typedValue)` | drizzle-orm 0.30+ | Full type inference for status field |
| Composite unique via `uniqueIndex` | Modern callback `(t) => [unique().on(...)]` | drizzle-orm 0.36+ | Cleaner DSL; named constraints |
| `drizzle-kit generate:pg` | `drizzle-kit generate` (dialect from config) | drizzle-kit 0.20+ | Single command for all dialects |
| Better Auth + Drizzle adapter | Neon Auth (manages tables itself) | Neon Auth GA | No adapter wiring needed in app code |
| Hand-rolled env validation | `@t3-oss/env-nextjs` + Zod | T3 stack popularization (2023) | Standard since 2024 |

**Deprecated/outdated patterns to avoid:**
- `@neondatabase/serverless` ≤ `0.10.x` (pre-tagged-template hardening) — security regression
- `drizzle-orm` < `0.40.1` with `@neondatabase/serverless` ≥ `1.0` — the issue #3678 bug
- Putting Drizzle migrations in `start` script on Vercel — race condition

---

## 17. Sources

### Primary (HIGH confidence)

- [Neon Auth Drizzle Quick-Start](https://neon.com/docs/neon-auth/quick-start/drizzle) — usersSync helper, schema integration
- [Neon Auth Next.js Guide](https://neon.com/guides/neon-auth-nextjs) — env vars, install, file layout, route handler
- [Drizzle ORM PostgreSQL Column Types](https://orm.drizzle.team/docs/column-types/pg) — pgEnum, vector, primitive types
- [Drizzle ORM Indexes & Constraints](https://orm.drizzle.team/docs/indexes-constraints) — composite unique callback syntax
- [Drizzle ORM PostgreSQL Extensions](https://orm.drizzle.team/docs/extensions/pg) — pgvector enable strategy
- [Drizzle ORM Custom Migrations](https://orm.drizzle.team/docs/kit-custom-migrations) — `--custom` flag for empty migration
- [Drizzle ORM `migrate` command](https://orm.drizzle.team/docs/drizzle-kit-migrate) — execution semantics
- [Drizzle ORM Config Reference](https://orm.drizzle.team/docs/drizzle-config-file) — schemaFilter, tablesFilter, out
- [Drizzle ORM Connect to Neon](https://orm.drizzle.team/docs/connect-neon) — driver init pattern
- [Drizzle ORM Vector Similarity Search](https://orm.drizzle.team/docs/guides/vector-similarity-search) — pgvector full setup
- [Neon Vercel-Managed Integration](https://neon.com/docs/guides/vercel-managed-integration) — preview branch auto-provisioning
- [Neon Auth Best Practices](https://neon.com/docs/neon-auth/best-practices) — LEFT JOIN, soft-delete handling
- [Neon Serverless GA Blog](https://neon.com/blog/serverless-driver-ga) — 1.0 breaking change rationale
- [Neon Auto-Branching Vercel Native Integration Blog](https://neon.com/blog/neon-vercel-native-integration) — preview branch flow
- [@upstash/qstash GitHub README](https://github.com/upstash/qstash-js/blob/main/README.md) — Client constructor
- [@upstash/qstash Getting Started](https://upstash.com/docs/qstash/sdks/ts/gettingstarted) — installation + token
- [T3 Env Next.js Docs](https://env.t3.gg/docs/nextjs) — createEnv pattern
- [drizzle-orm/neon/neon-auth.js source](https://cdn.jsdelivr.net/npm/drizzle-orm@0.45.2/neon/neon-auth.js) — usersSync runtime definition

### Secondary (MEDIUM confidence — verified via cross-reference)

- [GitHub Issue better-auth#3678](https://github.com/better-auth/better-auth/issues/3678) — closed 2025-08-01; resolution comments confirmed via REST API
- [Vercel Community: Drizzle migrations on Vercel](https://community.vercel.com/t/running-drizzle-migrations-for-my-db-before-next-js-starts-on-vercel/18074) — build-script pattern
- [Neon Serverless Changelog](https://github.com/neondatabase/serverless/blob/main/CHANGELOG.md) — version timeline
- [Drizzle PostgreSQL Best Practices Gist (2025)](https://gist.github.com/productdevbook/7c9ce3bbeb96b3fabc3c7c2aa2abc717) — pgEnum patterns

### Tertiary (LOW confidence — flagged for verification)

- [Medium: Building with Next.js Drizzle Neon Better-Auth](https://medium.com/@abgkcode/building-a-full-stack-application-with-next-js-drizzle-orm-neon-postgresql-and-better-auth-6d7541fba48a) — sample implementation (less authoritative than Neon's own docs)

---

## 18. Assumptions Log

Claims tagged `[ASSUMED]` in this research that need user/planner confirmation:

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Removing `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` from `.env.example` is safe (Neon Auth doesn't require them) | §7, §9, §14 Pitfall 4 | Low — verified Neon Auth docs only list NEON_AUTH_* vars; user can confirm by leaving them in if uncertain |
| A2 | The Docker fallback for local dev uses `pgvector/pgvector:pg17` and contributors swap a driver import locally if needed (no built-in driver-swap) | §10 | Low — affects only fallback contributors; doc problem, not code |
| A3 | The exact text of `drizzle-kit generate` output (Code Example C) — minor whitespace / constraint-name differences possible | §15 | Very low — Wave 0 task captures actual output |
| A4 | `vitest` is the right test framework choice over `bun test` | §11 | Medium — if user prefers `bun test`, tests need rewriting (~2hr task); revisit during planning |
| A5 | Removing `BETTER_AUTH_*` from `.env.example` rather than marking deprecated | §9 .env.example | Low |

If this table needs to be empty: ask user about A1, A4, A5 in plan-check stage.

---

## 19. Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Bun | Build, test, dev | ✓ | 1.3.11 (mise-pinned) | — |
| Node.js | Compatibility (Drizzle Kit may shell out) | ✓ | 25.8.1 | — |
| Docker | Local Postgres fallback (D-03) | ✓ | 29.4.0 | — |
| psql CLI | Smoke probes (`SELECT * FROM pg_extension`) | ✓ | 18.3 | `db.execute(sql.raw(...))` from app code |
| Neon account | Cloud Postgres + Auth (canonical deploy) | UNKNOWN | — | Docker Postgres for local dev only |
| Vercel account | Production deploy | UNKNOWN | — | Self-host (Dockploy) — explicitly rejected per D-01 |
| Upstash account | QStash service (Phase 6+) | UNKNOWN | — | Phase 1 only needs env scaffold; no live calls |
| Anthropic API key | v0.3 Objectivity Filter | UNKNOWN | — | Phase 1 doesn't invoke; optional in env.ts |

**Missing dependencies with no fallback:**
- None blocking Phase 1 execution. Cloud accounts (Neon, Vercel, Upstash, Anthropic) are user-provisioned and gated outside this plan's scope.

**Missing dependencies with fallback:**
- Neon account → Docker Postgres for local dev only (no Neon Auth equivalent — Phase 2 needs the cloud).

---

## 20. Security Domain

`security_enforcement` not explicitly false in `.planning/config.json` → enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | YES (scaffold only — wired in Phase 2) | Neon Auth (Better-Auth-based); Magic Link |
| V3 Session Management | YES (scaffold only — wired in Phase 2) | Neon Auth cookies, HMAC via NEON_AUTH_COOKIE_SECRET |
| V4 Access Control | NO (no protected resources yet — added with first authed route in Phase 2) | — |
| V5 Input Validation | YES | Zod schemas via `@t3-oss/env-nextjs` for env; Drizzle types for DB inputs |
| V6 Cryptography | YES | NEON_AUTH_COOKIE_SECRET (≥32 chars, generated via `openssl rand -base64 32`); never hand-roll |
| V7 Error Handling | YES | Drizzle migrate fails build loudly per D-14; env validation throws at startup |
| V14 Configuration | YES | All secrets via env; `.env.local` gitignored; no hardcoded values |

### Known Threat Patterns for Drizzle + Neon stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection via untyped query | Tampering | Drizzle parameterizes all queries; never use `sql.unsafe()` or `sql.query()` with concatenated strings |
| Tagged-template injection (Neon serverless 1.0+) | Tampering | Use template literals `sql\`...\`` with `${}` interpolation; for parameterized fallback use `sql.query(text, params)` — never string-concat |
| Env var leak to client bundle | Information Disclosure | T3-Env's `client/server` split prevents server vars from being bundled |
| Cookie secret exposure | Spoofing | NEON_AUTH_COOKIE_SECRET in env only; never logged; rotated via Neon Console |
| Migration race during parallel deploy | Tampering / DoS | Run migrations in `build`, not `start`; `__drizzle_migrations` journal lock |
| Unauthenticated DB access via leaked DATABASE_URL | Spoofing / Information Disclosure | Vercel encrypted env vars; Neon connection string includes scoped role; rotate on suspected leak |
| Cross-schema FK type mismatch silently allows wrong types | Tampering | Use `usersSync` helper (text-typed); enforce via TS at compile time |

---

## 21. Open Questions

1. **Should `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` be removed or marked deprecated in `.env.example`?**
   - What we know: Neon Auth wraps Better Auth but exposes only `NEON_AUTH_*` vars. Better Auth env vars are not consumed by `@neondatabase/auth`.
   - What's unclear: Whether the user wants to preserve them as a hedge (e.g., if v1.0 hardening swaps to bare Better Auth).
   - Recommendation: Remove. They're dead weight. If v1.0 needs them, add then. Flag as A1 in Assumptions.

2. **Does the user prefer `vitest` or `bun test` as the test framework?**
   - What we know: Both work with Bun. `vitest` has a deeper ecosystem; `bun test` has zero added deps.
   - What's unclear: User's preference. CONTEXT.md doesn't pin.
   - Recommendation: Default to `vitest` for ecosystem reasons; trivial to swap if user prefers `bun test`. Flag as A4.

3. **Is `pgvector/pgvector:pg17` the right Docker image, or `pg16`?**
   - What we know: Postgres 17 is GA; pgvector publishes both. Neon hosts on Postgres 17 by default in 2026.
   - What's unclear: If a contributor's local environment has constraints favoring 16.
   - Recommendation: Default to `pg17` to match Neon. Document `pg16` as alternate in CONTRIBUTING.md.

4. **Should the Phase 1 plan include a `docker-compose.yml` and CONTRIBUTING.md snippet, or defer those to a doc-only sub-task?**
   - What we know: D-03 says "documented fallback" — implies CONTRIBUTING.md update.
   - What's unclear: Whether Phase 1 ships the docker-compose file or just the docs section.
   - Recommendation: Include `docker-compose.yml` (~10 lines) — minimal cost, large value for offline contributors. Defer extensive self-host docs (backup, monitoring) per D-03 deferred scope.

---

## 22. Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every package version verified against npm registry on 2026-04-27; Better-Auth × Neon serverless issue confirmed resolved via GitHub REST API
- Architecture: HIGH — followed canonical Neon docs and Drizzle docs; cross-referenced source code for usersSync helper
- Pitfalls: HIGH — derived from source-code inspection (usersSync.id is text), official changelog (Neon serverless 1.0 breaking change), GitHub issue thread (#3678 resolution), and Vercel community discussion (build vs start)
- Validation architecture: MEDIUM — vitest choice flagged as A4 assumption; concrete probe scripts written but not yet executed

**Research date:** 2026-04-27
**Valid until:** 2026-05-27 (30 days — stack is stable; one watchpoint is `@neondatabase/auth` exiting beta which would prompt a re-pin)

**Re-verification triggers (flag for next research session):**
- `@neondatabase/auth` GA release (currently 0.2.0-beta.1)
- `drizzle-orm` 1.0 stable release
- Any Neon Auth env-var name change
