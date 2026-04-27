---
phase: 1
slug: database-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 2.x (Wave 0 installs — `bun add -D vitest @vitest/coverage-v8`) |
| **Config file** | `vitest.config.ts` (Wave 0) |
| **Quick run command** | `bun test:db` (alias: `vitest run tests/db --reporter=verbose`) |
| **Full suite command** | `bun test` (alias: `vitest run`) |
| **SQL probe runner** | `bun run scripts/probe-pgvector.ts` |
| **Estimated runtime** | quick ~5s · full ~30s |

**Why vitest, not `bun test`:** wider Drizzle/Postgres ecosystem helpers, better migration-idempotency examples, negligible perf difference for Phase 1's smoke-test scope.

---

## Sampling Rate

- **After every task commit:** `bun check:all && bun test:db` (~10s)
- **After every plan wave:** `bun test` (~30s) + `bun run scripts/probe-pgvector.ts`
- **Before `/gsd-verify-work`:** full suite green + `bun run build` (Vercel-equivalent migration run)
- **Max feedback latency:** ~10s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-W0-01 | 0 | 0 | Wave 0 | — | dev tooling installed | infra | `bunx vitest --version` | ❌ W0 | ⬜ pending |
| 1-W0-02 | 0 | 0 | Wave 0 | — | test fixtures present | infra | `test -f tests/db/setup.ts` | ❌ W0 | ⬜ pending |
| 1-01-01 | 01 | 1 | INFRA-09 | T-1-01 | env validation rejects missing required vars | unit | `bun test tests/env.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | INFRA-09 | T-1-02 | `.env.example` covers every server var | unit | `bun test tests/env.example.test.ts` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | INFRA-07 | — | pgvector extension enabled | smoke | `bun run scripts/probe-pgvector.ts` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 1 | INFRA-09 | — | `bun db:migrate` is idempotent | integration | `bun run scripts/probe-migration-idempotent.sh` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 2 | INFRA-01 | — | `users` table with `trust_score int default 0` and FK to `neon_auth.users_sync` | unit | `bun test:db tests/db/users.schema.test.ts` | ❌ W0 | ⬜ pending |
| 1-03-02 | 03 | 2 | INFRA-02 | — | `topics` table with all columns + `topic_status` enum | unit | `bun test:db tests/db/topics.schema.test.ts` | ❌ W0 | ⬜ pending |
| 1-03-03 | 03 | 2 | INFRA-03 | — | `votes` composite unique rejects duplicate `(user_id, topic_id, week_bucket)` | integration | `bun test:db tests/db/votes.unique.test.ts` | ❌ W0 | ⬜ pending |
| 1-04-01 | 04 | 2 | INFRA-08 | — | QStash client constructs without error on placeholder token | unit | `bun test tests/qstash.init.test.ts` | ❌ W0 | ⬜ pending |
| 1-05-01 | 05 | 3 | All | — | `bun dev` starts without DB error | smoke | `timeout 10 bun dev | grep -q "Ready"` | manual | ⬜ pending |
| 1-05-02 | 05 | 3 | All | — | `bun run build` runs migrations + builds | smoke | `bun run build` | manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `bun add -D vitest @vitest/coverage-v8` + `vitest.config.ts` — test framework
- [ ] `tests/db/setup.ts` — shared fixtures (truncate tables, seed `users_sync` for FK satisfaction)
- [ ] `tests/db/users.schema.test.ts` — INFRA-01 stub
- [ ] `tests/db/topics.schema.test.ts` — INFRA-02 stub
- [ ] `tests/db/votes.unique.test.ts` — INFRA-03 stub
- [ ] `scripts/probe-pgvector.ts` — INFRA-07 probe
- [ ] `scripts/probe-migration-idempotent.sh` — INFRA-09 idempotency probe
- [ ] `tests/env.test.ts` — INFRA-09 env-validation behavior
- [ ] `tests/env.example.test.ts` — INFRA-09 `.env.example` coverage
- [ ] `tests/qstash.init.test.ts` — INFRA-08 QStash construction
- [ ] `package.json` `test`, `test:db` script aliases
- [ ] `.github/workflows/test.yml` — CI runs `bun check:all && bun test` on PR (optional, recommended)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Vercel deploy succeeds with all env vars wired | INFRA-08 | Requires Vercel project + Neon Auth integration enabled | Push branch → confirm preview deploy green; check build log for `db:migrate` step |
| Neon dev branch onboarding (CONTRIBUTING.md path) | INFRA-08 / dev UX | Requires fresh Neon account walkthrough | Follow CONTRIBUTING.md as a new contributor; confirm `bun dev` works in <5min |
| Docker Postgres + pgvector fallback works | local-dev (CONTEXT D-03) | Requires Docker daemon and the documented `pgvector/pgvector:pg17` image | Run `docker compose up db` per CONTRIBUTING.md, `bun db:migrate`, `bun dev` connects |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags (CI must terminate)
- [ ] Feedback latency < 10s for per-task gate
- [ ] `nyquist_compliant: true` set in frontmatter (after Wave 0 closes)

**Approval:** pending
</content>
</invoke>
