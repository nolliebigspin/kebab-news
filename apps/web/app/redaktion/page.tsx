import { commentReports, db, publishedArticles, user } from "@kebab/db";
import { desc, eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatRelative } from "@/lib/format";
import { getSession } from "@/lib/session";
import { loadLatestPublishedAt } from "@/lib/stories";

export const metadata: Metadata = {
  title: "Redaktion",
  robots: { index: false, follow: false },
};

const roleLabels = {
  moderator: "Moderation",
  editor: "Redaktion",
  admin: "Administration",
} as const;

const statusLabels = {
  draft: "Entwurf",
  processing: "In Verarbeitung",
  needs_review: "Prüfung erforderlich",
  published: "Veröffentlicht",
  updated: "Aktualisiert",
  corrected: "Korrigiert",
  archived: "Archiviert",
} as const;

export default async function EditorialPage() {
  const session = await getSession();
  if (!session) notFound();
  const actor = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);
  if (!actor[0] || !["moderator", "editor", "admin"].includes(actor[0].role)) notFound();

  const [summaries, reportCount, latest] = await Promise.all([
    db
      .select({
        id: publishedArticles.id,
        slug: publishedArticles.slug,
        headline: publishedArticles.neutralHeadline,
        version: publishedArticles.version,
        status: publishedArticles.status,
        sourceCount: publishedArticles.sourceCount,
        rewrittenAt: publishedArticles.rewrittenAt,
        publishedAt: publishedArticles.publishedAt,
      })
      .from(publishedArticles)
      .orderBy(desc(publishedArticles.rewrittenAt))
      .limit(50),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(commentReports)
      .where(eq(commentReports.status, "pending")),
    loadLatestPublishedAt(),
  ]);

  return (
    <Container width="content" className="py-12 sm:py-16">
      <PageHeader
        title="Redaktion"
        lede={`Interner Bereich (${roleLabels[actor[0].role as keyof typeof roleLabels]}). Veröffentlichte Artikel und Moderation auf einen Blick.`}
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          ["Letzte Veröffentlichung", latest ? formatRelative(latest) : "noch keine"],
          [
            "Veröffentlicht (letzte 50)",
            summaries.filter((item) => item.publishedAt !== null).length,
          ],
          ["Offene Meldungen", reportCount[0]?.count ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-bg-warm p-5">
            <p className="text-ink-soft text-sm">{label}</p>
            <p className="tabular mt-2 font-display text-3xl">{value}</p>
          </div>
        ))}
      </div>
      <section className="mt-12">
        <h2 className="font-display text-title">Artikel</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-ink border-b-2 text-ink-mute text-sm">
              <tr>
                <th className="p-3">Artikel</th>
                <th className="p-3">Status</th>
                <th className="p-3">Version</th>
                <th className="p-3">Quellen</th>
                <th className="p-3">Veröffentlicht</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {summaries.map((summary) => (
                <tr key={summary.id}>
                  <td className="p-3">
                    <Link
                      href={`/artikel/${summary.slug}`}
                      className="font-medium hover:text-brand-ink"
                    >
                      {summary.headline}
                    </Link>
                    <span className="mt-1 block text-ink-mute text-xs">
                      {formatDate(summary.rewrittenAt, "datetime")}
                    </span>
                  </td>
                  <td className="p-3">
                    <Badge variant="muted">{statusLabels[summary.status]}</Badge>
                  </td>
                  <td className="p-3 tabular-nums">{summary.version}</td>
                  <td className="p-3 tabular-nums">{summary.sourceCount}</td>
                  <td className="p-3 text-ink-soft text-xs">
                    {summary.publishedAt ? formatDate(summary.publishedAt, "datetime") : "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <aside className="mt-10 rounded-2xl bg-warn-wash p-4 text-ink-soft text-sm">
        Artikel werden automatisch erzeugt und veröffentlicht. Diese Übersicht dient der
        Beobachtung; Moderation läuft über gemeldete Kommentare. Schreibaktionen werden künftig über
        dieselben Rollen abgesichert.
      </aside>
    </Container>
  );
}
