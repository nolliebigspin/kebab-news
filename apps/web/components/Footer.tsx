import Link from "next/link";
import { useTranslations } from "next-intl";
import { Wordmark } from "@/components/Wordmark";

export const Footer = () => {
  const t = useTranslations("footer");

  return (
    <footer className="border-line-soft border-t bg-bg-warm/55">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <Wordmark />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-ink-mute text-xs">
          <Link
            href="/methodik"
            className="rounded-sm hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
          >
            {t("method")}
          </Link>
          <Link
            href="/ueber-uns"
            className="rounded-sm hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
          >
            {t("about")}
          </Link>
          <Link
            href="/impressum"
            className="rounded-sm hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
          >
            {t("impressum")}
          </Link>
          <Link
            href="/datenschutz"
            className="rounded-sm hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
          >
            {t("datenschutz")}
          </Link>
          <span aria-hidden>·</span>
          <span>{t("nonprofit")}</span>
        </div>
      </div>
    </footer>
  );
};
