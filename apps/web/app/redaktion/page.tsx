import { commentReports, db, publishedArticles, user } from "@kebab/db";
import { desc, eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Redaktion — kebab.news",
  robots: { index: false, follow: false },
};

export default async function EditorialPage() {
  const session = await getSession();
  if (!session) notFound();
  const actor = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);
  if (!actor[0] || !["moderator", "editor", "admin"].includes(actor[0].role)) notFound();

  const [summaries, reportCount] = await Promise.all([
    db
      .select({
        id: publishedArticles.id,
        slug: publishedArticles.slug,
        headline: publishedArticles.neutralHeadline,
        version: publishedArticles.version,
        status: publishedArticles.status,
        sourceCount: publishedArticles.sourceCount,
        rewrittenAt: publishedArticles.rewrittenAt,
        reviewedAt: publishedArticles.reviewedAt,
        reviewedBy: publishedArticles.reviewedBy,
      })
      .from(publishedArticles)
      .orderBy(desc(publishedArticles.rewrittenAt))
      .limit(50),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(commentReports)
      .where(eq(commentReports.status, "pending")),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <header>
        <p className="font-mono text-[11px] text-brand-ink uppercase tracking-[0.14em]">
          Interner Bereich · {actor[0].role}
        </p>
        <h1 className="mt-2 font-display text-4xl">Redaktion</h1>
        <p className="mt-3 text-ink-soft">
          Entwürfe, Prüfstatus und Moderation auf einen Blick. Veröffentlichungen bleiben
          versioniert.
        </p>
      </header>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          ["Entwürfe", summaries.filter((item) => item.status === "draft").length],
          ["Brauchen Prüfung", summaries.filter((item) => item.status === "needs_review").length],
          ["Offene Meldungen", reportCount[0]?.count ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-line p-5">
            <p className="text-ink-soft text-sm">{label}</p>
            <p className="mt-2 font-display text-3xl">{value}</p>
          </div>
        ))}
      </div>
      <section className="mt-12">
        <h2 className="font-display text-2xl">Zusammenfassungen</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-line border-b font-mono text-[10px] text-ink-mute uppercase">
              <tr>
                <th className="p-3">Story</th>
                <th className="p-3">Status</th>
                <th className="p-3">Version</th>
                <th className="p-3">Quellen</th>
                <th className="p-3">Prüfung</th>
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
                      {summary.rewrittenAt.toLocaleString("de-DE")}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="rounded-full bg-bg-warm px-2 py-1 font-mono text-[10px] uppercase">
                      {summary.status}
                    </span>
                  </td>
                  <td className="p-3 tabular-nums">{summary.version}</td>
                  <td className="p-3 tabular-nums">{summary.sourceCount}</td>
                  <td className="p-3 text-ink-soft text-xs">
                    {summary.reviewedAt && summary.reviewedBy
                      ? `${summary.reviewedBy} · ${summary.reviewedAt.toLocaleString("de-DE")}`
                      : "Ungeprüft"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <aside className="mt-10 rounded-xl bg-warn-wash p-4 text-ink-soft text-sm">
        Automatisch erzeugte Einträge mit <code>needs_review</code> dürfen erst nach Prüfung von
        Quellenbelegen, Zitaten, Unsicherheiten und Markierungen veröffentlicht werden.
        Schreibaktionen werden als nächster Adapter auf denselben Rollen-Seam gesetzt.
      </aside>
    </div>
  );
}
