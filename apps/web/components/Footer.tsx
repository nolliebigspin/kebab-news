import Link from "next/link";
import { useTranslations } from "next-intl";
import { Wordmark } from "@/components/Wordmark";

export const Footer = () => {
  const t = useTranslations("footer");

  return (
    <footer className="hairline border-t">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <Wordmark />
        <div className="flex flex-wrap items-center gap-4 text-ink-mute text-xs">
          <Link href="/impressum" className="hover:text-brand">
            {t("impressum")}
          </Link>
          <Link href="/datenschutz" className="hover:text-brand">
            {t("datenschutz")}
          </Link>
          <span>·</span>
          <span>{t("nonprofit")}</span>
        </div>
      </div>
    </footer>
  );
};
