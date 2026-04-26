# kebab.news

## What This Is

kebab.news is an open-source, community-driven platform for traceable, verifiable research. The community votes on which questions get investigated (infrastructure spending, international conflicts, environmental data), and the platform produces AI-powered, human-verified source analyses built strictly on primary sources — government PDFs, scientific papers, raw data — with every claim linked directly to its source.

kebab.news is not a news platform. It is a verification interface for information. We do not claim neutrality — we make every selection decision visible so users can follow along, question it, and verify independently.

**Motto:** "We don't tell you what to think. We show you where the information comes from."

## Core Value

Every published sourced claim must be traceable to a verifiable primary source that any user can access in a single click — without this guarantee, the platform has no reason to exist.

## Current Milestone: v1.0 Foundation & Landing

**Goal:** Scaffold the project and ship a public landing page that teases the kebab.news platform.

**Target features:**
- Bun via mise.toml as the runtime (documented so contributors know mise is required)
- Next.js 16 App Router + TypeScript + Biome + Tailwind CSS + next-intl project skeleton
- Design system tokens from .claude/design wired into Tailwind config (CSS vars, fonts)
- Landing page: logo, platform vision/motto, GitHub link — teaser only, no app UI

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Topic Board: landing page where users submit questions and upvote others
- [ ] Bias Radar: aggregates RSS headlines across left/right/public-broadcaster outlets to visualize the reporting gap per topic
- [ ] Fact Cards: structured output where every claim links to a verifiable primary source (with archive.org fallback)
- [ ] Deep-Dive pipeline: when a topic crosses a vote threshold, an Upstash Workflow job triggers Claude to research and synthesize Fact Cards from primary sources
- [ ] Objectivity Filter: prompt-engineering layer that reframes biased/emotional topic submissions into neutral, researchable inquiries before storing
- [ ] Authentication: Better Auth for community member accounts and voting rights
- [ ] Human review queue: AI-generated Fact Cards are queued for community verification before publishing
- [ ] Trust Score schema: `trust_score` column on Users with basic seeding rules (verified email, account age) — full algorithm deferred
- [ ] Base schema: Users, Topics, Votes, FactCards, Sources in Drizzle/Neon with pgvector extension enabled

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
*Last updated: 2026-04-23 after milestone v1.0 start*
