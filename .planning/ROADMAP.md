# Roadmap: kebab.news

## Overview

kebab.news ships in shippable 0.x releases on the way to v1.0 (full community launch). Each milestone is independently usable. The MVP that makes the idea visibly distinct from existing platforms is **v0.3 — Topic Board MVP**: community-submitted topics that Claude rewrites neutrally on submit, with weekly-budget voting. AI synthesis pipeline and public Fact Cards arrive after v0.3 has had time to validate the core community loop.

**Phase Numbering:**
- Integer phases (0, 1, 2, …) — planned phases in milestone order
- Decimal phases (e.g. 2.1) — urgent insertions (marked INSERTED), placed in numeric order between integers

---

## Milestone Map

| Milestone | Phases | Theme |
|-----------|--------|-------|
| v0.1 | 0 | Foundation & Landing (Completed) |
| v0.2 | 1, 2 | Topic Schema & Magic-Link Auth |
| v0.3 | 3, 4, 5 | Topic Board MVP (the public-facing MVP) |
| v0.4 | 6, 7, 8 | Source Analysis Pipeline |
| v0.5 | 9, 10, 11 | Fact Cards & Bias Radar |
| v0.6 | 12, 13, 14 | Discussion & Moderation |
| v1.0 | TBD | Community Launch (hardening, marketing, onboarding) |

---

## Phase Details

### Phase 0: Foundation & Landing — **Completed**
**Milestone:** v0.1
**Goal:** Project scaffold + public landing page that teases the kebab.news platform.
**Depends on:** Nothing
**Requirements:** SETUP-01, SETUP-02, SETUP-03, SETUP-04, LAND-01, LAND-02, LAND-03, LAND-04
**Success Criteria** (verified TRUE in current `main`):
  1. `bun dev` starts the Next.js 16 App Router project with TypeScript, Tailwind 4, and next-intl without errors
  2. mise.toml pins Bun and is documented in README/CONTRIBUTING
  3. Landing renders Header, Hero, Banner, Principles, HowItWorks, TrustStatement, Footer
  4. Wordmark uses the design system (ink + accent teal); GitHub link present
  5. EN + DE translations work; default locale is `de`; language switcher functional
  6. Inter and IBM Plex Mono fonts wired; OKLCH design tokens (`--ink`, `--accent`, `--bg`, `--warn`, `--left`, `--right`) available in globals.css
  7. SEO meta, sitemap.ts, robots.ts present
**Plans:** Retrospectively closed — no PLAN.md required
**UI hint:** delivered

---

### Phase 1: Database Foundation
**Milestone:** v0.2
**Goal:** Drizzle ORM connected to Neon Postgres with three tables (users, topics, votes) + pgvector enabled. Right-sized — no FactCards / Sources / Articles tables yet.
**Depends on:** Phase 0
**Requirements:** INFRA-01, INFRA-02, INFRA-03, INFRA-07, INFRA-08, INFRA-09
**Success Criteria** (what must be TRUE):
  1. Drizzle migrations run against Neon and create three tables: `users` (with `trust_score` int default 0), `topics` (id, title, original_submission, neutral_rewrite, status enum {voting, investigating, done}, vote_count, created_by, created_at), `votes` (user_id, topic_id, week_bucket — unique composite key)
  2. pgvector extension enabled on Neon (`SELECT * FROM pg_extension WHERE extname = 'vector'` returns a row)
  3. `bun dev` connects to the local DATABASE_URL without errors; migrations idempotent
  4. `.env.example` lists every required env var; no hardcoded secrets in source
  5. Vercel deployment succeeds with all env vars wired; Upstash QStash client initializes (env present, not yet invoked)
**Plans:** TBD

---

