# kebab.news

> **Eine Geschichte. Eine neutrale Fassung. Alle Quellen sichtbar.**

kebab.news ist ein **Informations-Werkzeug**, kein Nachrichtenportal. Es nimmt die Geschichten des Tages, zeigt, wie Outlets über das politische Spektrum hinweg darüber berichten, und erstellt **eine neutrale, automatisch umformulierte Fassung pro Geschichte** — mit jedem Originalartikel der Outlets als Beleg sichtbar darunter.

Es wird nicht von Journalisten betrieben und ist keine Publikation. Es ist ein Werkzeug, das Framing und Bias sichtbar macht und daneben eine neutrale Lesart derselben Geschichte anbietet.

---

## Unsere Haltung

Wir versprechen keine Wahrheit. Das Werkzeug bietet **eine konsistente, neutral formulierte Fassung jeder Geschichte** plus die vollständige Originalberichterstattung der Outlets darunter. Wenn die Fassung anders klingt als das, was taz, FAZ oder Welt geschrieben haben, kannst du das mit einem Klick prüfen — maßgeblich sind die verlinkten Originale.

Jeder erzeugte Artikel trägt einen sichtbaren Hinweis: *„KI-generierte Zusammenfassung. Ungeprüft."*

> *Neutralität durch Umschreiben. Transparenz durch Quellenangabe.*

---

## Wie es funktioniert

### 1. Es sammelt, was deutschsprachige Outlets veröffentlichen
Ein geplanter Ingest holt Schlagzeilen und Teaser von rund 25 Outlets über das Spektrum links → öffentlich-rechtlich (taz, SZ, FAZ, Welt, NZZ, Junge Freiheit, Nius, tagesschau und weitere). Artikel werden über semantische Ähnlichkeit zu Geschichten geclustert — „dieselbe Nachricht" aus verschiedenen Outlets landet in einer Gruppe, egal wie sie der jeweilige Verlag betitelt hat.

### 2. Es annotiert Framing in den Outlet-Schlagzeilen
Die KI markiert geladene Begriffe, emotionale Trigger, vorausgesetzte Annahmen, Euphemismen und auffällige Auslassungen — direkt auf den Originalschlagzeilen der Outlets. Die Originalschlagzeile bleibt sichtbar; die Annotation erklärt, *warum* sich das Framing unterscheidet.

### 3. Lesende stimmen ab, was neu geschrieben wird
Das Radar zeigt die wichtigsten Cluster des Tages. Lesende stimmen ab, welche Geschichte eine vollständige neutrale Fassung bekommen soll. Eine Stimme pro IP pro Tag pro Geschichte. Die Geschichte mit den meisten Stimmen wird ausgewählt.

