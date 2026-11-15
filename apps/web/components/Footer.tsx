import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FaGithub } from "react-icons/fa6";
import { FiRss } from "react-icons/fi";
import { Logo } from "@/components/brand/Logo";
import { formatDate } from "@/lib/format";
import { SITE } from "@/lib/site";
import { loadLatestPublishedAt } from "@/lib/stories";

const LINK =
  "rounded-sm text-ink-soft underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:ring-3 focus-visible:ring-ring/40";

export async function Footer() {
  const [t, tHeader, latest] = await Promise.all([
    getTranslations("footer"),
    getTranslations("header"),
    loadLatestPublishedAt(),
  ]);

  const columns = [
    {
      title: t("col_read"),
      links: [
        { href: "/artikel", label: tHeader("articles") },
        { href: "/themen", label: tHeader("topics") },
        { href: "/feed.xml", label: t("rss"), icon: <FiRss aria-hidden className="size-3.5" /> },
      ],
    },
    {
      title: t("col_understand"),
      links: [
        { href: "/lernen", label: tHeader("learn") },
        { href: "/methodik", label: tHeader("method") },
        { href: "/ueber-uns", label: tHeader("about") },
      ],
    },
    {
      title: t("col_legal"),
      links: [
        { href: "/impressum", label: t("impressum") },
        { href: "/datenschutz", label: t("datenschutz") },
      ],
    },
  ];

  return (
    <footer className="mt-24 border-line-soft border-t bg-bg-warm">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-ink-soft text-sm leading-6">{t("claim")}</p>
          {latest ? (
            <p className="mt-4 text-ink-mute text-xs">
              {t("updated")}{" "}
              <time dateTime={latest.toISOString()}>{formatDate(latest, "datetime")}</time>
            </p>
          ) : null}
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <h2 className="font-semibold text-ink text-sm">{column.title}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={`${LINK} inline-flex items-center gap-1.5`}>
                    {link.icon}
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-line-soft border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-ink-mute text-xs sm:px-6">
          <p>{t("principles")}</p>
          <a
            href={SITE.github}
            target="_blank"
            rel="noopener noreferrer"
            className={`${LINK} inline-flex items-center gap-1.5 text-xs`}
          >
            <FaGithub aria-hidden /> {t("source_code")}
          </a>
        </div>
      </div>
    </footer>
  );
}
