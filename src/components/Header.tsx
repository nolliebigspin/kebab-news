import { GithubIcon } from "@/components/GithubIcon";
import { Wordmark } from "@/components/Wordmark";
import { GITHUB_URL } from "@/lib/constants";

export const Header = () => {
  return (
    <header className="hairline border-b px-6 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Wordmark />
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hairline inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-(--bg-warm)"
          style={{ color: "var(--ink-soft)" }}
        >
          <GithubIcon />
          <span className="font-mono text-xs">GitHub</span>
        </a>
      </div>
    </header>
  );
}
