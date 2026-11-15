"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { FiSearch } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { serializeFilters } from "@/lib/filters";

/**
 * Generic, URL-driven filter bar shared by the topic and article lists. It owns
 * the parts both surfaces have in common — a debounced search input, the
 * searchParams push, and the reset button — and is otherwise agnostic about the
 * filter shape `F`. Each page supplies:
 *   - `filters`     the current parsed state (must include a `q` string),
 *   - `defaults`    the default state; matching params are left out of the URL,
 *   - `controls`    a render prop given an `update(next)` helper to wire its own
 *                   <FilterSelect>s.
 *
 * Holds no list state of its own: every control writes into the URL and lets
 * the Server Component re-render the list from the same params.
 *
 * Lives as a Client Component but pulls only from `@/lib/filters` (and the page
 * passes plain options down) — never the @kebab/core or @kebab/db barrels,
 * which transitively bundle server-only deps and break the Turbopack client
 * build.
 */
export function FilterBar<F extends { q: string } & Record<string, string | number | null>>({
  filters,
  defaults,
  controls,
  labels,
}: {
  filters: F;
  defaults: F;
  controls: (update: (next: Partial<F>) => void) => React.ReactNode;
  labels: { searchPlaceholder: string; searchLabel: string; reset: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q);

  // Keep the input in sync when the URL changes from elsewhere (e.g. reset).
  useEffect(() => {
    setQuery(filters.q);
  }, [filters.q]);

  function update(next: Partial<F>) {
    const qs = serializeFilters({ ...filters, ...next }, defaults);
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  // Debounced search push so typing doesn't fire a navigation per keystroke.
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  function onSearch(value: string) {
    setQuery(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => update({ q: value.trim() } as Partial<F>), 300);
  }

  function reset() {
    setQuery("");
    startTransition(() => router.replace(pathname, { scroll: false }));
  }

  const isDefault = Object.keys(defaults).every(
    (key) => (filters as Record<string, unknown>)[key] === defaults[key]
  );

  return (
    <search className="mb-10 block border-line-soft border-y py-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(16rem,1fr)_auto] lg:items-end">
        <div className="relative max-w-xl">
          <FiSearch
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-mute"
            aria-hidden
          />
          <Input
            id="suche"
            type="search"
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={labels.searchPlaceholder}
            aria-label={labels.searchLabel}
            className="h-12 rounded-full bg-bg-warm pl-11 text-base"
          />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          {controls(update)}

          {!isDefault && (
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              {labels.reset}
            </Button>
          )}
        </div>
      </div>
    </search>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-medium text-ink-mute text-xs">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 cursor-pointer rounded-full border border-line bg-surface-raised px-4 text-sm outline-none transition-colors hover:border-brand focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
