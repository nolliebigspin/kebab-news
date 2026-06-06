"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Generic, URL-driven filter bar shared by the radar and article lists. It owns
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
    <div className="mb-8 flex flex-col gap-4">
      <Input
        type="search"
        value={query}
        onChange={(e) => onSearch(e.target.value)}
        placeholder={labels.searchPlaceholder}
        aria-label={labels.searchLabel}
        className="h-9 max-w-md"
      />

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        {controls(update)}

        {!isDefault && (
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            {labels.reset}
          </Button>
        )}
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
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[11px] text-ink-mute uppercase tracking-[0.12em]">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 cursor-pointer rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
