# Phase 1: Database Foundation - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Drizzle ORM connected to Neon Postgres with three app tables (`users`, `topics`, `votes`) plus the `pgvector` extension enabled, and an env-var scaffold ready for Vercel + Upstash + Neon Auth. No UI, no auth flows, no AI calls, no FactCards/Sources/Articles tables — those land in later phases.

Phase 1 is pure infrastructure: when this phase is done, a developer can clone the repo, set `DATABASE_URL`, run migrations, and `bun dev` starts cleanly with Drizzle wired up.

</domain>

<decisions>
## Implementation Decisions

### Hosting & Driver
- **D-01:** Canonical kebab.news deployment uses **Neon Postgres** (free tier covers v0.2–v0.5). Self-hosted Postgres on Dockploy was considered and rejected because Vercel + serverless connection-pooling overhead, lack of HTTP/Edge driver, and PR-preview branching value tip the cost-benefit toward Neon.
- **D-02:** Driver is **`@neondatabase/serverless`** (HTTP/WebSocket). Edge-runtime safe. Future-proofs the v0.4 pipeline if any worker code ever needs to run on Vercel Edge. Drizzle's driver-agnostic API means a future swap to `postgres` (TCP) is mechanical (~10 lines in `db/index.ts`) — no schema or query changes required.
- **D-03:** Local dev uses a **Neon dev branch** by default (zero local Postgres setup). CONTRIBUTING.md documents a **local Docker Postgres + pgvector image** as a fallback path for offline/airgapped contributors. PR-preview deploys on Vercel automatically use isolated Neon branches.

### Authentication Coupling (locks Phase 2 shape)
- **D-04:** Authentication is **Neon Auth** (the Neon-hosted, Better Auth–based service). It auto-creates and maintains a `neon_auth` schema in the same Neon database, containing the `users_sync` table and related auth records. Drizzle has first-class support for this via a dedicated helper — no introspection step is needed.
- **D-05:** The app's **`public.users` table** is reduced to **profile-only data**. It holds:
  - `id` — UUID, foreign key referencing `neon_auth.users_sync.id` (one-to-one)
  - `trust_score` — `int` `default 0` (incremented on first verified Magic-Link login in Phase 2)
  - `created_at` — `timestamp` `default now()`
  Identity, sessions, magic-link tokens, and verification records all live in `neon_auth` and are NOT defined in our Drizzle migrations.
- **D-06:** Magic Link delivery uses **Neon Auth's built-in email provider** for v0.2. Resend / custom email templating is deferred — Neon Auth's webhook override is the v1.0 hardening path when branded transactional email matters.
- **D-07:** Frontend auth UI in Phase 2 will use **`@neondatabase/auth/react`** components for sign-in/out flows. The underlying Better Auth client APIs remain available if custom UX is needed later — not locked out, just not built upfront.

### Schema Shape (Phase 1 deliverable)
- **D-08:** `topics` table columns:
  - `id` — UUID, primary key, `default gen_random_uuid()`
  - `title` — `text not null`
  - `original_submission` — `text not null` (raw user input before Objectivity Filter)
  - `neutral_rewrite` — `text` (nullable until Phase 4 fills it)
  - `status` — Postgres enum `topic_status` with values `voting`, `investigating`, `done`; default `voting`
  - `vote_count` — `int default 0` (denormalized counter; Phase 5 maintains it transactionally)
  - `created_by` — UUID, foreign key → `public.users.id`, `not null`
  - `created_at` — `timestamp default now()`
- **D-09:** `votes` table columns:
  - `user_id` — UUID, FK → `public.users.id`
  - `topic_id` — UUID, FK → `public.topics.id`
  - `week_bucket` — `text not null` in **ISO week format** (`"2026-W17"`); see D-10
  - `created_at` — `timestamp default now()`
  - **Composite unique constraint** on `(user_id, topic_id, week_bucket)` — one vote per user per topic per week, supports Phase 5 retract semantics
- **D-10:** `week_bucket` uses **ISO 8601 week strings** (`"2026-W17"`). Rationale: human-readable in DB during debugging, computed in TS via `date-fns` `getISOWeek` + year, composable in unique constraints, monotonic for range queries, no timezone ambiguity (ISO weeks are UTC-anchored). Phase 5 weekly-budget reset becomes a string equality check.
- **D-11:** ID strategy is **UUID v4 via Postgres `gen_random_uuid()`**. Reason: matches Neon Auth's user IDs (UUID-based), no extra dependency, future-proof for shareable topic URLs, foreign-key joins to `neon_auth.users_sync` are clean.

