"use client";

import { cn } from "@/lib/cn";

export function ColorSwatch({
  hex,
  name,
  selected,
  onSelect,
  size = "md",
}: {
  hex: string;
  name: string;
  selected?: boolean;
  onSelect?: () => void;
  size?: "sm" | "md";
}) {
  const dimension = size === "sm" ? "h-6 w-6" : "h-8 w-8";
  return (
    <button
      type="button"
      onClick={onSelect}
      title={name}
      aria-label={name}
      aria-pressed={selected}
      className={cn(
        "relative rounded-full border-2 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
        dimension,
        selected ? "border-neutral-900 scale-110" : "border-white ring-1 ring-neutral-200 hover:scale-105"
      )}
      style={{ backgroundColor: hex }}
    >
      <span className="sr-only">{name}</span>
    </button>
  );
}

export function ColorSwatchGroup({
  colors,
  selectedId,
  onChange,
}: {
  colors: Array<{ id: number; name: string; hex: string }>;
  selectedId?: number | null;
  onChange: (id: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
      {colors.map((color) => (
        <ColorSwatch key={color.id} hex={color.hex} name={color.name} selected={selectedId === color.id} onSelect={() => onChange(color.id)} />
      ))}
    </div>
  );
}
