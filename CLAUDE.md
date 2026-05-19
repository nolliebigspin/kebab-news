# kebab.news — Agent Working Document

This file is read by Claude Code on every session. It is the source of truth for vision, scope, hard rules, and lessons learned. Keep it tight. When the user corrects a mistake, ask whether to append a lesson to Section IX.

---

## I. Vision (the why)

kebab.news is a **Verifikationsschnittstelle für deutschsprachige Nachrichten** — not a publication. We exist to push back against framing, emotional rhetoric, and the agenda-setting of conventional/conservative German news outlets by making **how a story is told** visible alongside **what the primary sources actually say**.

**Stance:** *Transparenz statt Neutralität.* We do not claim to be neutral. We expose framing — including our own — so readers can decide.

**Motto:** "Wir zeigen dir nicht, was du denken sollst. Wir zeigen dir, woher die Informationen stammen."

**Audience:** German-speaking readers (DE/AT/CH) who distrust both legacy media framing and reflexive "alternative" narratives, and who want primary sources without an essay wrapped around them.

**Why now:** Ground.news solved this for English. Correctiv covers fact-checking. The gap is a **German-language news radar with primary-source verification** — nobody is serving it.

---

## II. Product Scope (SLC v1, then layers)

We ship as an **SLC — Simple, Lovable, Complete** — not a feature-stuffed MVP. One thing, done well, that proves the vision.

### SLC v1 — Radar (ship this, nothing else)

A public, read-only German-language **multi-source radar**. For each top story of the day, show coverage side-by-side across the political spectrum (taz / SZ / FAZ / Welt / NZZ / Junge Freiheit / Nius / öffentlich-rechtlich), with framing language annotated on the publisher headlines themselves.

**In scope for v1:**
- Scheduled RSS/feed ingest of a fixed set of German outlets.
- AI clustering of articles into stories (via `pgvector` similarity).
- AI framing annotation applied to **publisher headlines** — loaded terms, emotional triggers, presupposed framing highlighted.
- One reading surface: today's stories, expandable to see all outlets' coverage of each.
- German-only UI. Cookie-less analytics. Impressum + privacy page.

**Out of scope for v1 (deliberately):**
- No user accounts, no auth, no email collection.
- No voting, no Fact-Pips.
- No comments, no moderation system.
- No user-submitted topics, no framing annotation on user input.
- No Fact-Cards, no primary-source research loop.
- No background-job queue (see Section VI rule 5).

### Later layers (post-SLC, only if v1 earns it)

- **Layer 2 — Verification Loop:** community-voted deep dives where AI summarizes primary sources (Bundestag-Drucksachen, Destatis, BMF-Haushalt, RKI/PEI, EU-Dokumente). Output is structured Fact-Cards with 1:1 source links — never opinion essays.
- **Community layer:** accounts (Magic Link), Fact-Pip voting, comments with moderation.

**Hard scope rule (all layers):** AI never writes articles in the journalistic sense. AI extracts, clusters, and links. Humans decide what is interesting.

---

## III. Core Feature Logic

