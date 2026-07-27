"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { FiSearch } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Generic, URL-driven filter bar shared by the topic and article lists. It owns
 * the parts both surfaces have in common — a debounced search input, the
 * searchParams push, and the reset button — and is otherwise agnostic about the
 * filter shape `F`. Each page supplies:
 *   - `filters`     the current parsed state (must include a `q` string),
 *   - `serialize`   how to turn a state into a query string (page-specific
 *                   param names / defaults),
 *   - `controls`    a render prop given an `update(next)` helper to wire its own
 *                   <FilterSelect>s,
 *   - `isDefault`   whether to hide the reset button.
 *
 * Holds no list state of its own: every control writes into the URL and lets
 * the Server Component re-render the list from the same params.
 *
 * Lives as a Client Component but pulls only from `@/lib/filters` (and the page
 * passes plain options down) — never the @kebab/core or @kebab/db barrels,
 * which transitively bundle server-only deps and break the Turbopack client
 * build.
 */
export function FilterBar<F extends { q: string }>({
  filters,
  serialize,
  controls,
  isDefault,
  labels,
}: {
  filters: F;
  serialize: (filters: F) => string;
  controls: (update: (next: Partial<F>) => void) => React.ReactNode;
  isDefault: boolean;
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
    const qs = serialize({ ...filters, ...next });
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

  return (
    <div className="mb-8 rounded-2xl border border-line-soft bg-bg-warm/55 p-4 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(16rem,1fr)_auto] lg:items-end">
        <div className="relative max-w-xl">
          <FiSearch
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-mute"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={labels.searchPlaceholder}
            aria-label={labels.searchLabel}
            className="h-11 pl-10"
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
    </div>
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
      <span className="font-medium text-[11px] text-ink-mute">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 cursor-pointer rounded-xl border border-input bg-surface-raised px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35"
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
