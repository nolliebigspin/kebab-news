import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, type Crumb } from "@/lib/structured-data";

/**
 * Visible trail plus BreadcrumbList JSON-LD. "Start" is prepended
 * automatically; the last crumb is the current page.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const crumbs: Crumb[] = [{ name: "Start", path: "/" }, ...items];
  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <nav aria-label="Brotkrumen" className="text-ink-mute text-sm">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1;
            return (
              <li key={crumb.path} className="flex min-w-0 items-center gap-2">
                {index > 0 ? (
                  <span aria-hidden className="text-line">
                    /
                  </span>
                ) : null}
                {last ? (
                  <span aria-current="page" className="truncate text-ink-soft">
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    href={crumb.path}
                    className="rounded-sm underline-offset-4 hover:text-brand-ink hover:underline"
                  >
                    {crumb.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
