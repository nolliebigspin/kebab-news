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

## What we're building

We ship as an **SLC — Simple, Lovable, Complete**. One thing, done well, before adding anything else.

### v1 — Radar

A read-only German-language **multi-source radar**. The same story, side-by-side, across the political spectrum (taz / SZ / FAZ / Welt / NZZ / Junge Freiheit / Nius / öffentlich-rechtlich and more). Framing differences highlighted on publisher headlines. Blind spots — what one side isn't covering — surfaced explicitly.

No AI-generated articles. No user accounts. No comments. AI is used only for clustering stories and annotating framing language on the publisher headlines themselves.

**Why:** Ground.news solved this for English. Nobody serves it in German. That's the gap.

### Later — Verification Loop

Once the radar earns it, we add a community-voted research layer. For topics worth investigating, AI-assisted **research over primary sources** — Bundestag-Drucksachen, Destatis, BMF-Haushalt, RKI/PEI, EU documents, court rulings. The output is structured Fact-Cards: every claim hoverable, linked directly to its source, with explicit uncertainty labels where data is contested or thin.

The AI summarizes and links. It does not opine. Every step is shown to the reader: prompt used, sources consulted, sources excluded, whether a human verified.

---

## How it works (v1)

### 1. Spectrum coverage, side-by-side
For each top story of the day, we show how each outlet covered it — across the political spectrum, on one screen.

### 2. Framing is annotated, not rewritten
AI flags loaded language and presupposed framing on the publisher headlines. The original headline stays visible. We don't replace anyone's framing with the model's training-data framing and call it neutral.

### 3. Sources are the product
Every cluster links back to the original outlet articles. Blind spots — outlets that didn't cover a story — are shown, not hidden.

### 4. Methodology is visible
Which outlets are included, which feeds, how clustering works, when the data was last refreshed.

---

## Tech stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, TypeScript)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **i18n:** [next-intl](https://next-intl.dev/) — German first, English secondary
- **Database:** [Neon](https://neon.tech/) Postgres + [Drizzle ORM](https://orm.drizzle.team/) + `pgvector`
- **Scheduled jobs:** Vercel Cron (no external queue in v1)
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
