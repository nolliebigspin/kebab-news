# Requirements: unsere.news

**Defined:** 2026-04-23
**Core Value:** Every published Fact Card must be traceable to a verifiable primary source that any user can access in a single click.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password via Better Auth
- [ ] **AUTH-02**: User receives email verification after signup (verified status seeds trust_score)
- [ ] **AUTH-03**: User can log in and session persists across browser refresh
- [ ] **AUTH-04**: User can log out from any page

### Topic Board

- [ ] **TOPIC-01**: Authenticated user can submit a topic question via Propose Modal
- [ ] **TOPIC-02**: Submitted topic is run through the Objectivity Filter (Claude prompt layer) before being stored — neutral, researchable framing enforced
- [ ] **TOPIC-03**: User can optionally provide: category, rationale ("why important"), possible primary sources
- [ ] **TOPIC-04**: Topics display in a filterable list with tabs: In Voting / In Investigation / Published
- [ ] **TOPIC-05**: Topics in "voting" state are sortable: most votes / close to goal / newest
- [ ] **TOPIC-06**: Featured topic (highest votes in current filter) is displayed at larger size
- [ ] **TOPIC-07**: Each topic shows status badge: Voting / In Investigation / Published
- [ ] **TOPIC-08**: Topics in "investigating" state show a 4-step Investigation Timeline (KI-Aggregation → Fact Extraction → Editorial Review → Publication) with progress %
- [ ] **TOPIC-09**: Published topics show source count, comment count, and link to Fact Card article

### Voting

- [ ] **VOTE-01**: Authenticated user has a configurable weekly vote budget (default: 10 votes, resets on Monday, admin-configurable)
- [ ] **VOTE-02**: User can upvote a topic (costs 1 vote from budget)
- [ ] **VOTE-03**: User can retract their vote (returns 1 vote to budget)
- [ ] **VOTE-04**: Vote budget is displayed as a visual pip strip (used vs. remaining)
- [ ] **VOTE-05**: Vote button shows pulse animation on click; disabled + tooltip when budget exhausted
- [ ] **VOTE-06**: Each topic has a configurable vote goal threshold; crossing it auto-triggers the Deep-Dive pipeline
- [ ] **VOTE-07**: trust_score column on Users table seeded with basic rules (verified email +1, account age)

### Deep-Dive Pipeline

- [ ] **PIPE-01**: When a topic crosses the vote threshold, an Upstash Workflow job is automatically triggered
- [ ] **PIPE-02**: Admin can manually trigger a Deep-Dive on any topic regardless of vote count
- [ ] **PIPE-03**: Pipeline fetches referenced primary source URLs / PDFs and passes content to Claude
- [ ] **PIPE-04**: Claude synthesizes Fact Cards from primary source content only (no secondary reporting)
- [ ] **PIPE-05**: Objectivity Filter prompt layer neutralizes biased/emotional topic submissions before storing
- [ ] **PIPE-06**: All AI research tasks are offloaded to Upstash Workflows/QStash to stay within Vercel's 30s timeout
- [ ] **PIPE-07**: Pipeline updates topic status: voting → investigating → done

### Fact Cards

- [ ] **FACT-01**: Each Fact Card has a type: `claim` / `evidence` / `context` / `openq`
- [ ] **FACT-02**: Each card has a confidence level: `primary` / `conflicting` / `insufficient`
- [ ] **FACT-03**: Each card displays a ScienceStamp badge (ShieldCheck / AlertTriangle / HelpCircle icon) matching confidence level
- [ ] **FACT-04**: Each card links every claim to one or more primary sources (org, document name, date, file size)
- [ ] **FACT-05**: Primary source links include archive.org fallback URL to prevent link rot
- [ ] **FACT-06**: AI-generated Fact Cards enter a human review queue before publishing
- [ ] **FACT-07**: Evidence cards with a key statistic display a large figure + sub-label layout
- [ ] **FACT-08**: Sources are expandable inline (collapsible details element) per card
- [ ] **FACT-09**: All primary sources for an article are available in a Download Block (individual + ZIP)
- [ ] **FACT-10**: Published article page shows article header, all Fact Cards in sequence, Bias Radar, Download Block, and Discussion

### Bias Radar

