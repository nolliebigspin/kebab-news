# kebab.news

> **We don't tell you what to think. We show you where the information comes from.**

kebab.news is a German-language **news verification interface**. We push back against framing, emotional rhetoric, and the agenda-setting of conventional news outlets by making **how a story is told** visible alongside **what the primary sources actually say**.

We are not a publication. We are a tool.

---

## Our stance: transparency over neutrality

We do not claim to be neutral. We make selection decisions too — which sources to include, which questions to ask, which perspectives to surface. No platform escapes this.

What we do instead: we **expose every step**. The framing, the sources, the AI prompts, the things we chose not to include. You can follow along, question it, and disagree — with evidence, not vibes.

> *Transparency over neutrality. Verifiability over authority. Structure over narrative.*

---

## What we're building (in two layers)

We ship in two layers. They're separate features, not one big thing.

### Layer 1 — Radar (MVP)

A German-language **multi-source aggregator**. The same story, side-by-side, across the political spectrum (taz / SZ / FAZ / Welt / NZZ / Junge Freiheit / Nius / öffentlich-rechtlich and more). Framing differences highlighted. Blind spots — what one side isn't covering — surfaced explicitly.

No AI-generated articles. AI is used only for clustering stories, detecting framing language, and linking to primary sources where available.

**Why:** Ground.news solved this for English. Nobody serves it in German. That's the gap.

### Layer 2 — Verification Loop (post-MVP)

For topics the community votes worth investigating, we run AI-assisted **research over primary sources** — Bundestag-Drucksachen, Destatis, BMF-Haushalt, RKI/PEI, EU documents, court rulings. The output is structured Fact-Cards: every claim hoverable, linked directly to its source, with explicit uncertainty labels where data is contested or thin.

The AI summarizes and links. It does not opine. Every step is shown to the reader: prompt used, sources consulted, sources excluded, whether a human verified.

---

## How it works

### 1. Community decides the questions
Users propose verifiable questions. A weekly budget of votes ("Fact-Pips") routes attention. **The community decides what is worth investigating — not what the answer is.**

### 2. Framing is annotated, not rewritten
When you submit a question, AI flags loaded language and presupposed framing. **You** rewrite it. We don't replace your bias with the model's training-data bias and call it neutral.

### 3. Sources are the product
- **Radar:** spectrum coverage with framing annotations.
- **Fact-Cards (Layer 2):** every claim links to a primary document. Conflicts are labeled "widersprüchliche Quellen", thin data is labeled "Datenlage unklar". Gaps are visible, not hidden.
- **Methodology section:** which sources were used, which were excluded, when the data was collected, who verified.

### 4. Discussion is moderated openly
Comments can be up- and down-voted. Heavily-downvoted comments collapse with a "Low quality" label — content stays accessible. Human moderation contact is named and reachable (this is also a DSA / German legal obligation, not just a nice-to-have).

---

## Tech stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, TypeScript)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **i18n:** [next-intl](https://next-intl.dev/) — German first, English secondary
- **Auth:** [Better Auth](https://better-auth.com/) (Magic Link only)
- **Database:** [Neon](https://neon.tech/) Postgres + [Drizzle ORM](https://orm.drizzle.team/) + `pgvector`
- **Background jobs:** [Upstash QStash / Workflows](https://upstash.com/) (mandatory for any AI work — never in route handlers)
- **AI:** [Claude](https://www.anthropic.com/) (Anthropic API)
- **Hosting:** [Vercel](https://vercel.com/)
- **Tooling:** [Bun](https://bun.sh/) (managed via [mise](https://mise.jdx.dev/)), [Biome](https://biomejs.dev/), [Vitest](https://vitest.dev/)

Dependency versions live in `package.json` / `mise.toml` — not in this README.

---

## Run it locally

```bash
mise install                    # installs the pinned Bun version
mise exec -- bun install        # installs npm deps
mise exec -- bun dev            # starts the dev server
```

Before declaring any change done:

```bash
mise exec -- bun check:all      # imports, format, lint, typecheck
```

> All commands run through `mise exec --`. Bare `bun` / `npm` / `pnpm` / `yarn` will use the wrong runtime.

---

## Open source & contributing

kebab.news is MIT-licensed and developed in the open. We need developers, data analysts, journalists, and fact-checkers — especially anyone who has dealt with German media law, primary-source archives (Bundestag, Destatis, EUR-Lex), or NLP for German.

- **Status:** vision & prototyping
- **License:** MIT
- **Contact:** see `CONTRIBUTING.md`

---

*Made for German-speaking readers (DE / AT / CH) who want primary sources, not opinions.*
