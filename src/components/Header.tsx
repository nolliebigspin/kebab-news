import { useTranslations } from "next-intl";
import { FaGithub } from "react-icons/fa6";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/Wordmark";
import { GITHUB_URL } from "@/lib/constants";

export const Header = () => {
  const t = useTranslations("header");

  return (
    <header className="hairline border-b px-6 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Wordmark />
        <div className="flex items-center gap-4 md:gap-8">
          <LanguageSwitcher />
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                <FaGithub />
                <span className="font-mono text-xs">{t("github")}</span>
              </a>
            }
          />
        </div>
      </div>
    </header>
  );
};
