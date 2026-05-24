# kebab.news

> **Eine Geschichte. Eine neutrale Fassung. Alle Quellen sichtbar.**

kebab.news is an AI-edited German news room. We take the day's most important stories, watch how every outlet across the political spectrum covers them, and publish **one neutral, AI-rewritten version per story** — with every original outlet article linked underneath as receipts.

We are not a publication run by journalists. We are a single, low-framing entry point into German news, with the sources visible.

---

## Our stance

We don't promise truth. We promise **one consistent neutrally-worded version of each story**, plus the original outlet coverage in full sight. If our rewrite reads differently than what taz, FAZ, or Welt published, you can click through and check.

Every published article carries a visible disclaimer: *"KI-generierte Zusammenfassung. Ungeprüft."*

> *Neutralität durch Rewriting. Transparenz durch Quellenangabe.*

---

## How it works

### 1. We collect what German outlets publish
Scheduled ingest pulls headlines and teasers from taz, SZ, FAZ, Welt, NZZ, Junge Freiheit, Nius, tagesschau, and more. Articles are clustered into stories using semantic similarity, so "the same news" from different outlets ends up in one group regardless of how each outlet headlined it.

### 2. We annotate framing on the source headlines
AI flags loaded language, emotional triggers, presuppositions, euphemisms, and omissions — directly on each outlet's headline. The original headline stays visible; the annotation explains *why* this story is worth a neutral rewrite.

### 3. Readers vote on what gets rewritten
The radar shows the day's top clusters. Readers vote on which stories deserve a full neutral rewrite. One vote per IP per day per story. The winning story of the day becomes the target.

### 4. We rewrite the winner, neutrally
For the selected story, we take the headlines + teasers from every outlet that covered it, feed them through Claude with a strict neutral-German rewrite prompt, and produce one headline + one ~200–400-word body. The output is published at `/articles/[slug]`. We deliberately don't scrape article bodies — same pattern as Ground News.

### 5. Sources stay visible
Every published article has a "Quellen" section underneath the rewrite — every original outlet article, its lean label, its framing annotations, and a link out. If our rewrite seems off, you can check.

---

## Tech stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, TypeScript)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **i18n:** [next-intl](https://next-intl.dev/) — German first, English secondary
- **Database:** [Neon](https://neon.tech/) Postgres + [Drizzle ORM](https://orm.drizzle.team/) + `pgvector`
- **Scheduled jobs:** Vercel Cron
- **AI — embeddings:** [Voyage AI](https://www.voyageai.com/) (`voyage-3-lite`, 512 dims) for story clustering
- **AI — framing annotation + neutral rewriting:** [Claude](https://www.anthropic.com/) (`claude-opus-4-7`)
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

Operator commands (v1 is manual on purpose):

```bash
mise exec -- bun ingest:run                    # pull feeds, cluster, annotate
mise exec -- bun rewrite:run --story SLUG      # generate a neutral rewrite draft
mise exec -- bun rewrite:publish --story SLUG  # flip the draft to live
mise exec -- bun rewrite:spike                 # dump real rewrites to tmp/ for human review
mise exec -- bun seed:outlets                  # idempotent upsert of the 8 outlets
mise exec -- bun db:reset                      # wipe ingested data (refuses non-dev DBs)
```

Before declaring any change done:

```bash
mise exec -- bun check:all      # imports, format, lint, typecheck
```

> All commands run through `mise exec --`. Bare `bun` / `npm` / `pnpm` / `yarn` will use the wrong runtime.

---

## A note on legal and bias

This is a one-person, open-source experiment, not a licensed media company. Two honest disclaimers:

- **Claude's "neutral" is its training data's neutral.** German AI rewrites lean toward the editorial style of public broadcasters and translated Anglosphere coverage. We don't pretend otherwise — the original outlet versions are always one click away.
- **Publishing AI rewrites about identifiable people triggers German press-law obligations** (Presserecht, Sorgfaltspflicht). The disclaimer is required honesty; it is not legal immunity. The operator accepts personal liability.

---

## Open source & contributing

kebab.news is MIT-licensed and developed in the open. We need developers, data analysts, journalists, and fact-checkers — especially anyone who has dealt with German media law, primary-source archives (Bundestag, Destatis, EUR-Lex), or NLP for German.

- **Status:** vision & prototyping
- **License:** MIT
- **Contact:** see `CONTRIBUTING.md`

---

*Made for German-speaking readers (DE / AT / CH) who want one neutral entry point into the day's news — with the original sources always one click away.*
