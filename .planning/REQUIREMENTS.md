# Requirements: kebab.news

**Defined:** 2026-04-23
**Restructured into 0.x milestones:** 2026-04-27
**Core Value:** Every published sourced claim must be traceable to a verifiable primary source that any user can access in a single click.

## Versioning Model

- **0.x milestones** — incremental releases, each independently shippable
- **v1.0** — full public community launch (reserved; explicitly a maturity milestone, not another feature wave)

---

## v0.1 — Foundation & Landing (Validated)

Closed retrospectively 2026-04-27. All requirements delivered in current `main`.

- [x] **SETUP-01**: Project uses Bun as the runtime, managed via mise.toml
- [x] **SETUP-02**: mise.toml documents that `mise install` is required before running the project
- [x] **SETUP-03**: Next.js 16 App Router project exists in /src with TypeScript, Biome, Tailwind CSS, next-intl
- [x] **SETUP-04**: Design system CSS custom properties (--bg, --ink-*, --accent, --line-*, --warn, --left, --right) and fonts (Inter + IBM Plex Mono) are wired into the Tailwind config
- [x] **LAND-01**: Landing page displays the kebab.news logo (wordmark: ink + ".news" in accent teal)
- [x] **LAND-02**: Landing page presents the platform vision and motto
- [x] **LAND-03**: Landing page includes a link to the GitHub repository
- [x] **LAND-04**: Landing page uses the project design system (tokens, Inter, IBM Plex Mono)

---

## v0.2 — Topic Schema & Magic-Link Auth (Active)

Backend foundation that v0.3 strictly needs. Schema is right-sized: only users / topics / votes — FactCards, Sources, Articles, Comments are added in later milestones when they're actually used.

### Infrastructure & Schema (subset)

- [ ] **INFRA-01**: Drizzle ORM schema: Users table (with `trust_score` column seeded at 0)
- [ ] **INFRA-02**: Drizzle ORM schema: Topics table (id, title, original_submission, neutral_rewrite, status enum, vote_count, created_by, created_at)
- [ ] **INFRA-03**: Drizzle ORM schema: Votes table (user_id, topic_id, week_bucket — composite unique key)
- [ ] **INFRA-07**: pgvector extension enabled on Neon Postgres from day one (forward compatibility for v0.4 semantic search)
- [ ] **INFRA-08**: Vercel + Upstash environment scaffold wired from project initialization (env vars only; QStash not yet invoked)
- [ ] **INFRA-09**: Drizzle migrations + `.env.example` patterns for Neon DATABASE_URL, no hardcoded secrets

### Authentication

- [ ] **AUTH-01**: User can sign up via Better Auth Magic Link (passwordless email)
- [ ] **AUTH-03**: Session persists across browser refresh
- [ ] **AUTH-04**: User can log out from any page

### Voting (schema only)

- [ ] **VOTE-07**: trust_score column on Users table seeded with basic rule (verified Magic-Link login = +1)

---

## v0.3 — Topic Board MVP (Active)

The MVP that makes the idea visibly distinct. Community submits topics → Claude rewrites them neutrally on submit → others vote with weekly budget.

### Topic Board

- [ ] **TOPIC-01**: Authenticated user can submit a topic question via Propose Modal
- [ ] **TOPIC-02**: Submitted topic is run through the Objectivity Filter (Claude prompt layer); user sees both original and neutral rewrite before final submit
- [ ] **TOPIC-03**: User can optionally provide: category, rationale, possible primary sources
- [ ] **TOPIC-04**: Topics display in a list with the **In Voting** tab active *(In Investigation / Published tabs are scaffolded but disabled in v0.3 — activated in v0.4 / v0.5)*
- [ ] **TOPIC-05**: Topics in "voting" state are sortable: most votes / close to goal / newest
- [ ] **TOPIC-06**: Featured topic (highest votes in current filter) is displayed at larger size
- [ ] **TOPIC-07**: Each topic shows status badge (Voting only in v0.3)
- [ ] **TOPIC-09**: Topics show vote count and submission metadata *(source/comment counts deferred until v0.5/v0.6)*