- [ ] **BIAS-01**: For each published topic, aggregate headlines from curated RSS feeds grouped by political orientation: left-leaning / public broadcaster / right-leaning/business
- [ ] **BIAS-02**: Display headline list per outlet group with a tone meter bar (critical ← neutral → supportive)
- [ ] **BIAS-03**: Show article count per outlet group
- [ ] **BIAS-04**: Bias Radar is collapsible (expandable section) within the article page
- [ ] **BIAS-05**: Explanatory note: "Goal is not one truth but to make perspectives visible"

### Discussion & Moderation

- [ ] **DISC-01**: Authenticated users can submit comments/corrections on a published article
- [ ] **DISC-02**: Comment form allows: free text, optional primary source URL, optional card reference
- [ ] **DISC-03**: AI moderator (Claude) flags comments that contain inflammatory language without a source citation
- [ ] **DISC-04**: Flagged comments show "KI-Moderator: ohne Quelle" warning badge
- [ ] **DISC-05**: Comments can be filtered: All / With Source
- [ ] **DISC-06**: Editorial-picked comments show "Redaktion übernommen" badge
- [ ] **DISC-07**: Users can upvote/downvote comments

### Design System & UI

- [ ] **UI-01**: Inter (sans/display, tight tracking) + IBM Plex Mono (data/labels/metadata) type system
- [ ] **UI-02**: CSS custom properties token set: --bg, --bg-warm, --ink, --ink-soft, --ink-mute, --line, --line-soft, --accent (teal oklch(0.56 0.085 190)), --warn (amber), --oerr (purple), --left (warm red), --right (slate blue)
- [ ] **UI-03**: Sticky header with logo, navigation tabs (Community Board / Article), vote budget pill, "Propose Topic" button
- [ ] **UI-04**: Footer with nonprofit tagline and links: Methodology, AI Transparency, Funding, Source Code, Contact
- [ ] **UI-05**: Toast notification on topic submission
- [ ] **UI-06**: English UI with i18n infrastructure ready (next-intl or equivalent) — German translation strings prepared for launch

### Infrastructure & Schema

- [ ] **INFRA-01**: Drizzle ORM schema: Users (id, email, passwordHash, emailVerified, trustScore, votesBudget, budgetResetAt, createdAt)
- [ ] **INFRA-02**: Drizzle ORM schema: Topics (id, title, titleNeutral, tag, proposerId, votes, goalThreshold, status, progress, progressLabel, createdAt)
- [ ] **INFRA-03**: Drizzle ORM schema: Votes (id, userId, topicId, createdAt) — unique constraint userId+topicId
- [ ] **INFRA-04**: Drizzle ORM schema: FactCards (id, articleId, kind, label, confidence, body, figure, position, status, createdAt)
- [ ] **INFRA-05**: Drizzle ORM schema: Sources (id, factCardId, org, doc, date, sourceUrl, archiveUrl, fileSize, externalId)
- [ ] **INFRA-06**: Drizzle ORM schema: Articles (id, topicId, title, summary, tag, publishedAt, updatedAt, readtime, votesAtCommission)
- [ ] **INFRA-07**: pgvector extension enabled on Neon Postgres from day one (semantic search not yet used)
- [ ] **INFRA-08**: Vercel + Upstash environment scaffold wired from project initialization
- [ ] **INFRA-09**: Next.js App Router project with TypeScript, Tailwind CSS, proper env var patterns for self-hosting

## v2 Requirements

### Anti-Abuse

- **ABUSE-01**: IP-based rate limiting on vote submission
- **ABUSE-02**: Behavioral scoring for trust_score algorithm (full implementation)
- **ABUSE-03**: Account age decay / reputation tiers (new/trusted/veteran) that scale vote weight

### Source Mirroring

- **MIRROR-01**: Self-hosted PDF/snapshot storage in object storage (S3 or Cloudflare R2)
- **MIRROR-02**: Automated archiving pipeline that mirrors sources on ingest

### Notifications

- **NOTF-01**: User notified when a topic they voted for enters investigation
- **NOTF-02**: User notified when a topic they voted for is published

### Internationalization

- **I18N-01**: Full German translation (strings prepared in v1, activated in v2)

### Payments / Membership