### Phase 2: Magic-Link Authentication
**Milestone:** v0.2
**Goal:** Passwordless authentication via Better Auth's Magic Link plugin — minimum trust foundation for v0.3 voting.
**Depends on:** Phase 1
**Requirements:** AUTH-01, AUTH-03, AUTH-04, VOTE-07
**Success Criteria** (what must be TRUE):
  1. User submits email → Better Auth sends a Magic Link → clicking it creates a session
  2. Session persists across full browser refresh
  3. User can log out from any page; protected routes redirect after logout
  4. trust_score column exists on users; +1 increment fires on first successful Magic-Link login
  5. No password UI, no verify-email UI, no account-settings page in scope
**Plans:** TBD

---

### Phase 3: Topic Board UI
**Milestone:** v0.3
**Goal:** Public-facing topic board renders with status tabs, sortable list, featured topic, sticky header — read-only view (propose + vote actions land in Phase 4 + 5).
**Depends on:** Phase 2
**Requirements:** TOPIC-04, TOPIC-05, TOPIC-06, TOPIC-07, TOPIC-09, UI-01, UI-02, UI-03, UI-04, UI-06
**Success Criteria** (what must be TRUE):
  1. Topic board page renders a list of topics with the **In Voting** tab active; "In Investigation" and "Published" tabs are scaffolded but disabled with tooltip "Available in v0.4 / v0.5"
  2. User can sort voting topics by: most votes / close to goal / newest
  3. Featured topic (highest votes in current filter) renders at larger size
  4. Each topic card shows: title (neutral_rewrite), Voting status badge, vote count, submission timestamp
  5. Sticky header includes: wordmark, navigation, vote-budget pip strip placeholder (live in Phase 5), "Propose Topic" button (opens modal in Phase 4)
  6. EN + DE i18n strings present for board copy (next-intl)
**Plans:** TBD
**UI hint:** yes

---

### Phase 4: Propose Modal + Objectivity Filter
**Milestone:** v0.3
**Goal:** The signature differentiator — submit a topic, Claude rewrites it neutrally on the spot, user sees both versions and confirms before storage.
**Depends on:** Phase 3
**Requirements:** TOPIC-01, TOPIC-02, TOPIC-03, PIPE-05, UI-05
**Success Criteria** (what must be TRUE):
  1. Authenticated user opens Propose Modal, types a question, optionally adds category / rationale / source URLs
  2. On submit, the form calls a server action that runs Claude with the Objectivity Filter prompt; response (neutral rewrite) returns within Vercel's 30s timeout (no Upstash needed)
  3. UI shows both `original_submission` and `neutral_rewrite` side-by-side; user confirms or edits before final save
  4. On confirm, topic is stored with status `voting` and appears in the Phase 3 board
  5. Toast notification fires confirming submission
  6. ANTHROPIC_API_KEY is read from env; objectivity prompt lives in a dedicated module (`src/lib/ai/objectivity.ts` or similar) for later reuse
**Plans:** TBD
**UI hint:** yes

---

