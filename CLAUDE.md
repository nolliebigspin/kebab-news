# kebab.news — Agent Working Document

This file is read by Claude Code on every session. It is the source of truth for vision, scope, hard rules, and lessons learned. Keep it tight. When the user corrects a mistake, ask whether to append a lesson to Section IX.

---

## I. Vision (the why)

kebab.news is a **deutschsprachiger AI-Nachrichten-Editor**, not a publication run by people. The product: take the day's most important German news stories, look at how every outlet covered them, and produce **one neutral, AI-rewritten version per story** — with the original outlet coverage shown as receipts underneath.

**Stance:** *Neutralität durch Rewriting, Transparenz durch Quellenangabe.* We do not claim to be the truth. We claim to be one consistent, neutrally-worded entry point into stories that the German press covers with very different framing. The original sources stay visible and linkable below every rewrite.

**Motto:** "Eine Geschichte. Eine neutrale Fassung. Alle Quellen sichtbar."

**Audience:** German-speaking readers (DE/AT/CH) who want a single, low-framing entry point into the day's news and the option to drill into how each outlet covered it.

**Why now:** Ground.news solved aggregation + bias labeling for English. Nobody is doing AI-rewritten neutral coverage in German. The gap is "ein KI-redigierter Newsroom für den deutschsprachigen Raum, der sichtbar bleibt."

**The product flow in one sentence:** outlets publish → we cluster → readers vote on which clusters matter → AI rewrites the winners → we publish to `/artikel` with source links underneath.

---

## II. Product Scope

The product ships in three loosely-coupled pieces. Build them in this order; each earns the next.

### Piece 1 — Radar (the curation surface)

The radar is the day's top clusters of German news. For each cluster:
- Show the original publisher headlines side-by-side across the political spectrum (taz / SZ / FAZ / Welt / NZZ / Junge Freiheit / Nius / öffentlich-rechtlich).
- Annotate framing language on the **outlet headlines** — loaded terms, emotional triggers, presuppositions, euphemisms, omissions — so readers can see *why* this story is worth a neutral rewrite.
- Show blind spots — which political lean(s) didn't cover it.
- **Voting button per cluster.** Readers vote on which clusters deserve a full neutral rewrite.

The radar is the front end of the curation pipeline, not the product itself.

### Piece 2 — Voting + selection

Readers vote on radar clusters. The cluster with the most votes for the day becomes the day's rewrite target.

v1 voting model (deliberate compromise):
- One vote per IP per cluster per day, IP hashed with a daily-rotating salt.
- No accounts. No social login. No magic links.
- This will get botted if the product gets any traction. Accept that and move on; account-based voting is a later layer when the product earns it.

Selection in v1 is **manual**: you (the operator) pick the winning story by running `bun rewrite:run --story <slug>`. Automatic "promote the highest-vote story once a day" is a later addition.

### Piece 3 — Rewrite + publish (the product)

For the selected story:
1. Scrape the full article body from each outlet that covered it (subject to the legal hold — see §VII).
2. Feed headlines + teasers + bodies into Claude with a strict neutral-German rewrite prompt.
3. Output: one neutral headline + one neutral 200–400-word body in plain German.
4. Insert into `published_articles` as a draft.
5. Operator publishes via `bun rewrite:publish --story <slug>`.

The published article lives at `/artikel/[slug]` and carries a prominent disclaimer: *"KI-generierte Zusammenfassung. Ungeprüft."* Original outlet articles are linked in a "Quellen" section beneath the rewrite, with their lean labels and framing annotations preserved.

`/artikel` is the accumulating archive of published rewrites, newest first. **This is the actual product** — the radar is the funnel.

### Out of scope for now

- User accounts (Magic Link or otherwise)
- Comments
- Per-user vote weighting or trust scores
- Automatic story selection / publishing
- Multi-language rewrites (German output only)
- Mobile app

---

## III. Core Feature Logic

