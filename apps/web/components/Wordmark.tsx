import Link from "next/link";

export const Wordmark = () => {
  return (
    <Link
      href="/"
      aria-label="kebab.news — home"
      className="flex select-none items-center gap-2.5 rounded-md transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-4"
    >
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-[0.7rem] bg-brand font-display text-lg text-primary-foreground shadow-sm"
      >
        k
      </span>
      {/* Wordmark text is hidden on mobile — the compact monogram stands alone there. */}
      <div className="hidden items-baseline gap-0.5 md:flex">
        <span className="font-display text-ink text-xl tracking-[-0.04em]">kebab</span>
        <span className="font-display text-brand text-xl tracking-[-0.04em]">.news</span>
      </div>
    </Link>
  );
};
