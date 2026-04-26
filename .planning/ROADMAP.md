# Roadmap: kebab.news

## Overview

kebab.news ships in six phases that build strictly on one another. Phase 1 lays the entire database schema and deployment scaffold so nothing is bolted on later. Phase 2 wires authentication so every subsequent feature can assume an authenticated user exists. Phase 3 delivers the full community experience — design system, topic board, and voting — as one coherent slice, because the UI and voting budget are inseparable from the board. Phase 4 is the platform's core engine: the Upstash Workflow pipeline that triggers Claude to produce sourced claims from primary sources. Phase 5 surfaces that output — sourced claims with traceable sources and the Bias Radar on the published article page. Phase 6 closes the loop with community discussion and AI moderation. Every v1 requirement maps to exactly one phase.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Infrastructure & Schema** - Neon/pgvector/Drizzle schema, Vercel + Upstash scaffold, Next.js project skeleton
- [ ] **Phase 2: Authentication** - Better Auth email/password signup, login, session persistence, logout
- [ ] **Phase 3: Topic Board, Voting & Design System** - Full design system, sticky header, topic board with filtering/sorting, propose modal, vote budget, weekly reset
- [ ] **Phase 4: Source Analysis Pipeline** - Upstash Workflow integration, vote-threshold trigger, Claude synthesis, objectivity filter, status progression
- [ ] **Phase 5: Fact Cards & Bias Radar** - Published article page, typed Fact Cards with primary source links, archive.org fallback, human review queue, Bias Radar RSS aggregation
- [ ] **Phase 6: Discussion & Moderation** - Community comments on published articles, AI moderation, upvotes/downvotes, editorial badges

## Phase Details

### Phase 1: Infrastructure & Schema
**Goal**: The project runs locally and on Vercel with a complete, migration-ready database schema — every table, column, and extension that any later phase requires is defined now.
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07, INFRA-08, INFRA-09
**Success Criteria** (what must be TRUE):
  1. `npm run dev` starts the Next.js App Router project with TypeScript and Tailwind without errors
  2. Drizzle migrations run against Neon and create all six tables (Users, Topics, Votes, FactCards, Sources, Articles) with correct columns and constraints
  3. pgvector extension is enabled on the Neon database (verifiable via `SELECT * FROM pg_extension WHERE extname = 'vector'`)
  4. Vercel deployment succeeds with all required env vars documented; Upstash QStash client initializes without error
  5. No secrets are hardcoded; all credentials flow through env vars with a documented `.env.example`
**Plans**: TBD

### Phase 2: Authentication
**Goal**: Community members can create accounts, verify their email, and maintain persistent sessions — the trust foundation every voting and submission feature depends on.
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. User can sign up with email and password; Better Auth creates the record and sends a verification email
  2. User who clicks the verification link has `emailVerified` set to true and trust_score seeded accordingly
  3. User can log in and the session persists across a full browser refresh without re-authentication
  4. User can log out from any page and is immediately redirected away from protected routes
**Plans**: TBD

### Phase 3: Topic Board, Voting & Design System
**Goal**: Any visitor can browse community topics; authenticated users can propose questions and spend their weekly vote budget — the full community board is live with the complete design system.
**Depends on**: Phase 2
**Requirements**: TOPIC-01, TOPIC-02, TOPIC-03, TOPIC-04, TOPIC-05, TOPIC-06, TOPIC-07, TOPIC-08, TOPIC-09, VOTE-01, VOTE-02, VOTE-03, VOTE-04, VOTE-05, VOTE-06, VOTE-07, UI-01, UI-02, UI-03, UI-04, UI-05, UI-06
**Success Criteria** (what must be TRUE):
  1. Authenticated user opens the Propose Modal, submits a topic question, and sees it appear in the board after the objectivity filter rewrites it to a neutral framing — with a toast notification confirming submission
  2. Topic list renders with In Voting / In Investigation / Published tabs and correct status badges; featured topic (highest votes in filter) appears at larger size
  3. User can sort voting topics by most votes / close to goal / newest; investigating topics show the 4-step Investigation Timeline with progress %
  4. User's weekly vote budget appears as a pip strip; upvoting costs one pip, retracting returns it; vote button is disabled with tooltip when budget is exhausted; vote pulse animation fires on click
  5. Sticky header, footer, CSS custom property token set, Inter + IBM Plex Mono type system, and i18n infrastructure are in place across all pages
