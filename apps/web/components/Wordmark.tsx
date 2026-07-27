import Image from "next/image";
import Link from "next/link";

export const Wordmark = () => {
  return (
    <Link
      href="/"
      aria-label="kebab.news — home"
      className="flex select-none items-center gap-2.5 rounded-md transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-4"
    >
      <Image
        src="/kebab-news-logo-small.png"
        alt="Kebab.news logo"
        width={286}
        height={750}
        priority
        className="h-9 w-auto dark:brightness-0 dark:invert"
      />
      {/* Wordmark text is hidden on mobile — the logo image stands alone there. */}
      <div className="hidden items-baseline gap-0.5 md:flex">
        <span className="font-display text-ink text-xl tracking-[-0.04em]">kebab</span>
        <span className="font-display text-brand text-xl tracking-[-0.04em]">.news</span>
      </div>
    </Link>
  );
};