### 1. Ingest pipeline (existing, manual)

`bun ingest:run` → fetch RSS feeds → for each new article: embed (Voyage `voyage-3-lite`, 512 dims) + annotate framing (Claude Opus 4.7) → cluster into stories by cosine similarity ≥ `DEFAULT_CLUSTER_THRESHOLD` within a `STORY_WINDOW_HOURS` window. Hard cap of `MAX_NEW_ARTICLES_PER_OUTLET` new articles per outlet per run, so cost is bounded.

All tunables live in `src/lib/constants.ts`. The route is `GET /api/cron/ingest` with `Authorization: Bearer ${CRON_SECRET}`. Vercel-Cron schedules it `*/30 * * * *` but is gated by `AUTOMATIC_CRON=true|false`. Manual `bun ingest:run` always works regardless of the gate.

### 2. Framing annotation (existing)

Claude annotates spans on each outlet headline and teaser. Output schema: `{ start, end, type, note }` where `type` ∈ `loaded-term | emotional-trigger | presupposition | euphemism | omission`. UTF-16 offsets, capped at 10 spans per text. Used in the radar UI's "Quellen" view and in the spectrum side-by-side. Not used on the AI rewrite itself — the rewrite is neutral by construction.

### 3. Voting (Piece 2)

`POST /api/vote { storyId }` reads the request's `x-forwarded-for`, hashes it with the daily-rotating salt (`VOTE_DAILY_SALT` env), and upserts into the `votes` table with a `(story_id, ip_hash, day_bucket)` unique constraint. Rate-limit 10 req/min/IP for spam defense. The radar UI shows the live count per cluster.

### 4. Rewrite (Piece 3)

`bun rewrite:run --story <slug>` runs:
1. Load all articles in the cluster.
2. Scrape each article's body (where legally and technically possible — see §VI rule 9).
3. Build a structured input: per-outlet headline + teaser + (optional) body, plus the outlet's political lean.
4. Call Claude with the neutral-German rewrite prompt (versioned in `src/lib/constants.ts` as `REWRITE_SYSTEM_PROMPT`, with a `REWRITE_PROMPT_VERSION` tag stored on every output).
5. Validate the structured output with Zod (`{ neutral_headline, neutral_body }`). On parse failure, log and exit non-zero.
6. Insert into `published_articles` as `published_at = NULL` (draft).

`bun rewrite:publish --story <slug>` flips `published_at = now()` on the latest draft and makes it visible at `/artikel/[slug]`.

### 5. Article surface (Piece 3)

- `/artikel` — list of published rewrites, newest first.
- `/artikel/[slug]` — disclaimer banner at top, then neutral headline as h1, neutral body as markdown, then "Quellen" section with each source outlet's original headline (with framing annotations still highlighted), lean label, link out.

---

## IV. Tech Stack

Versions are pinned in `mise.toml`, `package.json`, and `bun.lock`. Do not write versions into this document — read them from those files when needed.

- **Runtime / Package Manager:** Bun (managed via mise).
- **Framework:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui.
- **i18n:** next-intl. German is the primary locale; English is secondary.
- **Database:** Neon (Serverless Postgres) + Drizzle ORM + `pgvector` (semantic clustering).
- **Scheduled jobs:** Vercel Cron → route handler. No external queue.
- **AI — Embeddings:** Voyage AI (`voyage-3-lite`, 512 dims, direct HTTP).
- **AI — Framing annotation + neutral rewrite:** Claude (Anthropic API, `claude-opus-4-7`).
- **Body scraping:** TBD per outlet — `@mozilla/readability` is the likely default. Paywall outlets (NZZ, FAZ) skipped gracefully.
- **Hosting:** Vercel.
- **Quality:** Biome (lint + format), Vitest (tests).

Deferred until the product earns it: user accounts, Magic Link, persistent vote weighting, external job queues.

---

## V. Data Contract (Drizzle)

Current tables (in `src/lib/db/schema.ts`):