### pgvector
- **D-12:** Phase 1 only **enables the `vector` extension** (`CREATE EXTENSION IF NOT EXISTS vector` as part of the initial migration). **No vector columns are added on any table in this phase.** A vector column on `topics` (and elsewhere) will be added in v0.4 via a follow-up migration when the embedding pipeline actually consumes it. Adding a column now would be YAGNI and would force a NULL-handling story we don't need yet.

### Migration Workflow
- **D-13:** Migrations use **`drizzle-kit generate` + `drizzle-kit migrate`**. Versioned SQL files are committed to the repo under `drizzle/` (or equivalent). `drizzle-kit push` is used **only for local schema iteration during development** and is never run against production. Reason: OSS contributor reproducibility, Vercel build-time migration runs, and audit trail for schema changes.
- **D-14:** Vercel deploys run migrations as part of the build step (or via a `postdeploy` hook — researcher to confirm the cleanest pattern). The build must fail loudly if migrations fail rather than starting the app against a stale schema.

### `.env.example` & Secrets
- **D-15:** `.env.example` already exists at repo root and currently lists `DATABASE_URL`, `QSTASH_*`, `BETTER_AUTH_*`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_APP_URL`. Phase 1 **augments** it (never replaces existing entries) with:
  - `NEON_AUTH_URL` / `NEON_AUTH_SECRET` (or whatever Neon Auth's required env vars are — researcher to verify against current docs)
  - Comment headers grouping vars by milestone where they get activated (e.g., `# v0.3+ Anthropic` for `ANTHROPIC_API_KEY`)
