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

## Was wir bauen (in zwei Schichten)

Das Produkt entsteht in zwei Schichten. Sie sind getrennte Features, kein einzelnes großes Ding.

### Schicht 1 — Radar (MVP)

Ein deutschsprachiger **Multi-Quellen-Aggregator**. Dieselbe Geschichte, nebeneinander, über das politische Spektrum hinweg (taz / SZ / FAZ / Welt / NZZ / Junge Freiheit / Nius / öffentlich-rechtlich und mehr). Framing-Unterschiede werden hervorgehoben. Blindstellen — was eine Seite *nicht* berichtet — werden explizit benannt.

Keine KI-generierten Artikel. KI dient hier nur dem Clustern von Geschichten, dem Erkennen von Framing-Sprache und der Verlinkung von Primärquellen, sofern verfügbar.

**Warum:** Ground.news hat das für den englischsprachigen Raum gelöst. Im deutschsprachigen Raum macht es niemand. Das ist die Lücke.

### Schicht 2 — Verifikationsschleife (Post-MVP)

Für Themen, die die Community zur Untersuchung freigibt, läuft eine KI-gestützte **Recherche über Primärquellen** — Bundestag-Drucksachen, Destatis, BMF-Haushalt, RKI/PEI, EU-Dokumente, Gerichtsurteile. Das Ergebnis sind strukturierte Fact-Cards: jede Aussage hovergenau verlinkt auf ihre Quelle, mit expliziten Unsicherheits-Labels, wo die Datenlage dünn oder widersprüchlich ist.

Die KI fasst zusammen und verlinkt. Sie kommentiert nicht. Jeder Schritt ist für die Lesenden einsehbar: verwendeter Prompt, herangezogene Quellen, ausgeschlossene Quellen, ob eine menschliche Prüfung stattgefunden hat.

---

## Wie es funktioniert

### 1. Die Community wählt die Fragen
Nutzer schlagen prüfbare Fragen vor. Ein wöchentliches Stimmen-Budget ("Fact-Pips") lenkt die Aufmerksamkeit. **Die Community entscheidet, was untersuchenswert ist — nicht, was die Antwort sein muss.**

### 2. Framing wird annotiert, nicht umgeschrieben
Wenn du eine Frage einreichst, markiert die KI geladene Begriffe und implizite Rahmungen. **Du** schreibst die Frage um. Wir ersetzen deine Voreingenommenheit nicht durch die Voreingenommenheit eines Sprachmodells und nennen das dann neutral.

### 3. Quellen sind das Produkt
- **Radar:** Spektrum-Berichterstattung mit Framing-Hinweisen.
- **Fact-Cards (Schicht 2):** Jede Aussage verlinkt auf ein Originaldokument. Konflikte werden als "widersprüchliche Quellen" gekennzeichnet, dünne Datenlage als "Datenlage unklar". Lücken sind sichtbar, nicht versteckt.
- **Methodik-Sektion:** Welche Quellen wurden genutzt, welche ausgeschlossen, wann wurden die Daten erhoben, wer hat geprüft.

### 4. Diskussion wird offen moderiert
Kommentare können hoch- und runtergewählt werden. Stark herabgestufte Kommentare klappen mit "Niedrige Qualität" ein — der Inhalt bleibt zugänglich. Es gibt eine namentlich genannte, erreichbare menschliche Moderation (das ist auch eine DSA-/rechtliche Pflicht in DE, kein Nice-to-have).

---

## Tech-Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, TypeScript)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Sprache:** [next-intl](https://next-intl.dev/) — Deutsch primär, Englisch sekundär
- **Auth:** [Better Auth](https://better-auth.com/) (nur Magic Link)
- **Datenbank:** [Neon](https://neon.tech/) Postgres + [Drizzle ORM](https://orm.drizzle.team/) + `pgvector`
- **Hintergrundjobs:** [Upstash QStash / Workflows](https://upstash.com/) (Pflicht für jede KI-Arbeit — niemals in Route-Handlern)
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
