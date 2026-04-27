# kebab.news

## What This Is

kebab.news is an open-source, community-driven platform for traceable, verifiable research. The community votes on which questions get investigated (infrastructure spending, international conflicts, environmental data), and the platform produces AI-powered, human-verified source analyses built strictly on primary sources — government PDFs, scientific papers, raw data — with every claim linked directly to its source.

kebab.news is not a news platform. It is a verification interface for information. We do not claim neutrality — we make every selection decision visible so users can follow along, question it, and verify independently.

**Motto:** "We don't tell you what to think. We show you where the information comes from."

## Core Value

Every published sourced claim must be traceable to a verifiable primary source that any user can access in a single click — without this guarantee, the platform has no reason to exist.

## Versioning Model

The road to v1.0 is split into shippable 0.x releases. **v1.0 is reserved for the full public community launch** — explicitly a maturity milestone, not another feature wave.

- **v0.1** Foundation & Landing — Completed (2026-04-27)
- **v0.2** Topic Schema & Magic-Link Auth — Active
- **v0.3** Topic Board MVP (the public-facing MVP) — Planned
- **v0.4** Source Analysis Pipeline — Planned
- **v0.5** Fact Cards & Bias Radar — Planned
- **v0.6** Discussion & Moderation — Planned
- **v1.0** Community Launch — Reserved

## Current Milestone: v0.2 — Topic Schema & Magic-Link Auth

**Goal:** Backend foundation that v0.3 strictly needs — Drizzle schema (users, topics, votes only) on Neon with pgvector, plus passwordless Magic-Link authentication via Better Auth.

**Target features:**
- Drizzle ORM connected to Neon Postgres with three tables: users (with trust_score), topics, votes
- pgvector extension enabled from day one (semantic search lands in v0.4)
- Better Auth Magic Link plugin (passwordless email) — no password UI, no verify-email UI in scope
- Vercel + Upstash environment scaffold (env vars only; QStash not yet invoked)

## MVP Definition (v0.3)

The MVP that makes the idea visibly distinct from HN/Reddit:
1. Authenticated user opens Propose Modal, types a topic question
2. Claude rewrites it neutrally on submit (Objectivity Filter — synchronous, sub-30s)
3. User sees both original and neutral rewrite, confirms or edits before storage
4. Other users vote with a 10-vote weekly budget; pip strip shows remaining votes
5. Topics sortable: most votes / close to goal / newest

If any of those four steps doesn't work end-to-end, v0.3 isn't done.

## Requirements

### Validated (v0.1)

- [x] SETUP-01..04: Bun + mise + Next.js 16 + TS + Tailwind + Biome + next-intl scaffold
- [x] LAND-01..04: Landing with wordmark, vision/motto, GitHub link, design system

### Active (v0.2 → v0.3)

**v0.2 (next):**
- [ ] Drizzle schema: users (with trust_score), topics, votes — pgvector enabled
- [ ] Better Auth Magic Link: passwordless login, session persistence, logout
- [ ] Vercel + Upstash env scaffold

**v0.3 (MVP):**
- [ ] Topic Board UI: status tabs (only "In Voting" active), sorting, featured topic, sticky header
- [ ] Propose Modal + Objectivity Filter: Claude rewrites submissions neutrally, user confirms before save
- [ ] Voting + weekly 10-vote budget: pip strip, retract, derived weekly reset

### Backlog (v0.4+)

- [ ] Source Analysis Pipeline (v0.4): Upstash Workflows, vote-threshold trigger, Claude synthesis from primary sources, FactCards / Sources / Articles tables added in this milestone
- [ ] Fact Cards & Bias Radar (v0.5): public article pages, human review queue, archive.org fallback, RSS-aggregated perspective grouping
- [ ] Discussion & Moderation (v0.6): comments, AI moderator, editorial picks, comment voting

### Out of Scope

- Full anti-abuse system (IP checks, behavioral scoring) — deferred to post-MVP; schema seeds trust_score only
- Self-hosted source mirroring (PDFs in object storage) — archive.org fallback sufficient for MVP; link rot is a v2 problem
- Mobile app — web-first
- Real-time features (WebSockets, live vote counts) — not needed for MVP
- Multi-language support — English first

## Context

- **Stack is fixed:** Next.js (App Router) + TypeScript + Tailwind CSS, Neon (Postgres) + Drizzle ORM (pgvector required), Upstash Workflows/QStash for background jobs, Better Auth, Vercel deployment
- **AI model:** Claude API (Anthropic) for research synthesis and the objectivity filter prompt layer
- **Serverless constraint:** Vercel's 30-second timeout means any AI research task must be offloaded to Upstash Workflows; the Next.js → Upstash handshake is a core architectural concern
- **RSS headline sourcing:** Bias Radar pulls from curated RSS feeds (left / right / public broadcaster outlets) — no scraping, no paid news APIs for MVP
- **Deep-Dive trigger:** Automatic — when a topic crosses a configurable vote threshold, an Upstash job starts the pipeline
- **Fact Card authorship:** AI-generated (Claude) + human review queue before publishing; not auto-published
- **Open source:** MIT license, public repo from day one
- **Aesthetic:** Professional, scientific, community-focused — Blue/Slate/White color palette

## Constraints

- **Tech stack**: Fully locked — Next.js App Router, Drizzle/Neon/pgvector, Upstash Workflows, Better Auth, Vercel. No substitutions.
- **Serverless timeout**: Vercel 30s limit — all long-running AI jobs must go through Upstash QStash/Workflows
- **Primary sources only**: AI synthesis must be constrained to cited primary sources; no summarizing secondary reporting
- **pgvector**: Must be enabled from day one on the Neon schema (semantic search is a near-term roadmap item)
- **Open source**: Architecture and credentials management must be self-hostable from the start — no hardcoded secrets, proper env var patterns

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Claude API for AI | Strong at structured prompts and source citation; aligns with objectivity-first mission | — Pending |
| RSS over News APIs | No cost, no rate limits, works day one; News API is a v2 upgrade path | — Pending |
| Schema-only trust scores | Anti-abuse algorithm is a research problem; unblock voting without shipping half-baked logic | — Pending |
| Archive.org fallback | Free link-rot mitigation with zero infrastructure overhead for MVP | — Pending |
| Vote-threshold triggers | Automatic pipeline start removes editorial gatekeeping; aligns with community-driven mission | — Pending |
| AI + human review | AI speed + human credibility check before publishing; prevents hallucinated sources going live | — Pending |
| MIT public repo from day one | Community trust requires transparency; contributors can self-host | — Pending |
| 0.x versioning before v1.0 | v1.0 reserved for full community launch; ship working slices to validate before committing to the full vision | 2026-04-27 |
| Magic Link over full Better Auth in MVP | Passwordless covers the trust needs of voting; no password / verify-email UI to maintain in v0.x; full email-verify lands in v1.0 hardening | 2026-04-27 |
| Schema right-sized per milestone | Don't pre-build FactCards / Sources / Articles tables in v0.2 — add them in v0.4 via migration when the pipeline actually consumes them. Avoids YAGNI on schema | 2026-04-27 |
| Objectivity Filter in MVP, not pipeline-phase | Claude-rewrites-on-submit is the visible differentiator from HN/Reddit; without it, v0.3 board feels generic | 2026-04-27 |
| Phase 0 closed retrospectively | Foundation & Landing was already shipped to `main` before being formally tracked; closing it makes the validated state explicit | 2026-04-27 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-27 — restructured into 0.x milestones; v0.1 (Foundation & Landing) closed retrospectively; v0.2 active*