- **D-16:** `BETTER_AUTH_URL` and `BETTER_AUTH_SECRET` stay even though Neon Auth wraps Better Auth — Neon Auth may still require them under the hood. Researcher confirms.
- **D-17:** No hardcoded secrets in source. All env access goes through a single `src/lib/env.ts` module with runtime validation (Zod or equivalent — researcher picks the lightest viable option that the codebase already has or that aligns with the project's minimal-deps stance).

### Upstash Wiring
- **D-18:** Upstash QStash client is **initialized at module load** (env vars present, client constructed) but **never invoked** in Phase 1. A simple `lib/qstash.ts` module exporting the client is sufficient. Phase 6 / Phase 7 are where it actually gets called.

### Claude's Discretion
- File and folder layout under `src/lib/db/` and `src/lib/auth/` — researcher and planner pick the cleanest Next.js 16 App Router pattern.
- Choice of env-validation library (Zod, Valibot, hand-rolled) — pick the lightest viable option, prefer no new dependency if Next.js 16 already gives us what we need.
- Exact migration directory location (`drizzle/`, `src/lib/db/migrations/`, etc.) — match Drizzle community conventions.
- How to handle the `neon_auth` schema in `drizzle.config.ts` — include it in `schemaFilter` if Neon Auth's helper requires it; otherwise leave it managed externally.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Neon Auth + Drizzle
- `https://neon.com/docs/neon-auth/quick-start/drizzle` — Official Neon Auth + Drizzle integration guide. Defines the `neon_auth.users_sync` table contract and Drizzle's first-class helper.
- `https://neon.com/guides/neon-auth-nextjs` — Next.js-specific setup with `@neondatabase/auth/react`.
- `https://neon.com/docs/auth/roadmap` — Plugin support matrix; confirms Magic Link availability under Neon Auth.
- `https://neon.com/guides/neon-auth-webhooks-nextjs` — Webhook override path for replacing built-in email delivery (deferred to v1.0).

### Drizzle + Neon Driver
- `https://neon.com/docs/guides/drizzle` — Drizzle ↔ Neon serverless driver setup (HTTP/WS).
- `https://orm.drizzle.team/docs/get-started/neon-new` — Drizzle's official Neon quick-start.

### Better Auth (underlying)
- `https://better-auth.com/docs/plugins/magic-link` — Magic Link plugin reference (Neon Auth wraps this).

### Known Compatibility Issue
- `https://github.com/better-auth/better-auth/issues/3678` — Better Auth × `@neondatabase/serverless` v1.0 tagged-template compatibility. Researcher MUST check current resolution status and pin compatible versions in `package.json`.

### Project-Local
- `.planning/PROJECT.md` — Mission, stack constraints, key decisions (especially "Schema right-sized per milestone" 2026-04-27).
- `.planning/REQUIREMENTS.md` §v0.2 — INFRA-01..03, INFRA-07..09 acceptance criteria.
- `.planning/ROADMAP.md` Phase 1 — Goal and success criteria locked at the milestone level.
- `.env.example` — Existing env scaffold to extend, not replace.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.env.example` (repo root) — already lists `DATABASE_URL`, `QSTASH_URL`, `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_APP_URL`. **Augment, don't replace.**
- `src/lib/constants.ts` — pattern for shared constants (currently `GITHUB_URL`, `BASE_URL`). New `env.ts` module follows the same single-file-per-concern shape.
- `mise.toml` — pins Bun 1.3.11. Drizzle Kit and migrations run under `bun`; no separate Node runtime needed.

### Established Patterns
- **Stack:** Next.js 16 App Router (`src/app/[locale]/...`), TypeScript strict, Tailwind 4, Biome for lint/format, next-intl for i18n. No state-management library, no data-fetching library yet — Phase 1 doesn't need one.
- **`bun` everywhere:** `bun dev`, `bun check:all` already wired. New scripts (`bun db:generate`, `bun db:migrate`, `bun db:studio`) follow this convention.
- **No `src/lib/db/` exists yet** — clean slate. Researcher proposes the layout.
- **No existing Postgres driver, no existing Drizzle install** — `package.json` currently only has Next/React/icons + tooling. Adding Drizzle + Neon driver + drizzle-kit is the first DB-layer change.

### Integration Points
- `next.config.ts` — may need adjustment if `@neondatabase/serverless` requires `serverComponentsExternalPackages` or webpack tweaks (researcher to verify; Next.js 16 may handle this automatically).
- `src/middleware.ts` — exists for next-intl locale routing. Auth middleware (Phase 2) will compose with this. Phase 1 makes no changes here.
- Vercel build pipeline — Phase 1 introduces `drizzle-kit migrate` as a build-time step. Researcher confirms the cleanest hook.

### Creative Constraints
- **Open-source from day one:** repo is public; no secret may ever land in source. All test fixtures must use placeholder values, and any local-dev shortcuts (e.g., a default DATABASE_URL pointing at Docker) must be opt-in via env.
- **Self-hostable contract:** a contributor must be able to clone, set their own `DATABASE_URL` (Neon, Dockploy, or local Docker), and have everything just work. Choices that lock users to Neon's hosted services beyond the `users_sync` schema are out of bounds.

</code_context>

<specifics>
## Specific Ideas

- User has a self-hosted Dockploy instance and considered hosting Postgres there. Decision was Neon for canonical deployment, but the **schema and Drizzle code must remain driver-portable** — a contributor running a Dockploy Postgres + pgvector image should only need to swap `DATABASE_URL` and the driver import.
- User explicitly wants Neon Auth (Better Auth–based) so that the Better Auth client SDK remains usable on the frontend if needed — Neon Auth's React components are the default, Better Auth primitives are the escape hatch.
- The 8 gray areas presented during discussion (driver, ID, auth coupling, week_bucket, migrations, pgvector column timing, local dev DB, env scope) all received explicit decisions — no "Claude's Discretion" punts on the substantive choices.

</specifics>

<deferred>
## Deferred Ideas

- **Resend / custom branded magic-link emails** — Neon Auth's built-in email provider covers v0.2. Override via webhooks lands in **v1.0 hardening** when transactional email is a user-facing brand surface.
- **Vector columns on `topics`** — pgvector extension is enabled in Phase 1; the actual vector column is added in **v0.4** when the embedding pipeline that populates it ships.
- **Anti-abuse columns / behavioral scoring** — `users.trust_score` is a single int seed in v0.2; full algorithm and IP-rate-limiting are explicitly **v2.0+** (already noted in REQUIREMENTS.md "Out of Scope").
- **Local Postgres + pgvector via Docker** — Documented as a fallback in CONTRIBUTING.md but the canonical contributor path is the Neon dev branch. Full self-host docs (backup automation, monitoring, PgBouncer config) are not in v0.x scope.
- **Drizzle Studio / DB browsing in Phase 1** — `bun db:studio` script may be added as a developer convenience but is not a Phase 1 success criterion.

</deferred>

---

*Phase: 01-database-foundation*
*Context gathered: 2026-04-27*
</content>
</invoke>