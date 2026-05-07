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

## II. Product Scope (MVP-honest, two layers)

The product ships in two layers. Don't conflate them in code or UX.

### Layer 1 — Radar (MVP, ship first)
A German-language **multi-source aggregator** that shows the same story across the political spectrum (taz / SZ / FAZ / Welt / NZZ / Junge Freiheit / Nius / öffentlich-rechtlich), highlights framing differences, and surfaces blindspots. **No AI-generated articles.** AI is used only to cluster stories, detect framing language, and link to primary sources where available.

### Layer 2 — Verification Loop (post-MVP)
Community-voted deep dives where AI **summarizes primary sources** (Bundestag-Drucksachen, Destatis, BMF-Haushalt, RKI/PEI, EU-Dokumente) for a topic. Output is structured Fact-Cards with 1:1 source links — never opinion essays. Every AI step is shown to the user (prompt, sources used, sources excluded).

**Hard scope rule:** AI never writes articles in the journalistic sense. AI extracts, clusters, and links. Humans (community + editors) decide what is interesting.

---

## III. Core Feature Logic

### 1. Framing Annotation (replaces "Objectivity Filter")
- User submits a topic/question.
- AI **annotates** loaded terms, emotional triggers, and presupposed framing — does **not** rewrite.
- User edits the framing themselves. The Aha moment is theirs, not the AI's.
- Rationale: an AI-rewritten "neutral" version replaces user framing with model-training-data framing. That is the failure mode we exist to fight.

### 2. Voting (Fact-Pips)
- 10 weekly Fact-Pips per user.
- Pips are spent on topics worth investigating, not on opinions.
- A topic crossing a threshold triggers Layer 2 research.
- **No persistent per-user trust score.** (Reads as social credit; legally and reputationally risky in DE context.)

### 3. Perspective Mapping (Radar UI)
- For each story cluster, show coverage from across the spectrum side-by-side.
- Highlight framing deltas (word choice, what is omitted, what is foregrounded).
- Identify blindspots (which side isn't covering it).

### 4. Fact-Cards (Layer 2)
- MDX with hoverable claims linking to primary sources (PDF, gov-link, dataset).
- Explicit uncertainty labels: "Datenlage unklar", "widersprüchliche Quellen".
- Methodology section per card: sources used, sources excluded, data date, AI-vs-human verification.

### 5. Comments
- Up/down votes. Comments at `-10` collapse with a "Low quality" label, content remains accessible.
- **Moderation is a legal obligation (DSA Art. 16, NetzDG legacy):** community downvotes alone are not sufficient. Named, reachable human moderation is required before public launch.

---

## IV. Tech Stack

Versions are pinned in `mise.toml`, `package.json`, and `bun.lock`. Do not write versions into this document — read them from those files when needed.

- **Runtime / Package Manager:** Bun (managed via mise).
- **Framework:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui.
- **i18n:** next-intl. German is the primary locale; English is secondary.
- **Database:** Neon (Serverless Postgres) + Drizzle ORM + `pgvector` (semantic clustering of stories).
- **Auth:** Better Auth (Magic Link / Passwordless only — no passwords, no social login).
- **Background Jobs:** Upstash QStash / Workflows. **Mandatory** for any task > 30s (AI research, crawling, embedding).
- **AI:** Claude (Anthropic API). When building AI features, default to the latest and most capable Claude model.
- **Hosting:** Vercel.
- **Quality:** Biome (lint + format), Vitest (tests).

---

## V. Data Contract (Drizzle)

- `users`: id, email. (No trust_score.)
- `topics`: id, original_title, annotated_title, category, status (`voting` | `researching` | `published`), author_id.
- `votes`: id, user_id, topic_id, weight, week_number.
- `comments`: id, topic_id, user_id, content, votes_count.
- `fact_cards`: id, topic_id, mdx_content, sources (jsonb).
- `sources`: id, outlet, political_lean, url, published_at — for the Radar layer.

---

## VI. Tooling Rules (HARD)

These are non-negotiable. Violating them is the most common mistake — see Section IX.

1. **Bun runs through mise, always.** Never invoke bare `bun`, `npm`, `pnpm`, or `yarn`. Always `mise exec -- bun ...` or `mise run ...`. The version is pinned in `mise.toml`; bypassing mise risks version drift.
2. **No other package managers.** This is a Bun project. No `npm install`, no `pnpm`, no `yarn`.
3. **Finishing a step requires `mise exec -- bun check:all`.** Before declaring any coding step complete, run it. Fix what it reports. This is the equivalent of "tests pass" for this project.
4. **DB migrations are generated, never hand-edited.** Run `mise exec -- bun db:generate` after schema changes, then `mise exec -- bun db:migrate`. Do not edit the generated SQL files in `drizzle/` by hand.
5. **No AI calls in route handlers.** All AI work is dispatched as an Upstash Workflow / QStash job. Route handlers enqueue and return.
6. **Primary sources only.** When prompting Claude for research, instruct it to ignore secondary reporting and cite raw documents (PDFs, datasets, gov-links). If no primary source exists, the topic is flagged "Unverifizierbar" — never produce a weak article.
7. **German first.** New user-facing strings go into `messages/de.json` first, then `en.json`. Default examples and UX copy in German.
8. **Design aesthetic:** professional, scientific, slate-blue/white. Clarity over clutter. No "news site" chrome (no breaking-news red, no urgency framing).

---

## VII. Legal / DE Compliance Notes

The agent should flag these before merging anything that touches them:

- **DSA / NetzDG:** named human moderation contact required before public launch.
- **Impressum + Transparenzbericht** required (Vercel domain alone is not sufficient).
- **Presserecht / Sorgfaltspflicht:** if Layer 2 ever produces statements about identifiable people, journalistic care obligations apply. Prefer "the document says X" over "person Y did X".
- **DSGVO:** Magic Link auth means email is PII. No analytics that fingerprints users. Vercel Analytics is in use — keep it cookie-less.

---

## VIII. Workflow Conventions

- **Branching:** `develop` is the integration branch; `main` is release. Feature work via descriptive branches.
- **Commits:** GSD-style scoped prefixes (`feat(01-05): ...`, `fix(...)`, `docs(...)`). One logical change per commit.
- **Planning docs** live in `.planning/`. Read them before starting non-trivial work.
- **Before reporting a task done:** run `mise exec -- bun check:all` and (for UI work) verify the change in a browser.

---

## IX. Lessons Learned (self-learning log)

Append-only. When the user corrects me, **I ask** whether to add a lesson here. Format: one-line rule + one-line reason. Newest at the top.

<!-- LESSONS:START -->

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
