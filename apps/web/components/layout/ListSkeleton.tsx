import { Container } from "@/components/layout/Container";

/** Placeholder rows shaped like the article/topic grids while data loads. */
export function ListSkeleton() {
  return (
    <Container className="py-12 sm:py-16" aria-busy="true" aria-label="Wird geladen">
      <div className="h-14 w-2/3 max-w-md animate-pulse rounded-xl bg-bg-warm" />
      <div className="mt-4 h-6 w-full max-w-xl animate-pulse rounded-lg bg-bg-warm" />
      <div className="mt-10 h-14 animate-pulse rounded-full bg-bg-warm" />
      <ul className="mt-10 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <li key={index} className="border-line border-t-2 pt-4">
            <div className="h-4 w-40 animate-pulse rounded bg-bg-warm" />
            <div className="mt-4 h-7 w-11/12 animate-pulse rounded bg-bg-warm" />
            <div className="mt-2 h-7 w-2/3 animate-pulse rounded bg-bg-warm" />
            <div className="mt-4 h-16 animate-pulse rounded bg-bg-warm" />
          </li>
        ))}
      </ul>
    </Container>
  );
}

/** Placeholder for a single article or topic page. */
export function DetailSkeleton() {
  return (
    <Container
      width="content"
      className="py-10 sm:py-14"
      aria-busy="true"
      aria-label="Wird geladen"
    >
      <div className="h-4 w-48 animate-pulse rounded bg-bg-warm" />
      <div className="mt-10 h-4 w-40 animate-pulse rounded bg-bg-warm" />
      <div className="mt-4 h-12 w-full max-w-3xl animate-pulse rounded-xl bg-bg-warm" />
      <div className="mt-3 h-12 w-2/3 animate-pulse rounded-xl bg-bg-warm" />
      <div className="mt-6 h-24 max-w-3xl animate-pulse rounded-xl bg-bg-warm" />
      <div className="mt-12 h-64 animate-pulse rounded-3xl bg-bg-warm" />
    </Container>
  );
}
