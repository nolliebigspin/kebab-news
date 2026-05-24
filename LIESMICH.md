# kebab.news

> **Eine Geschichte. Eine neutrale Fassung. Alle Quellen sichtbar.**

kebab.news ist eine KI-redigierte Nachrichten-Redaktion für den deutschsprachigen Raum. Wir nehmen die wichtigsten Geschichten des Tages, schauen uns an, wie jedes Outlet über das politische Spektrum hinweg darüber berichtet, und veröffentlichen **eine neutrale, KI-umformulierte Fassung pro Geschichte** — mit jedem Originalartikel der Outlets als Beleg sichtbar darunter.

Wir sind kein Verlag mit Journalisten. Wir sind ein einzelner, möglichst rahmungsarmer Einstieg in die deutschsprachige Nachrichtenlage — mit allen Quellen weiterhin auf dem Tisch.

---

## Unsere Haltung

Wir versprechen keine Wahrheit. Wir versprechen **eine konsistente, neutral formulierte Fassung jeder Geschichte** plus die vollständige Originalberichterstattung der Outlets darunter. Wenn unsere Fassung anders klingt als das, was taz, FAZ oder Welt geschrieben haben, kannst du das mit einem Klick prüfen.

Jeder veröffentlichte Artikel trägt einen sichtbaren Hinweis: *„KI-generierte Zusammenfassung. Ungeprüft."*

> *Neutralität durch Umschreiben. Transparenz durch Quellenangabe.*

---

## Wie es funktioniert

### 1. Wir sammeln, was deutschsprachige Outlets veröffentlichen
Ein geplanter Ingest holt Schlagzeilen und Teaser von taz, SZ, FAZ, Welt, NZZ, Junge Freiheit, Nius, tagesschau und weiteren. Artikel werden über semantische Ähnlichkeit zu Geschichten geclustert — „dieselbe Nachricht" aus verschiedenen Outlets landet in einer Gruppe, egal wie sie der jeweilige Verlag betitelt hat.

### 2. Wir annotieren Framing in den Outlet-Schlagzeilen
Die KI markiert geladene Begriffe, emotionale Trigger, vorausgesetzte Annahmen, Euphemismen und auffällige Auslassungen — direkt auf den Originalschlagzeilen der Outlets. Die Originalschlagzeile bleibt sichtbar; die Annotation erklärt, *warum* diese Geschichte eine neutrale Fassung verdient.

### 3. Lesende stimmen ab, was neu geschrieben wird
Das Radar zeigt die wichtigsten Cluster des Tages. Lesende stimmen ab, welche Geschichte eine vollständige neutrale Fassung bekommen soll. Eine Stimme pro IP pro Tag pro Geschichte. Die Geschichte mit den meisten Stimmen wird ausgewählt.

### 4. Wir schreiben den Gewinner neutral um
Für die ausgewählte Geschichte holen wir die Schlagzeilen + Teaser aller Outlets, die darüber berichtet haben, schicken sie durch Claude mit einem strikten Prompt für neutrales Deutsch und erzeugen eine Schlagzeile und einen Text von etwa 200–400 Wörtern. Das Ergebnis wird unter `/articles/[slug]` veröffentlicht. Artikeltexte scrapen wir bewusst nicht — selbes Muster wie Ground News.

### 5. Quellen bleiben sichtbar
Jeder veröffentlichte Artikel hat unterhalb der Umschreibung einen „Quellen"-Bereich — jeder Originalartikel der Outlets, sein Lean-Label, seine Framing-Markierungen und ein Link nach außen. Wenn unsere Fassung schräg klingt, kannst du das prüfen.

---

## Tech-Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, TypeScript)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Sprache:** [next-intl](https://next-intl.dev/) — Deutsch primär, Englisch sekundär
- **Datenbank:** [Neon](https://neon.tech/) Postgres + [Drizzle ORM](https://orm.drizzle.team/) + `pgvector`
- **Geplante Jobs:** Vercel Cron
- **KI — Embeddings:** [Voyage AI](https://www.voyageai.com/) (`voyage-3-lite`, 512 Dimensionen) fürs Clustern
- **KI — Framing-Annotation & neutrale Umschreibung:** [Claude](https://www.anthropic.com/) (`claude-opus-4-7`)
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
mise exec -- bun ingest:run                        # Feeds holen, clustern, annotieren
mise exec -- bun rewrite:run --story SLUG          # neutralen Entwurf erzeugen
mise exec -- bun rewrite:publish --story SLUG      # Entwurf live schalten
mise exec -- bun rewrite:spike                     # echte Umschreibungen nach tmp/ für Review
mise exec -- bun seed:outlets                      # idempotenter Upsert der 8 Outlets
mise exec -- bun db:reset                          # ingestete Daten löschen (verweigert Nicht-Dev-DBs)
```

Bevor eine Änderung als fertig gilt:

```bash
mise exec -- bun check:all      # Imports, Format, Lint, Typecheck
```

> Alle Befehle laufen über `mise exec --`. Bare `bun` / `npm` / `pnpm` / `yarn` benutzen die falsche Runtime.

---

## Eine Anmerkung zu Recht und Bias

Das hier ist ein Ein-Personen-Open-Source-Experiment, kein lizenziertes Medienhaus. Zwei ehrliche Hinweise:

- **Claudes „neutral" ist das Neutral seiner Trainingsdaten.** Deutsche KI-Umschreibungen tendieren stilistisch in Richtung öffentlich-rechtlicher Berichterstattung und übersetzter angelsächsischer Texte. Wir tun nicht so, als wäre das nicht so — die Original-Outlet-Fassungen sind immer einen Klick entfernt.
- **Die Veröffentlichung von KI-Umschreibungen über identifizierbare Personen löst presserechtliche Pflichten aus** (Sorgfaltspflicht, Persönlichkeitsrechte). Der Hinweis ist Ehrlichkeitsgebot, kein Rechtsschutz. Der Betreiber übernimmt persönlich die Haftung.

---

## Open Source & Mitmachen

kebab.news ist MIT-lizenziert und wird offen entwickelt. Wir suchen Entwickler, Datenanalysten, Journalisten und Faktenchecker — besonders Menschen mit Erfahrung in deutschem Medienrecht, in Primärquellen-Archiven (Bundestag, Destatis, EUR-Lex) oder in NLP für die deutsche Sprache.

- **Status:** Vision & Prototyping
- **Lizenz:** MIT
- **Kontakt:** siehe `CONTRIBUTING.md`

---

*Gemacht für deutschsprachige Lesende (DE / AT / CH), die einen neutralen Einstieg in die Nachrichtenlage wollen — mit den Originalquellen immer einen Klick entfernt.*
