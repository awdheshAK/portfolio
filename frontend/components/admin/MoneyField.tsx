"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * A rupee-denominated text input that reports its value in minor units
 * (paise) via onChange — every `_minor` field the API accepts is paise, but
 * admins should never have to type paise. Uncontrolled after mount (state
 * is seeded once from `initialMinor`); parent forms that swap between
 * "create" and "edit" should remount this with a `key` so it re-seeds.
 */
export function MoneyField({
  label,
  initialMinor,
  onChange,
  error,
  required,
  id,
}: {
  label: string;
  initialMinor?: number | null;
  onChange: (minor: number) => void;
  error?: string;
  required?: boolean;
  id?: string;
}) {
  const [text, setText] = useState(
    initialMinor !== undefined && initialMinor !== null ? String(initialMinor / 100) : ""
  );

  function handleChange(next: string) {
    setText(next);
    const parsed = Number(next);
    onChange(Number.isFinite(parsed) && next.trim() !== "" ? Math.round(parsed * 100) : 0);
  }

  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1 block text-sm font-medium text-neutral-900">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-neutral-500">₹</span>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          required={required}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          className={cn(
            "w-full rounded-md border border-neutral-300 py-2 pl-7 pr-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
            error && "border-red-400"
          )}
        />
      </div>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
