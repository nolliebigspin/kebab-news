/**
 * Idempotent outlet seed for the SLC radar.
 *
 * Usage: mise exec -- bun scripts/seed-outlets.ts
 *
 * Re-running the script updates name/feed_url/homepage_url/political_lean for
 * any outlet with a matching slug. Use this when a feed URL moves.
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

import { db, type NewOutlet, outlets } from "@/lib/db";

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
