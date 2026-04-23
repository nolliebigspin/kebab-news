/* Seed data for unsere.news MVP prototype */

const TOPICS = [
  {
    id: "t-sondervermoegen",
    title: "Wohin fließen die 100 Mrd. € des Bundeswehr-Sondervermögens?",
    tag: "Haushalt",
    proposer: "redaktion",
    proposedAgo: "vor 6 Tagen",
    votes: 7340, goal: 7500,
    status: "voting",
    commentsN: 214,
    needed: "BMVg-Vergabedaten · Haushaltsausschuss-Protokolle",
  },
  {
    id: "t-glyphosat",
    title: "Glyphosat im Grundwasser — was zeigen die Messstellen?",
    tag: "Umwelt",
    proposer: "anna_k.",
    proposedAgo: "vor 3 Tagen",
    votes: 4821, goal: 5000,
    status: "voting",
    commentsN: 87,
    needed: "UBA, BfR, LANUV-Daten",
  },
  {
    id: "t-pflege",
    title: "Pflegenotstand in Zahlen: Personal­schlüssel vs. Engpässe",
    tag: "Gesundheit",
    proposer: "caregiver_de",
    proposedAgo: "vor 4 Tagen",
    votes: 3210, goal: 5000,
    status: "voting",
    commentsN: 52,
    needed: "PKV · GKV-Spitzenverband · Destatis",
  },
  {
    id: "t-mieten",
    title: "Miet­preise 2019–2026 in den 40 größten Städten",
    tag: "Wohnen",
    proposer: "j.mertens",
    proposedAgo: "vor 1 Woche",
    votes: 2104, goal: 5000,
    status: "voting",
    commentsN: 41,
    needed: "Mikrozensus · empirica · Mietspiegel-Rohdaten",
  },
  {
    id: "t-netz",
    title: "Wie belastbar ist das Stromnetz bei 80 % Erneuerbaren?",
    tag: "Energie",
    proposer: "lotte_w",
    proposedAgo: "vor 2 Wochen",
    votes: 1390, goal: 5000,
    status: "voting",
    commentsN: 29,
    needed: "BNetzA-Monitoring · ENTSO-E",
  },
  /* --- in progress --- */
  {
    id: "t-cum-ex",
    title: "Cum-Ex: Wie viel Steuergeld wurde bisher zurückgeholt?",
    tag: "Finanzen",
    votes: 6120, goal: 5000,
    status: "investigating",
    commentsN: 180,
    commissionedAgo: "vor 9 Tagen",
    progress: 62, // %
    progressLabel: "Primärquellen gesammelt · Redaktions-Review",
  },
  {
    id: "t-kita",
    title: "Wie viele Kita-Plätze fehlen wirklich in den Bundesländern?",
    tag: "Familie",
    votes: 5440, goal: 5000,
    status: "investigating",
    commentsN: 96,
    commissionedAgo: "vor 4 Tagen",
    progress: 24,
    progressLabel: "KI aggregiert Primärquellen",
  },
  /* --- done --- */
  {
    id: "t-wasserstoff",
    title: "Wasserstoff-Strategie 2030: Versprechen vs. Belege",
    tag: "Energie",
    votes: 6842, goal: 5000,
    status: "done",
    commentsN: 128,
    publishedAgo: "18.04.2026",
    sourcesN: 27,
    articleId: "a-wasserstoff",
  },
  {
    id: "t-tempo",
    title: "Tempolimit-Debatte: Was sagen die CO₂-Primärdaten?",
    tag: "Verkehr",
    votes: 5210, goal: 5000,
    status: "done",
    commentsN: 201,
    publishedAgo: "02.04.2026",
    sourcesN: 18,
    articleId: "a-tempo",
  },
];

