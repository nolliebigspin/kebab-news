# kebab.news

> **Wir sagen dir nicht, was du denken sollst. Wir zeigen dir, woher die Information kommt.**

kebab.news ist eine **Verifikationsschnittstelle für deutschsprachige Nachrichten**. Wir arbeiten gegen Framing, emotionale Sprache und die Themensetzung klassischer Nachrichtenportale, indem wir sichtbar machen, **wie** über etwas berichtet wird — und parallel, **was die Primärquellen tatsächlich hergeben**.

Wir sind kein Nachrichtenmedium. Wir sind ein Werkzeug.

---

## Unsere Haltung: Transparenz statt Neutralität

Wir behaupten nicht, neutral zu sein. Auch wir treffen Entscheidungen — welche Quellen wir einbeziehen, welche Fragen wir stellen, welche Perspektiven wir zeigen. Keine Plattform entkommt dem.

Was wir stattdessen tun: wir **machen jeden Schritt sichtbar**. Die Rahmung, die Quellen, die KI-Prompts, das, was wir bewusst nicht einbezogen haben. Du kannst nachvollziehen, hinterfragen und widersprechen — mit Belegen, nicht mit Bauchgefühl.

> *Transparenz statt Neutralität. Nachvollziehbarkeit statt Autorität. Struktur statt Narrativ.*

---

## Was wir bauen

Wir starten als **SLC — Simple, Lovable, Complete**. Eine Sache, gut gemacht, bevor irgendetwas anderes dazukommt.

### v1 — Radar

Ein nur-lesendes, deutschsprachiges **Multi-Quellen-Radar**. Dieselbe Geschichte, nebeneinander, über das politische Spektrum hinweg (taz / SZ / FAZ / Welt / NZZ / Junge Freiheit / Nius / öffentlich-rechtlich und mehr). Framing-Unterschiede direkt an den Schlagzeilen der jeweiligen Outlets hervorgehoben. Blindstellen — was eine Seite *nicht* berichtet — explizit benannt.

Keine KI-generierten Artikel. Keine Nutzerkonten. Keine Kommentare. KI dient ausschließlich dem Clustern von Geschichten und dem Annotieren von Framing-Sprache auf den Schlagzeilen selbst.

**Warum:** Ground.news hat das für den englischsprachigen Raum gelöst. Im deutschsprachigen Raum macht es niemand. Das ist die Lücke.

### Später — Verifikationsschleife

Sobald das Radar es verdient hat, kommt eine community-getriebene Recherche-Schicht dazu. Für Themen, die untersuchenswert sind, läuft eine KI-gestützte **Recherche über Primärquellen** — Bundestag-Drucksachen, Destatis, BMF-Haushalt, RKI/PEI, EU-Dokumente, Gerichtsurteile. Das Ergebnis sind strukturierte Fact-Cards: jede Aussage hovergenau verlinkt auf ihre Quelle, mit expliziten Unsicherheits-Labels, wo die Datenlage dünn oder widersprüchlich ist.

Die KI fasst zusammen und verlinkt. Sie kommentiert nicht. Jeder Schritt ist für die Lesenden einsehbar: verwendeter Prompt, herangezogene Quellen, ausgeschlossene Quellen, ob eine menschliche Prüfung stattgefunden hat.

---

## Wie es funktioniert (v1)

### 1. Spektrum-Berichterstattung, nebeneinander
Für jede Top-Geschichte des Tages zeigen wir, wie jedes Outlet darüber berichtet hat — über das politische Spektrum hinweg, auf einem Screen.

### 2. Framing wird annotiert, nicht umgeschrieben
Die KI markiert geladene Begriffe und implizite Rahmungen direkt an den Schlagzeilen der Outlets. Die Originalschlagzeile bleibt sichtbar. Wir ersetzen nicht die eine Voreingenommenheit durch die eines Sprachmodells und nennen das dann neutral.

### 3. Quellen sind das Produkt
Jedes Cluster verlinkt zurück auf die Originalartikel der Outlets. Blindstellen — Outlets, die eine Geschichte nicht berichtet haben — werden gezeigt, nicht versteckt.

### 4. Methodik ist sichtbar
Welche Outlets sind enthalten, welche Feeds, wie funktioniert das Clustering, wann wurden die Daten zuletzt aktualisiert.

---

## Tech-Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, TypeScript)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Sprache:** [next-intl](https://next-intl.dev/) — Deutsch primär, Englisch sekundär
- **Datenbank:** [Neon](https://neon.tech/) Postgres + [Drizzle ORM](https://orm.drizzle.team/) + `pgvector`
- **Geplante Jobs:** Vercel Cron (keine externe Queue in v1)
- **KI:** [Claude](https://www.anthropic.com/) (Anthropic API)
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

Bevor eine Änderung als fertig gilt:

```bash
mise exec -- bun check:all      # Imports, Format, Lint, Typecheck
```

> Alle Befehle laufen über `mise exec --`. Bare `bun` / `npm` / `pnpm` / `yarn` benutzen die falsche Runtime.

---

## Open Source & Mitmachen

kebab.news ist MIT-lizenziert und wird offen entwickelt. Wir suchen Entwickler, Datenanalysten, Journalisten und Faktenchecker — besonders Menschen mit Erfahrung in deutschem Medienrecht, in Primärquellen-Archiven (Bundestag, Destatis, EUR-Lex) oder in NLP für die deutsche Sprache.

- **Status:** Vision & Prototyping
- **Lizenz:** MIT
- **Kontakt:** siehe `CONTRIBUTING.md`

---

*Gemacht für deutschsprachige Lesende (DE / AT / CH), die Primärquellen wollen, keine Meinungen.*