### 4. Es schreibt den Gewinner neutral um
Für die ausgewählte Geschichte holt das Werkzeug die Schlagzeilen + Teaser aller Outlets, die darüber berichtet haben, schickt sie durch Claude mit einem strikten Prompt für neutrales Deutsch und erzeugt eine Schlagzeile und einen Text (Ziellänge in `src/lib/constants.ts`). Aussagen über identifizierbare Personen werden ihrer Quelle zugeordnet und konjunktivisch formuliert („laut X"), nie als eigene Tatsache des Werkzeugs behauptet. Das Ergebnis wird unter `/artikel/[slug]` veröffentlicht. Artikeltexte scrapen wir bewusst nicht — selbes Muster wie Ground News.

### 5. Quellen bleiben sichtbar
Jeder erzeugte Artikel hat unterhalb der Umschreibung einen „Quellen"-Bereich — jeder Originalartikel der Outlets, sein Lean-Label, seine Framing-Markierungen und ein Link nach außen. Wenn die Fassung schräg klingt, kannst du das prüfen.

---

## Tech-Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, TypeScript)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Sprache:** [next-intl](https://next-intl.dev/) — vorerst nur Deutsch; die Infrastruktur bleibt, damit später weitere Sprachen ergänzt werden können
- **Datenbank:** [Neon](https://neon.tech/) Postgres + [Drizzle ORM](https://orm.drizzle.team/) + `pgvector`
- **Geplante Jobs:** Vercel Cron
- **KI — Embeddings:** [Voyage AI](https://www.voyageai.com/) (`voyage-3-lite`, 512 Dimensionen) fürs Clustern
- **KI — Framing-Annotation & neutrale Umschreibung:** [Claude](https://www.anthropic.com/) (`claude-sonnet-5`)
- **Hosting:** [Vercel](https://vercel.com/)
- **Werkzeuge:** [Bun](https://bun.sh/) (verwaltet über [mise](https://mise.jdx.dev/)), [Biome](https://biomejs.dev/), [Vitest](https://vitest.dev/)

Versionen stehen in `package.json` / `mise.toml` — nicht in diesem README.

---

## Lokal laufen lassen

```bash
mise install                    # installiert die festgelegte Bun-Version
mise exec -- bun install        # installiert die npm-Abhängigkeiten
mise exec -- bun dev            # startet den Dev-Server
```

Operator-Befehle (v1 ist absichtlich manuell):

```bash
mise exec -- bun ingest:run                        # Feeds holen, einbetten, clustern
mise exec -- bun rewrite:run --story SLUG          # neutralen Entwurf erzeugen (+ Quellen annotieren)
mise exec -- bun rewrite:publish --story SLUG      # Entwurf live schalten
mise exec -- bun seed:outlets                      # idempotenter Upsert der Outlet-Liste
mise exec -- bun db:reset                          # ingestete Daten löschen (verweigert Nicht-Dev-DBs)
```

Bevor eine Änderung als fertig gilt:

```bash
mise exec -- bun check:all      # Imports, Format, Lint, Typecheck
mise exec -- bun run test       # Vitest-Suite (NICHT `bun test`)
```

> Alle Befehle laufen über `mise exec --`. Bare `bun` / `npm` / `pnpm` / `yarn` benutzen die falsche Runtime. Tests laufen über `mise exec -- bun run test` (Vitest) — `bun test` startet Buns eigenen Runner und meldet falsche Fehler.

---

## Eine Anmerkung zu Recht und Bias

kebab.news versteht sich als **Informations-Werkzeug**, nicht als Medienpublikation — rechtlich knüpfen die Pflichten aber an das an, was das Werkzeug tut, nicht an seine Bezeichnung. Zwei ehrliche Hinweise:

- **Claudes „neutral" ist das Neutral seiner Trainingsdaten.** Deutsche KI-Umschreibungen tendieren stilistisch in Richtung öffentlich-rechtlicher Berichterstattung und übersetzter angelsächsischer Texte. Wir tun nicht so, als wäre das nicht so — die Original-Outlet-Fassungen sind immer einen Klick entfernt.
- **Das Erzeugen von Umschreibungen über identifizierbare Personen kann presserechtliche Pflichten auslösen** (Sorgfaltspflicht, Persönlichkeitsrechte). Der Hinweis ist Ehrlichkeitsgebot, kein Rechtsschutz. Die Plattform soll über ein Unternehmen laufen, damit Haftung und Finanzen bei der juristischen Person liegen statt bei einer Privatperson — vor dem öffentlichen Livegang die Deployment-Hinweise beachten.

---

## Open Source & Mitmachen

kebab.news ist MIT-lizenziert (siehe [`LICENSE`](LICENSE)) und wird offen entwickelt. Wir suchen Entwickler, Datenanalysten, Journalisten und Faktenchecker — besonders Menschen mit Erfahrung in deutschem Medienrecht, in Primärquellen-Archiven (Bundestag, Destatis, EUR-Lex) oder in NLP für die deutsche Sprache.

- **Status:** Vision & Prototyping
- **Lizenz:** MIT
- **Kontakt:** siehe `CONTRIBUTING.md`

---

*Gemacht für deutschsprachige Lesende (DE / AT / CH), die einen neutralen Einstieg in die Nachrichtenlage wollen — mit den Originalquellen immer einen Klick entfernt.*
