import "@kebab/env/load";
/**
 * Idempotent outlet seed for the SLC radar.
 *
 * Usage: mise exec -- bun scripts/seed-outlets.ts
 *
 * Re-running the script updates name/feed_url/homepage_url/political_lean for
 * any outlet with a matching slug. Use this when a feed URL moves.
 */

import { db, type NewOutlet, outlets } from "@kebab/db";

const OUTLETS: NewOutlet[] = [
  {
    slug: "taz",
    name: "taz",
    politicalLean: "left",
    feedUrl: "https://taz.de/!s=&ExportStatus=Intern;rss/",
    homepageUrl: "https://taz.de/",
  },
  {
    slug: "sz",
    name: "Süddeutsche Zeitung",
    politicalLean: "center-left",
    feedUrl: "https://rss.sueddeutsche.de/rss/Topthemen",
    homepageUrl: "https://www.sueddeutsche.de/",
  },
  {
    slug: "tagesschau",
    name: "tagesschau",
    politicalLean: "public",
    feedUrl: "https://www.tagesschau.de/index~rss2.xml",
    homepageUrl: "https://www.tagesschau.de/",
  },
  {
    slug: "faz",
    name: "Frankfurter Allgemeine Zeitung",
    politicalLean: "center-right",
    feedUrl: "https://www.faz.net/rss/aktuell/",
    homepageUrl: "https://www.faz.net/",
  },
  {
    slug: "welt",
    name: "Welt",
    politicalLean: "right",
    feedUrl: "https://www.welt.de/feeds/latest.rss",
    homepageUrl: "https://www.welt.de/",
  },
  {
    slug: "nzz",
    name: "Neue Zürcher Zeitung",
    politicalLean: "center-right",
    feedUrl: "https://www.nzz.ch/recent.rss",
    homepageUrl: "https://www.nzz.ch/",
  },
  {
    slug: "junge-freiheit",
    name: "Junge Freiheit",
    politicalLean: "right-fringe",
    feedUrl: "https://jungefreiheit.de/feed/",
    homepageUrl: "https://jungefreiheit.de/",
  },
  {
    slug: "nius",
    name: "Nius",
    politicalLean: "right-fringe",
    feedUrl: "https://www.nius.de/rss",
    homepageUrl: "https://www.nius.de/",
  },
  {
    slug: "spiegel",
    name: "Spiegel",
    politicalLean: "center-left",
    feedUrl: "https://www.spiegel.de/schlagzeilen/index.rss",
    homepageUrl: "https://www.spiegel.de/",
  },
  {
    slug: "zeit",
    name: "Zeit Online",
    politicalLean: "center-left",
    feedUrl: "https://newsfeed.zeit.de/index",
    homepageUrl: "https://www.zeit.de/",
  },
  {
    slug: "ntv",
    name: "n-tv",
    politicalLean: "center",
    feedUrl: "https://www.n-tv.de/rss",
    homepageUrl: "https://www.n-tv.de/",
  },
  {
    slug: "deutschlandfunk",
    name: "Deutschlandfunk",
    politicalLean: "public",
    feedUrl: "https://www.deutschlandfunk.de/nachrichten-100.rss",
    homepageUrl: "https://www.deutschlandfunk.de/",
  },
  {
    slug: "handelsblatt",
    name: "Handelsblatt",
    politicalLean: "center-right",
    feedUrl: "https://www.handelsblatt.com/contentexport/feed/top-themen",
    homepageUrl: "https://www.handelsblatt.com/",
  },
  {
    slug: "berliner-zeitung",
    name: "Berliner Zeitung",
    politicalLean: "center-left",
    feedUrl: "https://www.berliner-zeitung.de/feed.xml",
    homepageUrl: "https://www.berliner-zeitung.de/",
  },
  {
    slug: "fr",
    name: "Frankfurter Rundschau",
    politicalLean: "left",
    feedUrl: "https://www.fr.de/rssfeed.rdf",
    homepageUrl: "https://www.fr.de/",
  },
  {
    slug: "mdr",
    name: "MDR Aktuell",
    politicalLean: "public",
    feedUrl: "https://www.mdr.de/nachrichten/index-rss.xml",
    homepageUrl: "https://www.mdr.de/nachrichten/",
  },
  {
    slug: "tagesspiegel",
    name: "Tagesspiegel",
    politicalLean: "center-left",
    feedUrl: "https://www.tagesspiegel.de/contentexport/feed/home",
    homepageUrl: "https://www.tagesspiegel.de/",
  },
  {
    slug: "stern",
    name: "Stern",
    politicalLean: "center-left",
    feedUrl: "https://www.stern.de/feed/standard/all/",
    homepageUrl: "https://www.stern.de/",
  },
  {
    slug: "netzpolitik",
    name: "netzpolitik.org",
    politicalLean: "left",
    feedUrl: "https://netzpolitik.org/feed/",
    homepageUrl: "https://netzpolitik.org/",
  },
  {
    // Spektrum is a science magazine — `center` is the closest fit in the
    // single-axis lean enum. It overlaps news on climate, AI, public health.
    slug: "spektrum",
    name: "Spektrum",
    politicalLean: "center",
    feedUrl: "https://www.spektrum.de/alias/rss/spektrum-de-rss-feed/996406",
    homepageUrl: "https://www.spektrum.de/",
  },
  {
    slug: "freitag",
    name: "der Freitag",
    politicalLean: "left",
    feedUrl: "https://www.freitag.de/@@RSS",
    homepageUrl: "https://www.freitag.de/",
  },
  {
    slug: "junge-welt",
    name: "junge Welt",
    politicalLean: "left",
    feedUrl: "https://www.jungewelt.de/feeds/newsticker.rss",
    homepageUrl: "https://www.jungewelt.de/",
  },
  {
    // "Right but not fringe" — sits between Welt and JF/Nius. Worth including
    // explicitly so the right flank isn't just Welt + two fringe outlets.
    slug: "tichys-einblick",
    name: "Tichys Einblick",
    politicalLean: "right",
    feedUrl: "https://www.tichyseinblick.de/feed/",
    homepageUrl: "https://www.tichyseinblick.de/",
  },
  {
    // Cicero ships empty <description> in RSS (paywalled bodies); headline
    // alone is still useful for clustering and the distinct liberal-conservative
    // voice matters for spectrum coverage.
    slug: "cicero",
    name: "Cicero",
    politicalLean: "center-right",
    feedUrl: "https://www.cicero.de/rss.xml",
    homepageUrl: "https://www.cicero.de/",
  },
  {
    slug: "uebermedien",
    name: "Übermedien",
    politicalLean: "center",
    feedUrl: "https://uebermedien.de/feed/",
    homepageUrl: "https://uebermedien.de/",
  },
];

async function main() {
  for (const outlet of OUTLETS) {
    await db
      .insert(outlets)
      .values(outlet)
      .onConflictDoUpdate({
        target: outlets.slug,
        set: {
          name: outlet.name,
          politicalLean: outlet.politicalLean,
          feedUrl: outlet.feedUrl,
          homepageUrl: outlet.homepageUrl,
        },
      });
    console.log(`✓ ${outlet.slug}`);
  }
  console.log(`\nSeeded ${OUTLETS.length} outlets.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