- **PAY-01**: Membership / donation flow for "Mitglieder-getragen" model

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile native app | Web-first; mobile browser supported |
| Real-time vote counts (WebSocket) | Not needed for MVP; polling sufficient |
| OAuth login (Google, GitHub) | Email/password sufficient for v1 |
| Full anti-abuse scoring algorithm | Schema seeds trust_score; algorithm is a research problem deferred to v2 |
| Self-hosted PDF mirroring | archive.org fallback is zero-infra; S3 mirroring is v2 |
| Video/audio content | Text and data only |
| Multi-tenant / white-label | Single community deployment |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 1 | Pending |
| INFRA-04 | Phase 1 | Pending |
| INFRA-05 | Phase 1 | Pending |
| INFRA-06 | Phase 1 | Pending |
| INFRA-07 | Phase 1 | Pending |
| INFRA-08 | Phase 1 | Pending |
| INFRA-09 | Phase 1 | Pending |
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| AUTH-04 | Phase 2 | Pending |
| TOPIC-01 | Phase 3 | Pending |
| TOPIC-02 | Phase 3 | Pending |
| TOPIC-03 | Phase 3 | Pending |
| TOPIC-04 | Phase 3 | Pending |
| TOPIC-05 | Phase 3 | Pending |
| TOPIC-06 | Phase 3 | Pending |
| TOPIC-07 | Phase 3 | Pending |
| TOPIC-08 | Phase 3 | Pending |
| TOPIC-09 | Phase 3 | Pending |
| VOTE-01 | Phase 3 | Pending |
| VOTE-02 | Phase 3 | Pending |
| VOTE-03 | Phase 3 | Pending |
| VOTE-04 | Phase 3 | Pending |
| VOTE-05 | Phase 3 | Pending |
| VOTE-06 | Phase 3 | Pending |
| VOTE-07 | Phase 3 | Pending |
| UI-01 | Phase 3 | Pending |
| UI-02 | Phase 3 | Pending |
| UI-03 | Phase 3 | Pending |
| UI-04 | Phase 3 | Pending |
| UI-05 | Phase 3 | Pending |
| UI-06 | Phase 3 | Pending |
| PIPE-01 | Phase 4 | Pending |
| PIPE-02 | Phase 4 | Pending |
| PIPE-03 | Phase 4 | Pending |
| PIPE-04 | Phase 4 | Pending |
| PIPE-05 | Phase 4 | Pending |
| PIPE-06 | Phase 4 | Pending |
| PIPE-07 | Phase 4 | Pending |
| FACT-01 | Phase 5 | Pending |
| FACT-02 | Phase 5 | Pending |
| FACT-03 | Phase 5 | Pending |
| FACT-04 | Phase 5 | Pending |
| FACT-05 | Phase 5 | Pending |
| FACT-06 | Phase 5 | Pending |
| FACT-07 | Phase 5 | Pending |
| FACT-08 | Phase 5 | Pending |
| FACT-09 | Phase 5 | Pending |
| FACT-10 | Phase 5 | Pending |
| BIAS-01 | Phase 5 | Pending |
| BIAS-02 | Phase 5 | Pending |
| BIAS-03 | Phase 5 | Pending |
| BIAS-04 | Phase 5 | Pending |
| BIAS-05 | Phase 5 | Pending |
| DISC-01 | Phase 6 | Pending |
| DISC-02 | Phase 6 | Pending |
| DISC-03 | Phase 6 | Pending |
| DISC-04 | Phase 6 | Pending |
| DISC-05 | Phase 6 | Pending |
| DISC-06 | Phase 6 | Pending |
| DISC-07 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 64 total (9 INFRA + 4 AUTH + 9 TOPIC + 7 VOTE + 7 PIPE + 10 FACT + 5 BIAS + 7 DISC + 6 UI)
- Mapped to phases: 64
- Unmapped: 0 ✓

**Note:** The earlier count of 59 undercounted — the correct total when each requirement ID is counted individually is 64. All are mapped.

---
*Requirements defined: 2026-04-23*
*Last updated: 2026-04-23 — traceability expanded to individual requirement rows; VOTE-01–07 reassigned from Phase 2 to Phase 3 (voting is inseparable from the board UI)*
