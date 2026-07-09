import { useNavigate } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import type { PackageCategory } from "@/types/api";

const CATEGORIES: Array<{ value: PackageCategory | "ALL"; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "HONEYMOON", label: "Honeymoon" },
  { value: "ADVENTURE", label: "Adventure" },
  { value: "BEACH", label: "Beach" },
  { value: "MOUNTAIN", label: "Mountain" },
  { value: "HERITAGE", label: "Heritage" },
  { value: "PILGRIMAGE", label: "Pilgrimage" },
  { value: "WILDLIFE", label: "Wildlife" },
  { value: "FAMILY", label: "Family" },
];

type Props = {
  destination?: string;
  category?: PackageCategory;
  minPrice?: number;
  maxPrice?: number;
};

export function FilterBar({ destination, category, minPrice, maxPrice }: Props) {
  const navigate = useNavigate({ from: "/packages" });

  const update = (patch: Record<string, string | number | undefined>) => {
    navigate({
      to: "/packages",
      search: (prev: Record<string, unknown>) => {
        const next: Record<string, unknown> = { ...prev };
        for (const [k, v] of Object.entries(patch)) {
          if (v === undefined || v === "" || v === "ALL") delete next[k];
          else next[k] = v;
        }
        return next;
      },
    });
  };

  return (
    <div className="border-b border-ink-900/5 bg-cream-100/50">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <div className="flex-1">
          <label className="mb-2 block text-[10px] uppercase tracking-widest text-ink-900/40">
            Search destination
          </label>
          <input
            type="search"
            defaultValue={destination ?? ""}
            placeholder="Amalfi, Kyoto, Maldives…"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                update({ destination: (e.target as HTMLInputElement).value });
              }
            }}
            onBlur={(e) => update({ destination: e.target.value })}
            className="w-full max-w-md rounded-full border border-ink-900/10 bg-cream-50 px-5 py-3 text-sm text-ink-900 placeholder:text-ink-900/40 focus:border-ink-900/40 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PriceInput
            label="Min ₹"
            defaultValue={minPrice}
            onCommit={(n) => update({ min_price: n })}
          />
          <PriceInput
            label="Max ₹"
            defaultValue={maxPrice}
            onCommit={(n) => update({ max_price: n })}
          />
        </div>
      </div>
      <div className="no-scrollbar overflow-x-auto border-t border-ink-900/5">
        <div className="mx-auto flex w-max max-w-full gap-2 px-6 py-4 lg:px-10">
          {CATEGORIES.map((c) => {
            const active =
              (c.value === "ALL" && !category) || c.value === category;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() =>
                  update({ category: c.value === "ALL" ? undefined : c.value })
                }
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-[11px] font-medium uppercase tracking-widest transition-colors",
                  active
                    ? "border-ink-900 bg-ink-900 text-cream-50"
                    : "border-ink-900/10 text-ink-900/60 hover:border-ink-900/30 hover:text-ink-900",
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PriceInput({
  label,
  defaultValue,
  onCommit,
}: {
  label: string;
  defaultValue?: number;
  onCommit: (n: number | undefined) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-full border border-ink-900/10 bg-cream-50 px-4 py-2">
      <span className="text-[10px] uppercase tracking-widest text-ink-900/40">
        {label}
      </span>
      <input
        type="number"
        min={0}
        step={5000}
        defaultValue={defaultValue ?? ""}
        onBlur={(e) => {
          const v = e.target.valueAsNumber;
          onCommit(Number.isFinite(v) ? v : undefined);
        }}
        className="w-24 border-none bg-transparent p-0 text-sm text-ink-900 placeholder:text-ink-900/30 focus:outline-none focus:ring-0"
      />
    </label>
  );
}