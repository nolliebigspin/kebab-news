# kebab.news — Agent Working Document

This file is read by Claude Code on every session. It is the source of truth for vision, scope, hard rules, and lessons learned. Keep it tight. When the user corrects a mistake, ask whether to append a lesson to Section IX.

---

## I. Vision (the why)

kebab.news is a German-language news platform that clusters multiple reports about one event into a short, readable and transparent summary. It does **not** claim complete neutrality. Trust comes from visible evidence, uncertainties, disagreements, framing choices and version history.

**Stance:** *Sources first. No fake neutrality.* Facts, interpretation and uncertainty remain semantically distinct. Framing annotations are cautious analyses, never objective ratings of an outlet.

**Motto:** "Viele Quellen. Eine verständliche Zusammenfassung. Alle Unterschiede transparent." / "We wrapped the news."

**Audience:** German-speaking readers (DE/AT/CH) who want a quick entry point and the ability to inspect evidence and competing presentations.

**Why now:** Aggregators expose many links but rarely connect individual claims to evidence or explain uncertainty and framing in a readable German product.

**The product flow in one sentence:** outlets publish → we cluster → the system/editorial workflow creates a sourced draft → humans can review → we publish a versioned Story Summary → readers rate its quality and discuss context.

---

## II. Product Scope

The focused MVP is one vertical Story Summary slice plus supporting discovery and learning surfaces.

### Piece 1 — Discovery and source radar

The radar is the day's top clusters of German news. For each cluster:
- Show the original publisher headlines side-by-side across the political spectrum (taz / SZ / FAZ / Welt / NZZ / Junge Freiheit / Nius / öffentlich-rechtlich).
- Annotate possible framing language on source headlines and teasers.
- Show blind spots — which political lean(s) didn't cover it.

The homepage and `/artikel` are the primary discovery surfaces. Radar is a source-comparison tool.

### Piece 2 — Versioned Story Summary

Each public Story Summary includes a headline, short summary, longer paragraphs, sourced facts, uncertainties, source differences, framing annotations, original sources, quality ratings, sharing, comments and version/correction metadata. Topic selection is system/editorial; there is no community vote deciding coverage.

### Piece 3 — Learning and editorial workflow

The learning area teaches bias, framing and source literacy through concrete examples. `/redaktion` is server-authorized for moderators, editors and admins and starts as a read-only review dashboard.

We deliberately do **not** scrape article bodies. Same pattern as Ground News: headlines + teasers carry most of the framing signal, and skipping body scraping removes the open DE legal question around derivative works while keeping paywalled outlets (NZZ, FAZ) in the spectrum. See §VII.

The published Story Summary lives at `/artikel/[slug]` and always discloses both its origin (AI or manual) and its actual review state. A summary is shown as editorially reviewed only when `reviewed_at` and `reviewed_by` were set by an explicit publish decision. Original sources are always linked.

`/artikel` is the accumulating archive of published summaries, newest first.

### Out of scope for now

- Per-user vote weighting or trust scores
- Multi-language rewrites (German output only)
- Mobile app

---

## III. Core Feature Logic

### 1. Ingest pipeline (existing, manual)

`bun ingest:run` → fetch RSS feeds → for each new article: embed (Voyage `voyage-3-lite`, 512 dims) + annotate framing (Claude Opus 4.7) → cluster into stories by cosine similarity ≥ `DEFAULT_CLUSTER_THRESHOLD` within a `STORY_WINDOW_HOURS` window. Hard cap of `MAX_NEW_ARTICLES_PER_OUTLET` new articles per outlet per run, so cost is bounded.

All tunables live in `packages/core/src/constants.ts`. The ingest pipeline lives in `apps/worker/src/ingest.ts` (`runIngest()`), driven by the long-running worker's in-process scheduler (`apps/worker/src/index.ts`, `RUN_HOURS_UTC = [6,12,18]` — 07/13/19 CET, 08/14/20 CEST; we accept the 1h DST drift). There is no HTTP route and no Vercel-Cron anymore — the worker process *is* the trigger. `bun ingest:run` (→ `@kebab/worker ingest:once`) runs one pass manually against the same DB.