### Voting

- [ ] **VOTE-01**: Authenticated user has a weekly vote budget (default: 10 votes, resets Monday)
- [ ] **VOTE-02**: User can upvote a topic (costs 1 vote from budget)
- [ ] **VOTE-03**: User can retract their vote (returns 1 vote to budget)
- [ ] **VOTE-04**: Vote budget is displayed as a visual pip strip (used vs. remaining)
- [ ] **VOTE-05**: Vote button shows pulse animation on click; disabled + tooltip when budget exhausted

### AI / Pipeline (objectivity layer only)

- [ ] **PIPE-05**: Objectivity Filter prompt layer reduces emotional language in topic submissions to make them verifiable before storing — runs synchronously in propose flow (no Upstash needed; short Claude call fits in Vercel 30s)

### Design System & UI

- [ ] **UI-01**: Inter (sans/display) + IBM Plex Mono (data/labels/metadata) type system
- [ ] **UI-02**: CSS custom properties token set — already in v0.1; v0.3 extends with any board-specific tokens
- [ ] **UI-03**: Sticky header with logo, navigation, vote budget pip strip, "Propose Topic" button
- [ ] **UI-04**: Footer remains as v0.1 — no changes needed
- [ ] **UI-05**: Toast notification on topic submission
- [ ] **UI-06**: i18n strings for board / propose / voting in EN + DE

---

## v0.4 — Source Analysis Pipeline (Backlog)

Vote-threshold-triggered Upstash Workflow → Claude synthesis from primary sources → status progression. Schema extends to add FactCards / Sources / Articles tables.

### Infrastructure & Schema (extension)

- [ ] **INFRA-04**: Drizzle ORM schema: FactCards table
- [ ] **INFRA-05**: Drizzle ORM schema: Sources table
- [ ] **INFRA-06**: Drizzle ORM schema: Articles table

### Topic Board (extensions)

- [ ] **TOPIC-08**: Topics in "investigating" state show 4-step Investigation Timeline with progress %

### Voting (extension)

- [ ] **VOTE-06**: Each topic has a configurable vote goal threshold; crossing it auto-triggers the Deep-Dive pipeline

### Deep-Dive Pipeline

- [ ] **PIPE-01**: When a topic crosses the vote threshold, an Upstash Workflow job is automatically triggered
- [ ] **PIPE-02**: Admin can manually trigger a Deep-Dive on any topic regardless of vote count
- [ ] **PIPE-03**: Pipeline fetches referenced primary source URLs / PDFs and passes content to Claude
- [ ] **PIPE-04**: Claude synthesizes sourced claims from primary source content only (no secondary reporting)
- [ ] **PIPE-06**: All AI research tasks are offloaded to Upstash Workflows/QStash (Vercel 30s timeout)
- [ ] **PIPE-07**: Pipeline updates topic status: voting → investigating → done

---

## v0.5 — Fact Cards & Bias Radar (Backlog)

### Fact Cards

- [ ] **FACT-01**: Each Fact Card has a type: `claim` / `evidence` / `context` / `openq`
- [ ] **FACT-02**: Each card has a confidence level: `primary` / `conflicting` / `insufficient`
- [ ] **FACT-03**: Each card displays a ScienceStamp badge matching confidence level
- [ ] **FACT-04**: Each card links every claim to one or more primary sources
- [ ] **FACT-05**: Primary source links include archive.org fallback URL
- [ ] **FACT-06**: AI-generated Fact Cards enter a human review queue before publishing
- [ ] **FACT-07**: Evidence cards with a key statistic display a large figure + sub-label layout
- [ ] **FACT-08**: Sources are expandable inline per card
- [ ] **FACT-09**: All primary sources for an article are available in a Download Block (individual + ZIP)
- [ ] **FACT-10**: Published article page shows article header, all Fact Cards, Bias Radar, Download Block, Discussion-shell

