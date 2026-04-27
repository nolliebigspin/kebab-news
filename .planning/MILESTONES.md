# Milestones: kebab.news

The path to the full community launch (v1.0) is split into shippable 0.x releases. Each 0.x milestone is independently usable; v1.0 is reserved for the complete public launch.

---

## v0.1 — Foundation & Landing

**Status:** Completed
**Started:** 2026-04-23
**Completed:** 2026-04-27 (retrospectively closed)

**Goal:** Project scaffold + public landing page that teases the kebab.news platform.

**Phases:** 0 (Foundation, retrospective)

**Requirements:** SETUP-01–04, LAND-01–04

**Delivered:**
- Bun runtime via mise.toml; Next.js 16 App Router + TypeScript + Tailwind 4 + Biome 2 + next-intl 4
- Design tokens (OKLCH) + Inter / IBM Plex Mono wired into globals.css
- Landing page: Header, Hero, Banner, Principles, HowItWorks, TrustStatement, Footer
- EN + DE translations, default locale `de`
- SEO meta, sitemap, robots
- `.env.example` skeleton for the full later stack (Neon, Upstash, Better Auth, Anthropic)

---

## v0.2 — Topic Schema & Magic-Link Auth

**Status:** Next
**Started:** —
**Completed:** —

**Goal:** Backend foundation that v0.3 strictly needs — three tables (users, topics, votes) and passwordless auth.

**Phases:** 1 (Database Foundation), 2 (Magic-Link Auth)

**Requirements:** INFRA-01, INFRA-02, INFRA-03, INFRA-07, INFRA-08, INFRA-09, AUTH-01, AUTH-03, AUTH-04, VOTE-07

**Deliberately deferred to later milestones:**
- FactCards, Sources, Articles tables → v0.4 (added when pipeline lands)
- Comments table → v0.6
- Email verification UI → v1.0 hardening (Magic Link covers v0.x trust needs)

---

## v0.3 — Topic Board MVP

**Status:** Planned
**Started:** —
**Completed:** —

**Goal:** Public-facing MVP — community submits topics, Claude rewrites them neutrally on submit, others vote with weekly budget. The MVP that makes the idea visibly distinct from HN/Reddit.

**Phases:** 3 (Topic Board UI), 4 (Propose Modal + Objectivity Filter), 5 (Voting & Budget)

**Requirements:** TOPIC-01, TOPIC-02, TOPIC-03, TOPIC-04*, TOPIC-05, TOPIC-06, TOPIC-07, TOPIC-09, VOTE-01, VOTE-02, VOTE-03, VOTE-04, VOTE-05, PIPE-05, UI-01, UI-02, UI-03, UI-04, UI-05, UI-06

*TOPIC-04 narrowed for v0.3: only the "In Voting" tab is active. "In Investigation" and "Published" tabs are deferred until their content exists (v0.4 / v0.5).

**Out of scope for v0.3:**
- Investigation Timeline (TOPIC-08) — needs a pipeline first
- Vote-threshold pipeline trigger (VOTE-06) — pipeline doesn't exist yet
- Featured topic logic stays simple (highest votes, no editorial pin)

---

## v0.4 — Source Analysis Pipeline

**Status:** Planned
**Started:** —
**Completed:** —

**Goal:** Vote-threshold-triggered Upstash Workflow runs Claude synthesis from primary sources; status progression voting → investigating → done.

**Phases:** 6 (Schema extension + Upstash wiring), 7 (Pipeline worker), 8 (Admin trigger UI)

**Requirements:** INFRA-04, INFRA-05, INFRA-06, PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-06, PIPE-07, VOTE-06, TOPIC-08

**Note:** Pipeline produces FactCard drafts in DB but doesn't yet render a public article page — that ships in v0.5. The split keeps pipeline correctness work decoupled from display polish.

---

## v0.5 — Fact Cards & Bias Radar

**Status:** Planned
**Started:** —
**Completed:** —

**Goal:** Public article pages with reviewed Fact Cards, primary source links + archive.org fallback, Bias Radar showing perspective spread.

**Phases:** 9 (Human review queue), 10 (Article page + Fact Cards), 11 (Bias Radar RSS)

**Requirements:** FACT-01, FACT-02, FACT-03, FACT-04, FACT-05, FACT-06, FACT-07, FACT-08, FACT-09, FACT-10, BIAS-01, BIAS-02, BIAS-03, BIAS-04, BIAS-05

---

## v0.6 — Discussion & Moderation

**Status:** Planned
**Started:** —
**Completed:** —

**Goal:** Community comments + corrections on published articles, Claude moderator flags unsourced inflammatory content, editorial badges.

**Phases:** 12 (Comments schema + UI), 13 (AI moderation + filtering), 14 (Editorial picks + comment voting)

**Requirements:** DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, DISC-06, DISC-07

---

## v1.0 — Community Launch

**Status:** Reserved
**Started:** —
**Completed:** —

**Goal:** Full public launch to community — maturity milestone, not a feature wave. Marketing, docs, onboarding, hardening, performance, AUTH-02 (email verification), notifications.

**Phases:** TBD (defined when v0.6 is closed)

**Requirements:** AUTH-02, NOTF-01, NOTF-02 + hardening / docs items defined at milestone start

---

*Created: 2026-04-23*
*Restructured into 0.x releases: 2026-04-27*