### 1. Perspective Mapping (Radar UI) — SLC v1
- For each story cluster, show coverage from across the spectrum side-by-side.
- Highlight framing deltas (word choice, what is omitted, what is foregrounded).
- Identify blindspots (which side isn't covering it).

### 2. Framing Annotation — SLC v1, on publisher headlines only
- AI **annotates** loaded terms, emotional triggers, and presupposed framing on publisher headlines.
- AI does **not** rewrite. Reader sees the original headline plus the annotation overlay.
- Rationale: an AI-rewritten "neutral" version replaces source framing with model-training-data framing. That is the failure mode we exist to fight.
- (Once the community layer exists, the same annotation logic runs on user-submitted topics — but the user, not the AI, rewrites.)

### 3. Voting (Fact-Pips) — later layer
- 10 weekly Fact-Pips per user.
- Pips are spent on topics worth investigating, not on opinions.
- A topic crossing a threshold triggers Layer 2 research.
- **No persistent per-user trust score.** (Reads as social credit; legally and reputationally risky in DE context.)

### 4. Fact-Cards — Layer 2
- MDX with hoverable claims linking to primary sources (PDF, gov-link, dataset).
- Explicit uncertainty labels: "Datenlage unklar", "widersprüchliche Quellen".
- Methodology section per card: sources used, sources excluded, data date, AI-vs-human verification.

### 5. Comments — community layer
- Up/down votes. Comments at `-10` collapse with a "Low quality" label, content remains accessible.
- **Moderation is a legal obligation (DSA Art. 16, NetzDG legacy):** community downvotes alone are not sufficient. Named, reachable human moderation is required before public launch of this layer.

---

## IV. Tech Stack

Versions are pinned in `mise.toml`, `package.json`, and `bun.lock`. Do not write versions into this document — read them from those files when needed.

**SLC v1 infrastructure (all that is needed to ship):**

- **Runtime / Package Manager:** Bun (managed via mise).
- **Framework:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui.
- **i18n:** next-intl. German is the primary locale; English is secondary.
- **Database:** Neon (Serverless Postgres) + Drizzle ORM + `pgvector` (semantic clustering of stories).
- **Scheduled jobs:** Vercel Cron → route handler that runs ingest/cluster/annotate. No external queue in v1.
- **AI:** Claude (Anthropic API). When building AI features, default to the latest and most capable Claude model.
- **Hosting:** Vercel (Pro plan — gives the function timeouts the scheduled job needs).
- **Quality:** Biome (lint + format), Vitest (tests).

**Deferred infrastructure (only when SLC v1 outgrows it):**

- **Auth (Better Auth, Magic Link):** added when the community layer ships.
- **External queue (Upstash QStash / Workflows):** added only if a single scheduled job exceeds the Vercel function timeout, or if we need fan-out / retries that Cron can't express.
- **Dokploy / self-hosted workers:** parked. Only revisit if Vercel egress or function limits become the bottleneck.

---

## V. Data Contract (Drizzle)

**SLC v1 tables (build these first):**

- `outlets`: id, name, slug, political_lean, feed_url.
- `articles`: id, outlet_id, url, headline, headline_annotations (jsonb), published_at, embedding (vector).
- `stories`: id, label, first_seen_at, last_seen_at, centroid (vector).
- `story_articles`: story_id, article_id (join — which articles belong to which cluster).

**Later-layer tables (do not build until that layer is in scope):**

- `users`: id, email. (No trust_score.) — community layer.
- `topics`: id, original_title, annotated_title, category, status, author_id — community layer.
- `votes`: id, user_id, topic_id, weight, week_number — community layer.
- `comments`: id, topic_id, user_id, content, votes_count — community layer.
- `fact_cards`: id, topic_id, mdx_content, sources (jsonb) — Layer 2.

---

## VI. Tooling Rules (HARD)

These are non-negotiable. Violating them is the most common mistake — see Section IX.

1. **Bun runs through mise, always.** Never invoke bare `bun`, `npm`, `pnpm`, or `yarn`. Always `mise exec -- bun ...` or `mise run ...`. The version is pinned in `mise.toml`; bypassing mise risks version drift.
2. **No other package managers.** This is a Bun project. No `npm install`, no `pnpm`, no `yarn`.
3. **Finishing a step requires `mise exec -- bun check:all`.** Before declaring any coding step complete, run it. Fix what it reports. This is the equivalent of "tests pass" for this project.
4. **DB migrations are generated, never hand-edited.** Run `mise exec -- bun db:generate` after schema changes, then `mise exec -- bun db:migrate`. Do not edit the generated SQL files in `drizzle/` by hand.
5. **No AI calls in user-request handlers.** AI work runs in scheduled jobs (Vercel Cron route handlers) or in explicitly-triggered background jobs — never in the path of a user request. A Cron-triggered route may call Claude directly as long as it fits the function timeout; if it doesn't, that's the trigger for adding a queue.
6. **Primary sources only (Layer 2).** When prompting Claude for research, instruct it to ignore secondary reporting and cite raw documents (PDFs, datasets, gov-links). If no primary source exists, the topic is flagged "Unverifizierbar" — never produce a weak article.
7. **German first.** New user-facing strings go into `messages/de.json` first, then `en.json`. Default examples and UX copy in German.
8. **Design aesthetic:** professional, scientific, slate-blue/white. Clarity over clutter. No "news site" chrome (no breaking-news red, no urgency framing).

---

## VII. Legal / DE Compliance Notes

The agent should flag these before merging anything that touches them:

- **Impressum + privacy page** required from day one — even for the read-only SLC v1.
- **DSGVO:** no fingerprinting analytics. Vercel Analytics is in use — keep it cookie-less. No email collection in v1 (no accounts).
- **DSA / NetzDG:** named human moderation contact required **before the community/comments layer ships**. Not required for the read-only radar.
- **Presserecht / Sorgfaltspflicht:** if Layer 2 ever produces statements about identifiable people, journalistic care obligations apply. Prefer "the document says X" over "person Y did X".
- **Copyright on headlines:** displaying outlet headlines + a link is generally covered, but check before adding excerpts/snippets beyond the headline.

---

## VIII. Workflow Conventions

- **Branching:** `develop` is the integration branch; `main` is release. Feature work via descriptive branches.
- **Commits:** scoped prefixes (`feat(radar): ...`, `fix(...)`, `docs(...)`). One logical change per commit.
- **Before reporting a task done:** run `mise exec -- bun check:all` and (for UI work) verify the change in a browser.

---

## IX. Lessons Learned (self-learning log)

Append-only. When the user corrects me, **I ask** whether to add a lesson here. Format: one-line rule + one-line reason. Newest at the top.

<!-- LESSONS:START -->

- **Default to SLC, not feature-stuffed MVP.** Reason: validate the vision (radar across the spectrum) with the smallest complete surface before adding accounts, voting, comments, or queues. Each of those carries its own legal/infra weight (DSA, DSGVO, QStash) and should only enter when it earns its place.
- **Run bun via mise, not bare.** Reason: Bun version is pinned in `mise.toml`; bare `bun` may resolve to a different installed version and produce inconsistent lockfile/install behavior.
- **Don't write version numbers into CLAUDE.md.** Reason: they rot. The lockfiles and `mise.toml` are the source of truth; reference them at read-time instead.
- **Don't promise "neutrality" or "objectivity" in product copy or specs.** Reason: this product's stance is *transparency over neutrality*. Claiming neutrality is the thing the outlets we critique already do — and it's legally exposed in DE (Sorgfaltspflicht).
- **AI annotates framing; AI does not rewrite the user's framing.** Reason: a rewritten "neutral" version replaces user bias with model-training-data bias, which is the failure mode of every prior AI fact-checker.
- **Run `mise exec -- bun check:all` before declaring a step done.** Reason: this is the project's definition of "ready". Skipping it pushes broken code to develop.

<!-- LESSONS:END -->

---

## X. How this file evolves

- **Vision/scope changes** (Sections I–III): only on explicit user instruction.
- **Tech stack** (Section IV): update when a dependency is added/removed; never add version numbers.
- **Tooling rules** (Section VI): only on explicit user instruction.
- **Lessons Learned** (Section IX): when the user corrects me, I ask "Add this to CLAUDE.md?" and append on yes. I never silently edit this section.
