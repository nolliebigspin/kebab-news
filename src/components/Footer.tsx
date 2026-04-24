import { Wordmark } from "@/components/Wordmark";
import { GITHUB_URL } from "@/lib/constants";

const links = [
  ["Methodik", "#"],
  ["KI-Transparenz", "#"],
  ["Quellcode", GITHUB_URL],
  ["Kontakt", "#"],
] as const;

export const Footer = () => {
  return (
    <footer className="hairline border-t">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-4 px-6 py-8 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <Wordmark />
          <p className="mt-1 text-xs" style={{ color: "var(--ink-mute)" }}>
            Gemeinnützig · Werbefrei · Mitglieder-getragen
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-4">
          {links.map(([label, href]) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="text-xs transition-colors"
              style={{ color: "var(--ink-mute)" }}
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