Cross-run story matching is built into the same ingest pass: when a new article is embedded, `runIngest` loads every story with `last_seen_at > now() - STORY_WINDOW_HOURS` as cluster candidates (not just stories from the current run) and either attaches via running-mean centroid update or opens a new story. A late outlet joining a story already in the window is the same code path as a first-run cluster.

### 2. Framing annotation

Source headline annotations retain the legacy offset format. Story Summary annotations use paragraph id + quote + optional prefix/suffix context so small text edits do not silently move a marker. Every annotation has evidence, confidence, origin and review status.

### 3. Reader interactions

`POST /api/summary-rating` sets, changes or removes one quality rating per user and published summary. `POST /api/comments` validates and authorizes comment creation, replies, owner edits/deletes, helpful votes and reports. Comments are readable without login and always rendered as plaintext. The old `/api/vote` and `votes` table are legacy compatibility only and are not a product surface.

### 4. Structured summary generation

`bun rewrite:run --story <slug>` runs:
1. Load all articles in the cluster (headline + teaser from RSS — no body scraping).
2. Build a structured input: per-outlet headline + teaser + political lean, ordered left → public via `LEAN_ORDER`.
3. Call Claude with the transparent-summary prompt (versioned in `packages/core/src/constants.ts`). Imported source text is explicitly untrusted.
4. Validate headline/body, short summary, sourced facts, uncertainties, differences and annotations with JSON Schema plus Zod. On parse failure, abort — never persist partial output.
5. Insert into `published_articles` as `published_at = NULL` (draft).

`bun rewrite:publish --story <slug> --reviewed-by <name>` publishes the latest reviewed draft and records the review receipt. `--unreviewed` is the explicit alternative. The command back-links `stories.published_article_id`, making that version visible at `/artikel/[slug]`.

### 5. Story surface

- `/artikel` — list of published rewrites (those with `published_at NOT NULL`), newest first.
- `/artikel/[slug]` — full progressive Story Summary with sources, uncertainty, differences, interactive framing explanations, quality feedback, sharing, history and comments.

---

## IV. Tech Stack

Versions are pinned in `mise.toml`, `package.json`, and `bun.lock`. Do not write versions into this document — read them from those files when needed.

- **Runtime / Package Manager:** Bun (managed via mise).
- **Monorepo:** Bun workspaces. `packages/env` (`@kebab/env`, pure Zod env validation via `@t3-oss/env-core`; `@kebab/env/load` is the side-effect dotenv loader for non-Next entrypoints), `packages/db` (`@kebab/db`, Drizzle schema + client + migrations), `packages/core` (`@kebab/core`, framework-agnostic cluster/embeddings/annotate/rewrite/constants), `packages/auth` (`@kebab/auth`, Better Auth instance + nodemailer mailer + the Next.js auth handler; consumed only by `apps/web`, never the worker), `apps/web` (`@kebab/web`, Next.js), `apps/worker` (`@kebab/worker`, ingest worker). `@kebab/*` imports replace the old `@/lib/*` aliases across packages; `@/*` still resolves within `apps/web`.
- **Framework:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui.
- **i18n:** next-intl, kept in place so other languages can be added later. For now German is the only shipped locale — English content was removed to focus on the German-speaking market. Strings live in `apps/web/messages/de.json`; the request config currently resolves to `de`.
- **Database:** Postgres + Drizzle ORM + `pgvector` (semantic clustering). Driver is `postgres-js` (standard wire protocol), so it runs against Neon today and any self-hosted Postgres later — switching providers is a `DATABASE_URL` change. The driver is encapsulated in `packages/db`; nothing else knows it.
- **Scheduled jobs:** long-running ingest worker (`apps/worker`) with an in-process scheduler (`RUN_HOURS_UTC`), deployed as a container (Dokploy). No HTTP route, no Vercel-Cron, no external queue.
- **AI — Embeddings:** Voyage AI (`voyage-3-lite`, 512 dims, direct HTTP).
- **AI — Framing annotation + transparent summary:** Claude (Anthropic API).
- **Auth:** Better Auth (passwordless magic-link), Drizzle adapter on the shared Postgres, email sent via SMTP (`nodemailer`). Encapsulated in `@kebab/auth`. Note: `kysely` is marked `serverExternalPackages` in `apps/web/next.config.ts` — it's a dead transitive dep of better-auth (we use the Drizzle adapter) whose sqlite dialects break Turbopack's build trace; externalizing stops it being parsed (see §IX).
- **Hosting:** Vercel (web app, root dir `apps/web`) + Dokploy (ingest worker container).
- **Quality:** Biome (lint + format), Vitest (tests).