const ARTICLE = {
  id: "a-wasserstoff",
  title: "Wasserstoff-Strategie 2030: Was versprochen wurde — was belegbar ist.",
  tag: "Energie",
  updated: "Geprüft heute, 09:14",
  published: "18. April 2026",
  votesWhenCommissioned: 6842,
  readtime: "14 min",
  summary:
    "Im Juli 2020 versprach die Bundes­regierung eine \u201eNationale Wasserstoff­strategie\u201c mit 9 Mrd. €. Wir gleichen jede Zusage mit Primär­quellen ab.",
  cards: [
    {
      kind: "claim",
      label: "Versprechen · Juli 2020",
      confidence: "primary",
      body:
        "\u201eBis 2030 werden in Deutschland Elektrolyseure mit mindestens 10 Gigawatt Gesamt­leistung errichtet.\u201c",
      sources: [
        { org: "BMWK", doc: "Nationale Wasserstoff­strategie (PDF)", date: "10.06.2020", id: "S-01", size: "4,2 MB" },
      ],
    },
    {
      kind: "evidence",
      label: "Stand heute · März 2026",
      confidence: "primary",
      body:
        "Laut BNetzA sind 0,81 GW Elektrolyse­kapazität in Betrieb. Weitere 2,4 GW im Bau.",
      figure: { big: "8,1 %", sub: "des 10-GW-Ziels erreicht" },
      sources: [
        { org: "Bundesnetzagentur", doc: "Monitoring­bericht Q1/2026", date: "12.03.2026", id: "S-02", size: "2,8 MB" },
        { org: "DENA", doc: "H2-Projekt­landkarte (CSV)", date: "01.04.2026", id: "S-03", size: "340 KB" },
      ],
    },
    {
      kind: "evidence",
      label: "Haushalts­mittel abgeflossen",
      confidence: "primary",
      body:
        "Von den zugesagten 9,0 Mrd. € wurden bis Ende 2025 tatsächlich 2,31 Mrd. € verausgabt.",
      figure: { big: "26 %", sub: "der Mittel abgeflossen" },
      sources: [
        { org: "Bundes­rechnungshof", doc: "Bericht §99 BHO", date: "05.02.2026", id: "S-04", size: "1,1 MB" },
        { org: "BMF", doc: "Haushalts­rechnung 2025", date: "20.03.2026", id: "S-05", size: "8,4 MB" },
      ],
    },
    {
      kind: "context",
      label: "Kontext — was das heißt",
      confidence: "conflicting",
      body:
        "Um das 10-GW-Ziel 2030 zu erreichen, müsste die installierte Leistung ab heute um Faktor 12,3 wachsen. Expert:innen­meinungen weichen stark ab.",
      sources: [
        { org: "Fraunhofer ISE", doc: "Energy-Charts · Zeitreihe", date: "laufend", id: "S-06", size: "—" },
      ],
    },
    {
      kind: "openq",
      label: "Noch offen",
      confidence: "insufficient",
      body:
        "Der Anteil \u201egrünen\u201c Wasserstoffs lässt sich aktuell nicht unabhängig verifizieren — das Herkunfts­nachweis­register startet erst im Mai 2026.",
      sources: [
        { org: "UBA", doc: "Konsultation Herkunfts­nachweis­register", date: "18.03.2026", id: "S-07", size: "720 KB" },
      ],
    },
  ],
  /* Ground-News-Effekt: Schlagzeilen verschiedener Outlets */
  coverage: [
    {
      side: "left",
      label: "Linksliberal",
      outlets: "taz, Freitag, nd",
      n: 14,
      tone: -0.42,
      headlines: [
        "Wasserstoff-Versprechen: Von 10 GW erreicht die Regierung gerade mal 8 %",
        "Milliarden-Subvention für Industrie — Bürger*innen zahlen die Zeche",
      ],
    },
    {
      side: "oerr",
      label: "Öffentlich-rechtlich",
      outlets: "ARD, ZDF, DLF",
      n: 17,
      tone: 0.05,
      headlines: [
        "Wasserstoff-Ausbau: Fortschritte, aber Ziel 2030 kaum erreichbar",
        "Bundesrechnungshof rügt Tempo der Förder­mittel-Vergabe",
      ],
    },
    {
      side: "right",
      label: "Konservativ / Wirtschaft",
      outlets: "WELT, FAZ, Handelsblatt",
      n: 11,
      tone: 0.36,
      headlines: [
        "Deutschland auf dem Weg zur Wasserstoff-Supermacht: Pilot­projekte gehen ans Netz",
        "Industrie fordert schnellere Genehmigungen — 2,4 GW im Bau",
      ],
    },
  ],
};

const DISCUSSION_SEED = [
  {
    user: "dr_m.sommer", role: "verifiziert · TU München", when: "vor 2 Std.",
    body: "Auf S. 12 des BNetzA-Berichts: die 0,81 GW enthalten auch Pilot­anlagen unter 100 kW. Sollte in Karte #2 erwähnt sein.",
    editorPicked: true, up: 48, down: 1,
    sourceBadge: { type: "Primärquelle eingereicht", doc: "BNetzA Monitoring Q1/2026 · S. 12" },
  },
  {
    user: "energy_nerd", role: "Mitglied seit 2024", when: "vor 5 Std.",
    body: "Wie vergleichen sich die 0,81 GW mit Frankreich und den Niederlanden? Wäre schön für Kontext.",
    up: 21, down: 0,
  },
  {
    user: "maxine_1987", role: "neues Mitglied", when: "vor 1 Std.",
    body: "Die Regierung lügt uns eh alle an, niemand sollte diesem Bericht trauen.",
    up: 2, down: 19,
    flaggedByAI: true, // KI-Moderator greift ein
  },
];

// expose globally for other babel-transpiled scripts
Object.assign(window, { TOPICS, ARTICLE, DISCUSSION_SEED });
