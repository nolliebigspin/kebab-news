# Phase 1: Database Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 01-database-foundation
**Areas discussed:** Hosting & driver, Authentication coupling, ID strategy, week_bucket format, Migration workflow, pgvector column timing, Local dev DB, .env.example scope, Email delivery, Frontend auth client

---

## Hosting (Canonical Deployment)

| Option | Description | Selected |
|--------|-------------|----------|
| Neon Postgres (cloud) | Hosted Postgres, branching, built-in pooler, free tier covers v0.2–v0.5 | ✓ |
| Self-hosted Postgres on Dockploy | User's own infra, no third-party dependency, sunk cost | |

**User's choice:** Neon, after weighing tradeoffs.
**Notes:** User raised self-hosted Dockploy as an option mid-discussion. Tradeoff analysis covered: pgvector availability (both fine), Edge runtime (Neon wins via HTTP driver), Vercel connection pooling (Neon wins built-in PgBouncer), branching for PR previews (Neon wins out-of-box), self-hostable contract (driver-agnostic Drizzle code preserves contributor freedom either way), operational burden (Neon wins zero-ops). Decision: Neon as canonical deployment, schema/driver stays portable so a Dockploy or local Docker Postgres remains a viable contributor path.

---

## Driver

| Option | Description | Selected |
|--------|-------------|----------|
| @neondatabase/serverless | HTTP/WebSocket, Edge-runtime safe, built-in pooling | ✓ |
| postgres (porsager) | TCP, Node-only, simpler API | |
| pg (node-postgres) | TCP, Node-only, oldest/most-tested | |

**User's choice:** Recommendation accepted (`@neondatabase/serverless`).
**Notes:** Future-proofs v0.4 pipeline if any worker code runs on Vercel Edge. Drizzle's API is driver-agnostic — swap is mechanical if ever needed. Known Better Auth × Neon serverless v1.0 tagged-template issue flagged for researcher to verify and pin compatible versions.

---

## Authentication Coupling

| Option | Description | Selected |
|--------|-------------|----------|
| Vanilla Better Auth — define users/sessions/etc. ourselves | Full control, more schema to maintain | |
| Separate `app_users` from Better Auth's `user` table | Two-table identity, FK joins | |
| Defer `users` table to Phase 2 entirely | Phase 1 builds only topics + votes | |
| **Neon Auth (Better Auth–based) with `neon_auth.users_sync`** | Neon manages auth schema; app `public.users` is profile-only with FK to `users_sync` | ✓ |

**User's choice:** Neon Auth — explicitly requested. Better Auth client SDK remains usable on frontend.
**Notes:** This is the highest-impact decision in Phase 1. Neon Auth auto-creates `neon_auth.users_sync` and Drizzle ships a first-class helper for typing it. Our `public.users` becomes profile-only (`id` FK + `trust_score` + `created_at`) — identity, sessions, and magic-link tokens live entirely in `neon_auth`. This shrinks Phase 2 dramatically: magic link is mostly Neon Auth's pre-built flow plus a trust_score increment hook.

---

## Email Delivery for Magic Link

| Option | Description | Selected |
|--------|-------------|----------|
| Neon Auth's built-in email provider | Zero config, works out of box for v0.2 | ✓ |
| Resend webhook override | Branded transactional email, more setup | |

**User's choice:** Recommendation accepted — Neon Auth built-in for v0.2, Resend deferred to v1.0 hardening.
**Notes:** Magic-link emails aren't user-facing branded touchpoints during v0.x. Override path via webhooks is documented and unblocked for v1.0.

---

## Frontend Auth Client

| Option | Description | Selected |
|--------|-------------|----------|
| @neondatabase/auth/react components | Pre-built sign-in/out UI, automatic theming | ✓ |
| Better Auth client primitives directly | Custom UI, more code to write | |

**User's choice:** Recommendation accepted — Neon Auth React components for Phase 2; Better Auth primitives remain available as escape hatch.

---

