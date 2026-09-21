"use client";

import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";

export function FabricSelector({
  fabrics,
  selectedId,
  onChange,
}: {
  fabrics: Array<{ id: number; name: string; price_delta_minor?: number }>;
  selectedId?: number | null;
  onChange: (id: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Fabric">
      {fabrics.map((fabric) => (
        <button
          key={fabric.id}
          type="button"
          onClick={() => onChange(fabric.id)}
          aria-pressed={selectedId === fabric.id}
          className={cn(
            "flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
            selectedId === fabric.id ? "border-neutral-900 bg-neutral-50" : "border-neutral-300 hover:border-neutral-500"
          )}
        >
          <span className="text-sm font-medium text-neutral-900">{fabric.name}</span>
          {!!fabric.price_delta_minor && (
            <span className="text-xs text-neutral-500">+{formatMoney(fabric.price_delta_minor)}</span>
          )}
        </button>
      ))}
    </div>
  );
}
