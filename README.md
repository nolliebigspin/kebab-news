# kebab.news

> **Viele Quellen. Eine verständliche Zusammenfassung. Alle Unterschiede transparent.**

kebab.news bündelt Originalbeiträge zum selben Thema und veröffentlicht daraus verständliche Artikel. Es verspricht keine vollständige Neutralität, sondern zeigt Belege, Unsicherheiten, Unterschiede, mögliche Rahmungen und Korrekturen.

## Product

- `/` — aktuelle veröffentlichte Artikel
- `/themen` — Themen mit Quellenvergleich, Originalbeiträgen und Blindstellen
- `/artikel` — Archiv der veröffentlichten Artikel
- `/artikel/[slug]` — kurze und ausführliche Zusammenfassung, Fakten, offene Fragen, Quellenunterschiede, Framing-Hinweise, Originalbeiträge, Bewertung, Teilen und Kommentare
- `/lernen` — short lessons about bias, framing and source literacy
- `/methodik` — public methodology and limitations
- `/ueber-uns` — Haltung und Produktidee
- `/redaktion` — server-authorized review dashboard for moderators, editors and admins

Die Themenauswahl ist eine System-/Redaktionsentscheidung. Leser stimmen nicht über die Abdeckung ab; angemeldete Leser bewerten die Qualität veröffentlichter Artikel und können Kontext kommentieren.

## Architecture

- **Web:** Next.js App Router, TypeScript, Tailwind CSS, next-intl
- **Data:** Postgres, Drizzle ORM and pgvector
- **Auth:** Better Auth passwordless magic links
- **Worker:** long-running Bun process for RSS ingest, embeddings, clustering, framing analysis and structured summary generation
- **AI seams:** Voyage embeddings and Claude structured outputs
- **Quality:** Vitest, TypeScript and Biome

The structured summary contract lives in `packages/core/src/story-summary.ts`. Important module seams, versioning and safety decisions are documented in [`docs/architecture/product-mvp.md`](docs/architecture/product-mvp.md).

## Trust and safety

- Original sources stay visible and linked.
- AI output is JSON-schema constrained and Zod validated before persistence.
- Imported source text is untrusted input; embedded instructions never override the worker prompt.
- Public story reads require a publication timestamp; drafts remain private.
- User content is validated plaintext and rendered without raw HTML.
- Share analytics store only summary, channel and timestamp.
- The current pipeline imports RSS headlines and teasers, not full article bodies.

Jeder Artikel weist aus, ob er automatisch oder manuell erstellt und ob er redaktionell geprüft wurde. Das schafft Transparenz, ist aber weder Haftungsausschluss noch Qualitätsgarantie.

## Local development

```bash
mise install
mise exec -- bun install
mise exec -- bun db:migrate
mise exec -- bun dev
```

Operator commands:

```bash
mise exec -- bun ingest:run
mise exec -- bun rewrite:run --story <story-slug>
mise exec -- bun rewrite:publish --story <story-slug> --reviewed-by <name>
# or make the unreviewed state explicit:
mise exec -- bun rewrite:publish --story <story-slug> --unreviewed
mise exec -- bun seed:outlets
```

Before declaring a change ready:

```bash
mise exec -- bun check:all
mise exec -- bun run test
mise exec -- bun run build
```

Always run Bun through `mise exec --`; the repository pins its runtime version there.

## Before public launch

The German legal posture needs professional review. In particular, verify the operating entity, press-law obligations, quote/snippet usage, SMTP and hosting processor agreements, privacy wording, account deletion flow and a named human moderation contact.

MIT licensed. See [CONTRIBUTING.md](CONTRIBUTING.md).