## ID Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| UUID v4 via gen_random_uuid() | Postgres-native, matches Neon Auth user IDs, no extra deps | ✓ |
| cuid2 | Shorter URLs, sortable, requires runtime lib | |
| nanoid | Shorter URLs, requires runtime lib | |
| Serial int | Smallest, but exposes count and locks out distributed inserts | |

**User's choice:** Recommendation accepted.
**Notes:** UUID matches Neon Auth's user ID format — clean foreign-key joins from `public.users.id` to `neon_auth.users_sync.id`. No runtime dependency.

---

## week_bucket Format

| Option | Description | Selected |
|--------|-------------|----------|
| ISO week string ("2026-W17") | Human-readable, monotonic, timezone-unambiguous | ✓ |
| Monday-anchored date | Native date type, range queries simple | |
| Year-week int (202617) | Compact, fast comparisons, less readable | |

**User's choice:** Recommendation accepted — ISO week string.
**Notes:** Phase 5 weekly-budget reset becomes a string equality check. `date-fns` `getISOWeek` + year handles formatting.

---

## Migration Workflow

| Option | Description | Selected |
|--------|-------------|----------|
| drizzle-kit generate + migrate | Versioned SQL files committed to repo, Vercel-build runnable | ✓ |
| drizzle-kit push only | No files, dev-friendly, risky for OSS / production | |

**User's choice:** Recommendation accepted — `generate + migrate` for production, `push` allowed only for local dev iteration.
**Notes:** OSS contributor reproducibility and audit trail demand versioned migrations. Vercel build runs `drizzle-kit migrate` and fails loudly on error.

---

## pgvector Column Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Enable extension only, no vector columns | YAGNI-clean, columns added in v0.4 when used | ✓ |
| Enable extension + add placeholder vector column on topics | Exercises the extension end-to-end now | |

**User's choice:** Recommendation accepted — extension only.
**Notes:** Phase 1 success criterion just requires `SELECT * FROM pg_extension WHERE extname = 'vector'` to return a row. Adding a vector column now would force a NULL-handling story we don't need.

---

## Local Dev Database

| Option | Description | Selected |
|--------|-------------|----------|
| Neon dev branch (cloud) — default | Zero local setup, free, PR-preview branches automatic | ✓ |
| Local Docker Postgres + pgvector image — documented fallback | Offline / airgapped contributors | ✓ (as fallback) |
| Neon-Local proxy | Adds a layer; not worth complexity for v0.x | |

**User's choice:** Recommendation accepted — Neon dev branch as default, Docker as documented fallback.
**Notes:** CONTRIBUTING.md gets a "Local Postgres alternative" section.

---

## .env.example Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal (DB + Upstash + Neon Auth only) | Just what Phase 1/2 needs | |
| Forward-looking, milestone-tagged comments | All vars present so contributors see full surface; activated as milestones land | ✓ |

**User's choice:** Recommendation accepted.
**Notes:** `.env.example` already exists at repo root; Phase 1 augments rather than replaces. Milestone tags in comments indicate when each var is activated.

---

## Claude's Discretion

- File and folder layout under `src/lib/db/` and `src/lib/auth/` — researcher and planner pick the cleanest Next.js 16 App Router pattern.
- Choice of env-validation library (Zod, Valibot, hand-rolled) — pick lightest viable option, prefer no new dependency if feasible.
- Exact migration directory location.
- Whether `drizzle.config.ts` includes the `neon_auth` schema in `schemaFilter` (depends on Neon Auth helper requirements — researcher confirms).

---

## Deferred Ideas

- Resend / custom branded magic-link emails → v1.0 hardening
- Vector columns on `topics` → v0.4 (when embedding pipeline ships)
- Full anti-abuse / behavioral trust_score algorithm → v2.0+ (already in REQUIREMENTS.md Out of Scope)
- Full self-host docs (backup automation, PgBouncer config, monitoring) → out of v0.x scope
- Drizzle Studio convenience script → optional polish, not a Phase 1 success criterion
</content>
</invoke>