- `outlets` — id, slug, name, political_lean (enum), feed_url, homepage_url, created_at.
- `stories` — id, slug, label (= first article's headline, used as fallback before rewrite exists), first_seen_at, last_seen_at, centroid (vector 512), article_count.
- `articles` — id, outlet_id (FK), url (unique), headline, teaser, headline_annotations (jsonb), teaser_annotations (jsonb), published_at, fetched_at, embedding (vector 512), story_id (FK nullable).

New tables for Product B:

- `votes` — id, story_id (FK cascade), ip_hash, day_bucket (date), created_at. Unique (story_id, ip_hash, day_bucket). Indexed on (story_id, day_bucket) for hot-path counting.
- `published_articles` — id, story_id (FK restrict), slug (unique), neutral_headline, neutral_body (markdown text), source_count, source_outlet_slugs (text[]), model, prompt_version, rewritten_at, published_at (nullable; NULL = draft, NOT NULL = live).
- `stories.published_article_id` — nullable FK back-pointer added via migration.

---

## VI. Tooling Rules (HARD)

These are non-negotiable. Violating them is the most common mistake — see Section IX.

1. **Bun runs through mise, always.** Never invoke bare `bun`, `npm`, `pnpm`, or `yarn`. Always `mise exec -- bun ...` or `mise run ...`. The version is pinned in `mise.toml`.
2. **No other package managers.** This is a Bun project. No `npm install`, no `pnpm`, no `yarn`.
3. **Finishing a step requires `mise exec -- bun check:all`.** Before declaring any coding step complete, run it. Fix what it reports.
4. **DB migrations are generated, never hand-edited.** Run `mise exec -- bun db:generate` after schema changes, then `mise exec -- bun db:migrate`. Do not edit the generated SQL files in `drizzle/` by hand. The metadata snapshots in `drizzle/meta/` are also generated; the only time you touch them is to repair a known-broken chain (see §IX).
5. **No AI calls in user-request handlers.** All AI work runs from cron routes or explicit operator-triggered commands (`bun ingest:run`, `bun rewrite:run`). Never in the path of a page render or a `POST /api/vote`.
6. **Rewrite output is structured.** Claude is called with `output_config.format: { type: "json_schema", ... }`. The output is Zod-validated before persistence. On parse failure, the rewrite is aborted and logged — never saved as partial garbage.
7. **Disclaimer is mandatory.** Every `/artikel/[slug]` page renders the *"KI-generierte Zusammenfassung. Ungeprüft."* banner above the rewritten content. Removing it requires editing this rule first.
8. **Original sources are always visible.** Every published article has a "Quellen" section listing every outlet that fed the rewrite, with link-outs. No rewrite ships without sources.
9. **Article bodies are not stored.** The scraper pulls bodies into memory for the Claude call and discards them. Only the AI-rewritten output is persisted. This minimizes copyright surface.
10. **German first.** New user-facing strings go into `messages/de.json` first, then `en.json`. Default examples and UX copy in German.
11. **Design aesthetic:** professional, scientific, slate-blue/white. Clarity over clutter. No "news site" chrome (no breaking-news red, no urgency framing). The rewrite UI reads more like a research paper than like a newspaper.

---

## VII. Legal / DE Compliance Notes

The agent should flag these before merging anything that touches them. **The legal posture changed materially with the Product B pivot — read this section carefully.**

- **We are now a publisher.** Publishing AI-rewritten coverage of named persons and organizations triggers Presserecht / Sorgfaltspflicht. We are not insured. The operator has accepted this risk personally.
- **Disclaimer alone does not eliminate liability.** "KI-generierte Zusammenfassung. Ungeprüft." is required honesty but it does not get us off the hook for factually wrong statements about identifiable people.
- **Article-body scraping has open legal questions in DE.** RSS headlines + teasers are syndication-fine. Article bodies are copyrighted — we don't store or republish them, but we do use them as transient input for a derivative work (the rewrite). Whether the derivative is sufficiently distinct is a media-lawyer question. **The operator must clear this before `/artikel/[slug]` is publicly deployed.** Local-only builds are fine.
- **DSA / NetzDG:** named human moderation contact required if and when comments ship. Not required for the read-only article surface.
- **DSGVO:** vote IPs are hashed with a daily-rotating salt before storage; raw IPs never persist. Vercel Analytics is in use — keep it cookie-less. No email collection in v1 (no accounts).
- **Impressum + privacy page** required from day one.
- **Robots.txt + 1s/host delay** on the scraper. Identify as `kebab.news/1.0 (+https://kebab.news/impressum)`. Respect outlet `robots.txt`.

---

## VIII. Workflow Conventions

- **Branching:** `develop` is the integration branch; `main` is release. Feature work via descriptive branches.
- **Commits:** scoped prefixes (`feat(rewrite): ...`, `feat(vote): ...`, `feat(radar): ...`, `fix(...)`, `docs(...)`). One logical change per commit.
- **Manual operator commands** are the v1 trigger model:
  - `bun ingest:run` — fetch + cluster + annotate the radar.
  - `bun rewrite:run --story <slug>` — generate a draft rewrite for one story.
  - `bun rewrite:publish --story <slug>` — flip the latest draft to live.
- **Before reporting a task done:** run `mise exec -- bun check:all` and (for UI work) verify the change in a browser.

---

## IX. Lessons Learned (self-learning log)

Append-only. When the user corrects me, **I ask** whether to add a lesson here. Format: one-line rule + one-line reason. Newest at the top.

<!-- LESSONS:START -->

- **Pivoted from "annotate, never rewrite" (Product A) to "AI-rewritten neutral German news" (Product B).** Reason: the operator explicitly chose Product B after seeing Product A built and after seeing a Ground News screenshot showing Ground News *does not* do AI rewrites. Accepted: bias-substitution risk (Claude's neutral is its training-data neutral), Presserecht risk (disclaimer-only, personal liability), and the legal hold on the body scraper until media-lawyer review. The old "AI annotates framing, AI does not rewrite" lesson is **deliberately reversed** by this decision.
- **Run bun via mise, not bare.** Reason: Bun version is pinned in `mise.toml`; bare `bun` may resolve to a different installed version.
- **Don't write version numbers into CLAUDE.md.** Reason: they rot. The lockfiles and `mise.toml` are the source of truth.
- **Run `mise exec -- bun check:all` before declaring a step done.** Reason: this is the project's definition of "ready".
- **Drizzle-kit metadata snapshots can need hand-fixes for parent-id collisions.** Reason: a previous hand-rolled 0000 migration had a zero-UUID `id`, which collided with the 0001 snapshot's `prevId`. The fix is metadata only (snapshot JSON), not the generated SQL — never hand-edit the SQL.
- **The voyageai Node SDK ESM build is broken under Next.js bundling.** Reason: directory imports without extensions throw at page-data collection. Use direct fetch against `https://api.voyageai.com/v1/embeddings` instead.
- **Cap per-outlet article ingest tightly.** Reason: each article triggers 3 sequential AI calls (1 Voyage + 2 Claude). Without a per-run cap, ingest exceeds Vercel function timeouts on cold DBs. `MAX_NEW_ARTICLES_PER_OUTLET` in `src/lib/constants.ts` is the lever.

<!-- LESSONS:END -->

---

## X. How this file evolves

- **Vision/scope changes** (Sections I–III): only on explicit user instruction. The Product B pivot was an explicit instruction (May 2026).
- **Tech stack** (Section IV): update when a dependency is added/removed; never add version numbers.
- **Tooling rules** (Section VI): only on explicit user instruction.
- **Lessons Learned** (Section IX): when the user corrects me, I ask "Add this to CLAUDE.md?" and append on yes. I never silently edit this section.