### Bias Radar

- [ ] **BIAS-01**: Aggregate headlines from curated RSS feeds grouped by political orientation
- [ ] **BIAS-02**: Display headline list per outlet group with a tone meter bar
- [ ] **BIAS-03**: Show article count per outlet group
- [ ] **BIAS-04**: Bias Radar is collapsible within the article page
- [ ] **BIAS-05**: Explanatory note: "Goal is not one truth but to make perspectives visible"

---

## v0.6 — Discussion & Moderation (Backlog)

- [ ] **DISC-01**: Authenticated users can submit comments/corrections on a published article
- [ ] **DISC-02**: Comment form allows: free text, optional primary source URL, optional card reference
- [ ] **DISC-03**: AI moderator (Claude) flags comments that contain inflammatory language without a source citation
- [ ] **DISC-04**: Flagged comments show "KI-Moderator: ohne Quelle" warning badge
- [ ] **DISC-05**: Comments can be filtered: All / With Source
- [ ] **DISC-06**: Editorial-picked comments show "Redaktion übernommen" badge
- [ ] **DISC-07**: Users can upvote/downvote comments

---

## v1.0 — Community Launch (Reserved)

Hardening + maturity work, not a feature wave. Defined in detail when v0.6 is closed.

- [ ] **AUTH-02**: Email verification UI on top of Magic Link (verified status seeds trust_score upgrade)
- [ ] **NOTF-01**: User notified when a topic they voted for enters investigation
- [ ] **NOTF-02**: User notified when a topic they voted for is published
- Plus: docs, onboarding, performance hardening, marketing copy

---

## Future / v2.0+

### Anti-Abuse

- **ABUSE-01**: IP-based rate limiting on vote submission
- **ABUSE-02**: Behavioral scoring for trust_score algorithm
- **ABUSE-03**: Account age decay / reputation tiers

### Source Mirroring

- **MIRROR-01**: Self-hosted PDF/snapshot storage in object storage
- **MIRROR-02**: Automated archiving pipeline

### Internationalization

- **I18N-01**: Full German translation polish (EN + DE skeleton already present from v0.1)

### Payments / Membership

- **PAY-01**: Membership / donation flow

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile native app | Web-first; mobile browser supported |
| Real-time vote counts (WebSocket) | Not needed for MVP; polling sufficient |
| OAuth login (Google, GitHub) | Magic Link sufficient for v0.x; v1.0 reconsiders |
| Full anti-abuse scoring algorithm | Schema seeds trust_score; algorithm deferred to v2 |
| Self-hosted PDF mirroring | archive.org fallback is zero-infra; S3 mirroring is v2 |
| Video/audio content | Text and data only |
| Multi-tenant / white-label | Single community deployment |

---

## Traceability