Deferred until the product earns it: per-user trust scores, external job queues and full editorial write forms.

---

## V. Data Contract (Drizzle)

Current tables (in `packages/db/src/schema.ts`):

- `outlets` — id, slug, name, political_lean (enum), feed_url, homepage_url, created_at.
- `stories` — id, slug, label (= first article's headline, used as fallback before rewrite exists), first_seen_at, last_seen_at, centroid (vector 512), article_count.
- `articles` — source article metadata, RSS headline/teaser, language, primary/secondary kind, annotations, publication time, embedding and story assignment.

Summary and interaction tables:

- `published_articles` — append-only Story Summary versions. Alongside legacy headline/body it stores short summary, paragraph ids, facts, uncertainties, differences, annotations, status, origin and correction metadata.
- `summary_sources` — immutable article receipts for one summary version; evidence ids in structured content reference these article ids.
- `summary_ratings` — one `-1|1` quality rating per `(summary_id, user_id)` plus optional structured downvote reason.
- `comments`, `comment_helpful_votes`, `comment_reports` — threaded plaintext discussion with ownership, moderation and reporting.
- `share_events` — summary id, channel and timestamp only; no account, IP or user agent.
- `votes` — legacy topic votes retained for migration compatibility, not surfaced.
- `stories.published_article_id` — nullable FK back-pointer added via migration.

Better Auth tables (canonical shapes, defined in the same `schema.ts` so drizzle-kit stays single-source — note `user.id` is **text**, not uuid):

- `user` — id (text PK), name, email (unique), email_verified (bool), image, created_at, updated_at.
- `session` — id (text PK), user_id (FK cascade), token (unique), expires_at, ip_address, user_agent, created_at, updated_at.
- `account` — id (text PK), user_id (FK cascade), account_id, provider_id, OAuth/password columns (unused by magic-link but expected by the adapter), created_at, updated_at.
- `verification` — id (text PK), identifier, value, expires_at, created_at, updated_at. Reused by the magic-link plugin for its tokens; no extra table.

---

## VI. Tooling Rules (HARD)

These are non-negotiable. Violating them is the most common mistake — see Section IX.

1. **Bun runs through mise, always.** Never invoke bare `bun`, `npm`, `pnpm`, or `yarn`. Always `mise exec -- bun ...` or `mise run ...`. The version is pinned in `mise.toml`.
2. **No other package managers.** This is a Bun project. No `npm install`, no `pnpm`, no `yarn`.
3. **Finishing a step requires `mise exec -- bun check:all`.** Before declaring any coding step complete, run it. Fix what it reports.
4. **DB migrations are generated, never hand-edited.** Run `mise exec -- bun db:generate` after schema changes, then `mise exec -- bun db:migrate`. Do not edit the generated SQL files in `packages/db/drizzle/` by hand. The metadata snapshots in `packages/db/drizzle/meta/` are also generated; the only time you touch them is to repair a known-broken chain (see §IX).
5. **No AI calls in the web app.** All AI work runs in the worker or operator commands. Page renders and reader-interaction routes never call a model.
6. **Rewrite output is structured.** Claude is called with `output_config.format: { type: "json_schema", ... }`. The output is Zod-validated before persistence. On parse failure, the rewrite is aborted and logged — never saved as partial garbage.
7. **Generation and review disclosure is mandatory.** Every `/artikel/[slug]` page states whether the summary is AI-generated or manual and whether it has been editorially reviewed. Never present generated content as reviewed without both `reviewed_at` and `reviewed_by`.
8. **Original sources are always visible.** Every published article has a "Quellen" section listing every outlet that fed the rewrite, with link-outs. No rewrite ships without sources.
9. **No body scraping.** v1 uses only RSS headlines + teasers — for the rewrite input, for the radar UI, for everything. Same pattern as Ground News. Removing this constraint requires editing this rule and reopening the DE press-law question in §VII first.
10. **German only (for now).** Reusable interface strings belong in `messages/de.json`; long page-specific editorial copy may be colocated with its German-only route. next-intl stays wired for a later locale expansion.
11. **Design aesthetic:** professional, scientific, slate-blue/white. Clarity over clutter. No "news site" chrome (no breaking-news red, no urgency framing). The rewrite UI reads more like a research paper than like a newspaper.

---

## VII. Legal / DE Compliance Notes

The agent should flag these before merging anything that touches them. **The legal posture changed materially with the Product B pivot — read this section carefully.**

- **"Tool, not portal" is a positioning choice, not a legal shield.** We present kebab.news as an information tool, but Presserecht / Persönlichkeitsrecht attach to what the tool *does* — publishing statements about named persons — not to the label. Don't oversell the framing as if it removed the obligations.
- **The real exposure is wrong AI statements about identifiable people.** Generating coverage of named persons/organizations triggers Sorgfaltspflicht. Mitigation in the product: the rewrite prompt (`REWRITE_SYSTEM_PROMPT`, `REWRITE_PROMPT_VERSION` v2+) requires source-attributed, subjunctive phrasing ("laut X") for any claim about a person and forbids inventing facts. Keep this constraint when editing the prompt.
- **Disclosure or review alone does not eliminate liability.** A visible generation/review status does not remove responsibility for factually wrong statements about identifiable people.
- **Run it through a company, not personally.** The intent is to operate the platform via the operator's company (e.g. UG/GmbH) so press-law liability and finances sit with the legal entity rather than the operator privately. Until that's set up, the Impressum still names a private operator and personal liability stands — flag this before public livegang.
- **We don't scrape article bodies.** RSS headlines + teasers only. This removes the open DE derivative-work question, keeps paywalled outlets (NZZ, FAZ) in the spectrum, and matches Ground News' pattern. If body scraping is ever reintroduced, the legal question reopens and requires media-lawyer review before any `/artikel/[slug]` is publicly deployed.
- **Press snippet right (§ 87f ff. UrhG / Art. 15 DSM).** Headlines are generally unprotected; full RSS teasers may exceed "sehr kurze Auszüge". Ground News sits outside the EU regime — we can't copy it 1:1. If a verlag complains, the lever is to shorten or stop displaying teasers (teasers can stay internal for clustering/AI without being shown).
- **DSA / NetzDG:** named human moderation contact required if and when comments ship. Not required for the read-only article surface.
- **DSGVO — email + accounts are now collected (this reversed the v1 "no email" stance).** Voting requires a magic-link account, so we store the user's **email address** plus session records, on Art. 6(1)(b) (the login is a service the user requested). A **technically necessary session cookie** is set on login — Vercel Analytics stays cookieless, but the site is no longer fully cookie-free. The **SMTP provider that sends the login emails is a processor** — an AVV is required and it must be named in the Datenschutz page. No raw vote IPs persist anymore (the IP-hash mechanism was removed entirely). Provide an account-deletion path (Art. 17) via the Impressum contact. **Flag before public livegang:** confirm the chosen SMTP provider is EU/AVV-covered and the Datenschutz wording matches the actual provider.
- **Impressum + Datenschutz pages exist and carry real operator data** (`/impressum`, `/datenschutz`): Einzelunternehmen Alec Winter, Hamburg, Kleinunternehmer § 19 UStG; Datenschutz names Vercel (hosting + cookieless Analytics, EU), Neon (DB, EU), the email/account + session-cookie processing on Art. 6(1)(b), and the SMTP processor. A media-lawyer review before public livegang is still advisable, but the pages are no longer placeholders. Don't market the project as "gemeinnützig" — that's a Finanzamt status, not a self-label; the footer says "unabhängig".

---

## VIII. Workflow Conventions

- **Branching:** `develop` is the integration branch; `main` is release. Feature work via descriptive branches.
- **Commits:** scoped prefixes (`feat(rewrite): ...`, `feat(vote): ...`, `feat(radar): ...`, `fix(...)`, `docs(...)`). One logical change per commit.
- **Root scripts delegate into workspaces** via `bun --filter`. Run them from the repo root (`mise exec -- bun <script>`); the underlying script lives in `apps/worker` or `packages/db`.
  - `bun ingest:run` — one manual ingest pass (→ `@kebab/worker ingest:once`). Automatic ingest is the long-running worker (`bun worker`, or the deployed container).
  - `bun rewrite:run --story <slug>` — generate a draft rewrite for one story.
  - `bun rewrite:publish --story <slug> --reviewed-by <name>` — publish a reviewed draft; use `--unreviewed` only as an explicit alternative.
  - `bun seed:outlets` — idempotent upsert of the outlet set (currently 25, spanning left → public; the canonical list lives in `apps/worker/scripts/seed-outlets.ts`). Re-run after `db:reset --full`.
  - `bun db:reset` — wipe ingested data (articles, stories, votes, published_articles). Refuses non-dev DBs without `--force` and demands typed confirmation. `--full` also wipes outlets.
  - `bun worker` — start the long-running ingest worker (in-process scheduler). `RUN_ON_BOOT=true` runs one pass immediately on start.
- **Before reporting a task done:** run `mise exec -- bun check:all` (root, runs across all workspaces) and (for UI work) verify the change in a browser.

---

## IX. Lessons Learned (self-learning log)

Append-only. When the user corrects me, **I ask** whether to add a lesson here. Format: one-line rule + one-line reason. Newest at the top.

<!-- LESSONS:START -->

- **Voting now requires a magic-link account (Better Auth); the IP-hash/`VOTE_DAILY_SALT` model was removed.** Reason: operator chose real identity ("eine Person = eine Stimme") over IP-based spam-dampening. Votes are unique `(story_id, user_id)`, permanent (no day bucket). Auth lives in `@kebab/auth` (Better Auth + Drizzle adapter + nodemailer/SMTP). This **deliberately reverses** the §II "no accounts in v1 / accounts come later" stance and the §VII "no email collection" note — email + a session cookie are now collected (see §VII for the DSGVO consequences). `apps/web/lib/session.ts` reads the session; `POST /api/vote` 401s without one.
- **Better Auth + Drizzle gotchas (so they aren't rediscovered).** Reason: (1) `user.id` is **text**, not uuid → FKs to it (e.g. `votes.user_id`) must be `text`, or you get a runtime "column does not exist". (2) `drizzleAdapter` must be `provider: "pg"`. (3) The magic-link plugin reuses the core `verification` table — no extra table. (4) Auth tables are hand-defined in `packages/db/src/schema.ts` (not via the Better Auth CLI) so drizzle-kit stays the single migration source. (5) `apps/web` imports only `@kebab/auth`, never `better-auth/*` directly (better-auth is a dep of the auth package alone; the Next handler is re-exported as `authGET`/`authPOST`).
- **`kysely` is in `serverExternalPackages` even though we never use it.** Reason: better-auth's core statically imports from `@better-auth/kysely-adapter`, which lazily pulls three sqlite-dialect modules that import symbols removed in kysely 0.29 (`DEFAULT_MIGRATION_TABLE`). We use the Drizzle adapter on Postgres, so those paths never run — but Turbopack statically traces the lazy imports and the production build fails on the export mismatch. Marking `kysely` external (in `apps/web/next.config.ts`) stops Turbopack parsing it; dev mode was never affected. Do NOT stub the whole adapter (its `createKyselyAdapter`/`getKyselyDatabaseType` are statically imported and must exist).
- **Env-loading must not be a side-effect of `@kebab/env` (Next bundler chokes).** Reason: `new URL("../../../", import.meta.url)` / a filesystem `dotenv` call inside the env module breaks Turbopack ("Module not found: '../../../'"). Keep `@kebab/env` pure validation; load `.env` from non-Next entrypoints via `import "@kebab/env/load"`, and from web via `dotenv` in `apps/web/next.config.ts` (Next's project root is `apps/web`, so it won't auto-find the repo-root `.env`).
- **Monorepo (Bun workspaces) + long-running ingest worker replaced Vercel-Cron.** Reason: the whole ingest (25 outlets × ≤5 articles × 3 AI calls) ran synchronously in one Vercel function and only stayed under the timeout because of `MAX_NEW_ARTICLES_PER_OUTLET`. The pipeline moved to `apps/worker` (in-process scheduler, deployed as a Dokploy container); web (`apps/web`) only reads the DB + writes votes. Shared logic lives in `packages/{env,db,core}`. The DB driver switched neon-http → `postgres-js` so the provider is a `DATABASE_URL` change, not a rewrite. Merge/split clustering improvements were deliberately deferred to a follow-up.
- **Tests run via `mise exec -- bun run test` (vitest), never `bun test`.** Reason: `bun test` invokes Bun's native test runner, which lacks `vi.resetModules` and other Vitest APIs the suite uses — it reports false failures. The `test` script in `package.json` is the contract; always go through it.
- **German content only, but next-intl stays — English was removed to focus on the German-speaking market.** Reason: operator decision (commit 91c1a12). Only `messages/de.json` ships and the locale resolves to `de`, but the next-intl plumbing is kept intentionally so other languages can be added later. New strings go into `messages/de.json`.
- **No body scraping in v1 — RSS headlines + teasers only, like Ground News.** Reason: the operator confirmed after a second Ground News check that they also don't ingest bodies. Removes the open DE derivative-work question entirely, keeps paywalled outlets (NZZ, FAZ) in the spectrum, and skips per-outlet scraper maintenance. If the rewrite quality feels thin in practice, bodies become the upgrade path — but we need evidence first, not speculation.
- **German URL routes — `/articles` was renamed to `/artikel`.** Reason: operator decision — with English content gone, all routes are German for a consistent German-only surface (`/artikel`, `/radar`, `/vision`, `/impressum`, `/datenschutz`). This **deliberately reverses** the earlier "English URL routes" lesson. The DB table/variable `articles` is unrelated code and stays as-is.
- **Pivoted from "annotate, never rewrite" (Product A) to "AI-rewritten neutral German news" (Product B).** Reason: the operator explicitly chose Product B after seeing Product A built and after seeing a Ground News screenshot showing Ground News *does not* do AI rewrites. Accepted: bias-substitution risk (Claude's neutral is its training-data neutral) and Presserecht risk (disclaimer-only, personal liability). The old "AI annotates framing, AI does not rewrite" lesson is **deliberately reversed** by this decision.
- **Run bun via mise, not bare.** Reason: Bun version is pinned in `mise.toml`; bare `bun` may resolve to a different installed version.
- **Don't write version numbers into CLAUDE.md.** Reason: they rot. The lockfiles and `mise.toml` are the source of truth.
- **Run `mise exec -- bun check:all` before declaring a step done.** Reason: this is the project's definition of "ready".
- **Drizzle-kit metadata snapshots can need hand-fixes for parent-id collisions.** Reason: a previous hand-rolled 0000 migration had a zero-UUID `id`, which collided with the 0001 snapshot's `prevId`. The fix is metadata only (snapshot JSON), not the generated SQL — never hand-edit the SQL.
- **The voyageai Node SDK ESM build is broken under Next.js bundling.** Reason: directory imports without extensions throw at page-data collection. Use direct fetch against `https://api.voyageai.com/v1/embeddings` instead.
- **Cap per-outlet article ingest tightly.** Reason: each article triggers 3 sequential AI calls (1 Voyage + 2 Claude). Without a per-run cap, ingest exceeds Vercel function timeouts on cold DBs. `MAX_NEW_ARTICLES_PER_OUTLET` in `packages/core/src/constants.ts` is the lever.

<!-- LESSONS:END -->

---

## X. How this file evolves

- **Vision/scope changes** (Sections I–III): only on explicit user instruction. The Product B pivot was an explicit instruction (May 2026).
- **Tech stack** (Section IV): update when a dependency is added/removed; never add version numbers.
- **Tooling rules** (Section VI): only on explicit user instruction.
- **Lessons Learned** (Section IX): when the user corrects me, I ask "Add this to CLAUDE.md?" and append on yes. I never silently edit this section.
