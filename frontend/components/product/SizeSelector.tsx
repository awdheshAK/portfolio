"use client";

import { cn } from "@/lib/cn";

export function SizeSelector({
  sizes,
  selectedId,
  onChange,
}: {
  sizes: Array<{ id: number; label: string }>;
  selectedId?: number | null;
  onChange: (id: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
      {sizes.map((size) => (
        <button
          key={size.id}
          type="button"
          onClick={() => onChange(size.id)}
          aria-pressed={selectedId === size.id}
          className={cn(
            "min-w-11 rounded-md border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
            selectedId === size.id
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-neutral-300 text-neutral-700 hover:border-neutral-900"
          )}
        >
          {size.label}
        </button>
      ))}
    </div>
  );
}
