import Image from "next/image";

import { Link } from "@/i18n/routing";

export const Wordmark = () => {
  return (
    <Link
      href="/"
      aria-label="kebab.news — home"
      className="flex select-none items-center gap-2.5 rounded-sm transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-4"
    >
      <Image
        src="/kebab-news-logo.png"
        alt=""
        width={28}
        height={28}
        priority
        className="h-7 w-7"
      />
      <div className="flex items-baseline gap-0.5">
        <span className="font-display text-ink text-xl">kebab</span>
        <span className="font-display text-brand text-xl">.news</span>
      </div>
    </Link>
  );
};
