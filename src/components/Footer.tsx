import { useTranslations } from "next-intl";
import { Wordmark } from "@/components/Wordmark";

export const Footer = () => {
  const t = useTranslations("footer");

  return (
    <footer className="hairline border-t">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Wordmark />
        <p className="text-ink-mute text-xs">{t("nonprofit")}</p>
      </div>
    </footer>
  );
};