| Requirement | Milestone | Phase | Status |
|-------------|-----------|-------|--------|
| SETUP-01 | v0.1 | 0 | Validated |
| SETUP-02 | v0.1 | 0 | Validated |
| SETUP-03 | v0.1 | 0 | Validated |
| SETUP-04 | v0.1 | 0 | Validated |
| LAND-01 | v0.1 | 0 | Validated |
| LAND-02 | v0.1 | 0 | Validated |
| LAND-03 | v0.1 | 0 | Validated |
| LAND-04 | v0.1 | 0 | Validated |
| INFRA-01 | v0.2 | 1 | Pending |
| INFRA-02 | v0.2 | 1 | Pending |
| INFRA-03 | v0.2 | 1 | Pending |
| INFRA-07 | v0.2 | 1 | Pending |
| INFRA-08 | v0.2 | 1 | Pending |
| INFRA-09 | v0.2 | 1 | Pending |
| AUTH-01 | v0.2 | 2 | Pending |
| AUTH-03 | v0.2 | 2 | Pending |
| AUTH-04 | v0.2 | 2 | Pending |
| VOTE-07 | v0.2 | 2 | Pending |
| TOPIC-01 | v0.3 | 4 | Pending |
| TOPIC-02 | v0.3 | 4 | Pending |
| TOPIC-03 | v0.3 | 4 | Pending |
| TOPIC-04 | v0.3 | 3 | Pending |
| TOPIC-05 | v0.3 | 3 | Pending |
| TOPIC-06 | v0.3 | 3 | Pending |
| TOPIC-07 | v0.3 | 3 | Pending |
| TOPIC-09 | v0.3 | 3 | Pending |
| VOTE-01 | v0.3 | 5 | Pending |
| VOTE-02 | v0.3 | 5 | Pending |
| VOTE-03 | v0.3 | 5 | Pending |
| VOTE-04 | v0.3 | 5 | Pending |
| VOTE-05 | v0.3 | 5 | Pending |
| PIPE-05 | v0.3 | 4 | Pending |
| UI-01 | v0.3 | 3 | Pending |
| UI-02 | v0.3 | 3 | Pending |
| UI-03 | v0.3 | 3 | Pending |
| UI-04 | v0.3 | 3 | Pending |
| UI-05 | v0.3 | 4 | Pending |
| UI-06 | v0.3 | 3 | Pending |
| INFRA-04 | v0.4 | 6 | Pending |
| INFRA-05 | v0.4 | 6 | Pending |
| INFRA-06 | v0.4 | 6 | Pending |
| TOPIC-08 | v0.4 | 7 | Pending |
| VOTE-06 | v0.4 | 7 | Pending |
| PIPE-01 | v0.4 | 7 | Pending |
| PIPE-02 | v0.4 | 8 | Pending |
| PIPE-03 | v0.4 | 7 | Pending |
| PIPE-04 | v0.4 | 7 | Pending |
| PIPE-06 | v0.4 | 7 | Pending |
| PIPE-07 | v0.4 | 7 | Pending |
| FACT-01 | v0.5 | 10 | Pending |
| FACT-02 | v0.5 | 10 | Pending |
| FACT-03 | v0.5 | 10 | Pending |
| FACT-04 | v0.5 | 10 | Pending |
| FACT-05 | v0.5 | 10 | Pending |
| FACT-06 | v0.5 | 9 | Pending |
| FACT-07 | v0.5 | 10 | Pending |
| FACT-08 | v0.5 | 10 | Pending |
| FACT-09 | v0.5 | 10 | Pending |
| FACT-10 | v0.5 | 10 | Pending |
| BIAS-01 | v0.5 | 11 | Pending |
| BIAS-02 | v0.5 | 11 | Pending |
| BIAS-03 | v0.5 | 11 | Pending |
| BIAS-04 | v0.5 | 11 | Pending |
| BIAS-05 | v0.5 | 11 | Pending |
| DISC-01 | v0.6 | 12 | Pending |
| DISC-02 | v0.6 | 12 | Pending |
| DISC-03 | v0.6 | 13 | Pending |
| DISC-04 | v0.6 | 13 | Pending |
| DISC-05 | v0.6 | 13 | Pending |
| DISC-06 | v0.6 | 14 | Pending |
| DISC-07 | v0.6 | 14 | Pending |
| AUTH-02 | v1.0 | TBD | Pending |
| NOTF-01 | v1.0 | TBD | Pending |
| NOTF-02 | v1.0 | TBD | Pending |

**Coverage:**
- v0.1 (Validated): 8 / 8
- v0.2 (Active): 10 requirements
- v0.3 (Active): 20 requirements
- v0.4 (Backlog): 11 requirements
- v0.5 (Backlog): 15 requirements
- v0.6 (Backlog): 7 requirements
- v1.0 (Reserved): 3 requirements (+ hardening defined later)
- **Total mapped:** 74 / 74 ✓

---

*Requirements defined: 2026-04-23*
*Restructured into 0.x milestones: 2026-04-27*