### Phase 5: Voting & Weekly Budget
**Milestone:** v0.3
**Goal:** Authenticated users spend a weekly vote budget on topics; live pip strip, retract support, automatic reset.
**Depends on:** Phase 4
**Requirements:** VOTE-01, VOTE-02, VOTE-03, VOTE-04, VOTE-05
**Success Criteria** (what must be TRUE):
  1. Each user starts each ISO-week with 10 votes; current `week_bucket` is computed at vote time
  2. Upvote on a topic costs 1 vote; vote_count increments; pip strip updates
  3. Retract returns the vote to budget; vote_count decrements; idempotent (no double-retract)
  4. Vote button shows pulse animation on click; disabled with tooltip when budget = 0
  5. Weekly reset happens automatically — implemented as derived from `week_bucket`, no cron job needed (votes from prior weeks remain in DB but don't count against current budget)
**Plans:** TBD
**UI hint:** yes

---

### Phase 6: Schema Extension + Upstash Wiring
**Milestone:** v0.4
**Goal:** Add the three tables that the AI pipeline produces output into — fact_cards, sources, articles — and verify the Upstash QStash client can dispatch a no-op job.
**Depends on:** Phase 5
**Requirements:** INFRA-04, INFRA-05, INFRA-06
**Success Criteria** (what must be TRUE):
  1. Drizzle migration adds `fact_cards`, `sources`, `articles` tables; existing data unaffected
  2. Schema includes pgvector embedding columns where roadmap calls for them (sources, fact_cards)
  3. A test endpoint dispatches a QStash message that triggers a stub worker; worker logs receipt
  4. Worker invocation is verified end-to-end on Vercel (not just local)
**Plans:** TBD

---

### Phase 7: Pipeline Worker (Vote-Threshold + Claude Synthesis)
**Milestone:** v0.4
**Goal:** Topic crossing vote threshold automatically kicks off an Upstash Workflow that fetches primary sources, calls Claude with the source-constraint prompt, and produces FactCard drafts.
**Depends on:** Phase 6
**Requirements:** PIPE-01, PIPE-03, PIPE-04, PIPE-06, PIPE-07, VOTE-06, TOPIC-08
**Success Criteria** (what must be TRUE):
  1. Per-topic configurable `vote_goal` exists; vote increment that crosses the threshold dispatches a QStash job exactly once (idempotent)
  2. Workflow fetches content from the topic's referenced primary source URLs/PDFs and passes it to Claude
  3. Claude returns structured FactCard drafts; output is constrained to cited primary source content (no secondary reporting)
  4. Topic status progresses voting → investigating → done as workflow steps complete
  5. Investigation Timeline UI (4 steps with progress %) renders for topics in `investigating` state on the board
  6. All long-running work happens inside the Upstash Workflow — no Vercel function exceeds 30s
**Plans:** TBD

---

### Phase 8: Admin Trigger UI
**Milestone:** v0.4
**Goal:** Admin can manually trigger Deep-Dive on any topic regardless of vote count — needed for testing pipeline correctness before publishing.
**Depends on:** Phase 7
**Requirements:** PIPE-02
**Success Criteria** (what must be TRUE):
  1. `/admin/topics` route gated by an admin role flag on users table
  2. Admin can click "Trigger Deep-Dive" on any topic; same workflow as automatic trigger
  3. FactCard drafts produced this way are visible in the admin queue but NOT yet on a public article page (article page lands in Phase 10)
**Plans:** TBD

---

### Phase 9: Human Review Queue
**Milestone:** v0.5
**Goal:** Reviewers approve or reject AI-generated FactCard drafts before they become publicly visible.
**Depends on:** Phase 8
**Requirements:** FACT-06
**Success Criteria** (what must be TRUE):
  1. Reviewer role exists on users; `/review` route shows pending FactCard drafts
  2. Reviewer can approve, reject (with reason), or request edits per card
  3. Only approved cards become public; rejected cards stay in DB with audit trail
  4. Approval transitions the parent article from `draft` → `published`
**Plans:** TBD

---

### Phase 10: Article Page + Fact Cards
**Milestone:** v0.5
**Goal:** Published article pages — every Fact Card displays type, confidence, primary source links with archive.org fallback; download block aggregates all sources.
**Depends on:** Phase 9
**Requirements:** FACT-01, FACT-02, FACT-03, FACT-04, FACT-05, FACT-07, FACT-08, FACT-09, FACT-10
**Success Criteria** (what must be TRUE):
  1. `/articles/[slug]` renders article header + all approved FactCards in sequence
  2. Each card shows type badge (claim / evidence / context / openq), ScienceStamp confidence badge (primary / conflicting / insufficient)
  3. Evidence cards with key statistics use the large-figure layout
  4. Sources expandable inline per card; show org, doc name, date, file size, primary URL, archive.org fallback URL
  5. Download Block lists all primary sources individually + offers a ZIP of all sources
**Plans:** TBD
**UI hint:** yes

---

### Phase 11: Bias Radar
**Milestone:** v0.5
**Goal:** Article page shows the Bias Radar — RSS-aggregated headlines grouped by political orientation (left / public broadcaster / right) with tone meter.
**Depends on:** Phase 10
**Requirements:** BIAS-01, BIAS-02, BIAS-03, BIAS-04, BIAS-05
**Success Criteria** (what must be TRUE):
  1. Curated RSS feed list seeded (left, public broadcaster, right groups)
  2. Article page has a collapsible Bias Radar section showing grouped headlines per outlet group
  3. Tone meter bar + article count per group rendered
  4. Explanatory note ("Goal is not one truth but to make perspectives visible") visible
  5. RSS fetch is cached (article-page render must not block on live RSS pulls)
**Plans:** TBD
**UI hint:** yes

---

### Phase 12: Comments Schema + UI
**Milestone:** v0.6
**Goal:** Authenticated users post comments / corrections on published articles, optionally citing a primary source URL or referencing a specific FactCard.
**Depends on:** Phase 11
**Requirements:** DISC-01, DISC-02
**Success Criteria** (what must be TRUE):
  1. `comments` table exists with: user_id, article_id, body, optional source_url, optional fact_card_id, created_at, status
  2. Comment form on article page accepts: free text, optional primary source URL, optional FactCard reference
  3. Comments list under article renders authored comments with author + timestamp
**Plans:** TBD

---

### Phase 13: AI Moderation + Source Filtering
**Milestone:** v0.6
**Goal:** Claude-based moderator flags inflammatory comments without citations; users can filter to source-citing comments only.
**Depends on:** Phase 12
**Requirements:** DISC-03, DISC-04, DISC-05
**Success Criteria** (what must be TRUE):
  1. New comment passes through Claude moderator; if inflammatory + no source → status flagged, badge "KI-Moderator: ohne Quelle" displayed
  2. Comment list filter: All / With Source — toggle works without page reload
  3. Moderation runs async (QStash) so comment submission isn't blocked by AI latency
**Plans:** TBD

---

### Phase 14: Editorial Picks + Comment Voting
**Milestone:** v0.6
**Goal:** Editorial team can mark a comment as "Redaktion übernommen" (taken into editorial); users can up/downvote comments.
**Depends on:** Phase 13
**Requirements:** DISC-06, DISC-07
**Success Criteria** (what must be TRUE):
  1. Editorial role exists; editor can pin a comment with the "Redaktion übernommen" badge
  2. Up/downvote buttons on each comment; net score visible
  3. Comments sortable by newest / top score
**Plans:** TBD

---

## Progress

**Execution Order:** Phases execute in numeric order: 0 → 1 → 2 → … → 14

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 0. Foundation & Landing | v0.1 | — | Completed | 2026-04-27 |
| 1. Database Foundation | v0.2 | 0/TBD | Next | — |
| 2. Magic-Link Authentication | v0.2 | 0/TBD | Not started | — |
| 3. Topic Board UI | v0.3 | 0/TBD | Not started | — |
| 4. Propose Modal + Objectivity Filter | v0.3 | 0/TBD | Not started | — |
| 5. Voting & Weekly Budget | v0.3 | 0/TBD | Not started | — |
| 6. Schema Extension + Upstash Wiring | v0.4 | 0/TBD | Not started | — |
| 7. Pipeline Worker | v0.4 | 0/TBD | Not started | — |
| 8. Admin Trigger UI | v0.4 | 0/TBD | Not started | — |
| 9. Human Review Queue | v0.5 | 0/TBD | Not started | — |
| 10. Article Page + Fact Cards | v0.5 | 0/TBD | Not started | — |
| 11. Bias Radar | v0.5 | 0/TBD | Not started | — |
| 12. Comments Schema + UI | v0.6 | 0/TBD | Not started | — |
| 13. AI Moderation + Source Filtering | v0.6 | 0/TBD | Not started | — |
| 14. Editorial Picks + Comment Voting | v0.6 | 0/TBD | Not started | — |