**Plans**: TBD
**UI hint**: yes

### Phase 4: Source Analysis Pipeline
**Goal**: When a topic crosses its vote threshold the platform automatically starts an AI research job — sourcing, synthesis, and status updates happen entirely through Upstash Workflows, never timing out on Vercel.
**Depends on**: Phase 3
**Requirements**: PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05, PIPE-06, PIPE-07
**Success Criteria** (what must be TRUE):
  1. When a topic's vote count crosses the configurable goal threshold, an Upstash Workflow job is triggered automatically and the topic status changes from `voting` to `investigating`
  2. Admin can manually trigger a Deep-Dive on any topic from an admin interface regardless of vote count
  3. Pipeline fetches content from the topic's referenced primary source URLs/PDFs and passes it to Claude within the Upstash Workflow (no Vercel timeout risk)
  4. Claude returns structured sourced claim drafts synthesized exclusively from primary source content; no secondary reporting is used
  5. Topic status progresses through `voting → investigating → done` and is visible on the board in real time on next page load
**Plans**: TBD

### Phase 5: Fact Cards & Bias Radar
**Goal**: Published topics have a full article page — every AI-generated claim is traceable to a primary source, every source has an archive.org fallback, and the Bias Radar shows how different outlets covered the story.
**Depends on**: Phase 4
**Requirements**: FACT-01, FACT-02, FACT-03, FACT-04, FACT-05, FACT-06, FACT-07, FACT-08, FACT-09, FACT-10, BIAS-01, BIAS-02, BIAS-03, BIAS-04, BIAS-05
**Success Criteria** (what must be TRUE):
  1. AI-generated Fact Cards enter a human review queue before publishing; reviewer can approve or reject; only approved cards appear on the public article page
  2. Published article page shows all Fact Cards in sequence with correct type labels (claim / evidence / context / openq), ScienceStamp badge matching confidence level, and a large figure layout for evidence cards with key statistics
  3. Every Fact Card's source citation is expandable inline and shows org, document name, date, file size, a working primary URL, and a working archive.org fallback URL
  4. The Download Block on the article page lists all primary sources for individual download and offers a ZIP of all sources
  5. Bias Radar appears as a collapsible section on the article page; it shows grouped headlines from left / public broadcaster / right-leaning outlets with a tone meter bar, article count per group, and the explanatory note about perspective visibility
**Plans**: TBD
**UI hint**: yes

### Phase 6: Discussion & Moderation
**Goal**: Community members can submit corrections and comments on published articles; the AI moderator flags unsourced inflammatory content; editorial picks are surfaced — the feedback loop between readers and the investigation is live.
**Depends on**: Phase 5
**Requirements**: DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, DISC-06, DISC-07
**Success Criteria** (what must be TRUE):
  1. Authenticated user can submit a comment on a published article with optional primary source URL and optional reference to a specific Fact Card
  2. Comments containing inflammatory language without a source citation are flagged by the Claude moderator and display the "KI-Moderator: ohne Quelle" warning badge
  3. Comment list can be filtered to show only comments that include a source citation
  4. Editorial team can mark a comment as "Redaktion übernommen" and that badge appears on the comment
  5. Users can upvote and downvote comments; vote counts are visible
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Infrastructure & Schema | 0/TBD | Not started | - |
| 2. Authentication | 0/TBD | Not started | - |
| 3. Topic Board, Voting & Design System | 0/TBD | Not started | - |
| 4. Source Analysis Pipeline | 0/TBD | Not started | - |
| 5. Fact Cards & Bias Radar | 0/TBD | Not started | - |
| 6. Discussion & Moderation | 0/TBD | Not started | - |
