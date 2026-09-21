"use client";

import { useState } from "react";
import { FormField } from "@/components/auth/FormField";
import { MoneyField } from "@/components/admin/MoneyField";

export type FieldSpec =
  | { kind: "text"; name: string; label: string; required?: boolean; placeholder?: string; help?: string }
  | { kind: "textarea"; name: string; label: string; help?: string }
  | { kind: "money"; name: string; label: string; required?: boolean; help?: string }
  | { kind: "number"; name: string; label: string; min?: number; max?: number; step?: number; required?: boolean; help?: string }
  | { kind: "checkbox"; name: string; label: string }
  | { kind: "color"; name: string; label: string; required?: boolean };

/**
 * A field-spec-driven form used by the six admin "customizer option" screens
 * (fabrics, colors, sizes, print positions, embroidery positions, patches).
 * Their fields overlap heavily (name/label, an optional slug, a price in
 * minor units, is_active) with just a few resource-specific extras (hex,
 * x/y, anchor, type, image_url) — describing them declaratively avoids
 * writing six almost-identical forms by hand.
 */
export function GenericConfigForm({
  fields,
  initialValues,
  onSubmit,
  isSubmitting,
  fieldErrors,
  submitLabel = "Save",
}: {
  fields: FieldSpec[];
  initialValues: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void;
  isSubmitting: boolean;
  fieldErrors: Record<string, string[]>;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);

  function set(name: string, value: unknown) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => {
        const error = fieldErrors[field.name]?.[0];

        if (field.kind === "checkbox") {
          return (
            <label key={field.name} className="flex items-center gap-2 text-sm text-neutral-800">
              <input
                type="checkbox"
                checked={Boolean(values[field.name])}
                onChange={(e) => set(field.name, e.target.checked)}
                className="h-4 w-4"
              />
              {field.label}
            </label>
          );
        }

        if (field.kind === "money") {
          return (
            <MoneyField
              key={field.name}
              label={field.label}
              initialMinor={values[field.name] as number | undefined}
              onChange={(minor) => set(field.name, minor)}
              required={field.required}
              error={error}
            />
          );
        }

        if (field.kind === "textarea") {
          return (
            <FormField key={field.name} label={field.label} error={error}>
              <textarea
                value={(values[field.name] as string) ?? ""}
                onChange={(e) => set(field.name, e.target.value)}
                rows={3}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              />
            </FormField>
          );
        }

        if (field.kind === "color") {
          const raw = (values[field.name] as string) ?? "";
          const swatch = /^#([0-9a-fA-F]{6})$/.test(raw) ? raw : "#000000";
          return (
            <FormField key={field.name} label={field.label} error={error}>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={swatch}
                  onChange={(e) => set(field.name, e.target.value.toUpperCase())}
                  aria-label="Pick a color"
                  className="h-10 w-14 shrink-0 cursor-pointer rounded-md border border-neutral-300"
                />
                <input
                  value={raw}
                  onChange={(e) => set(field.name, e.target.value)}
                  required={field.required}
                  placeholder="#1A2B3C"
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                />
              </div>
            </FormField>
          );
        }

        if (field.kind === "number") {
          const raw = values[field.name];
          return (
            <FormField key={field.name} label={field.label} error={error}>
              <input
                type="number"
                min={field.min}
                max={field.max}
                step={field.step ?? 1}
                required={field.required}
                value={raw === undefined || raw === null ? "" : String(raw)}
                onChange={(e) => set(field.name, e.target.value === "" ? undefined : Number(e.target.value))}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              />
              {field.help && <span className="mt-1 block text-xs text-neutral-400">{field.help}</span>}
            </FormField>
          );
        }

        return (
          <FormField key={field.name} label={field.label} error={error}>
            <input
              value={(values[field.name] as string) ?? ""}
              onChange={(e) => set(field.name, e.target.value)}
              required={field.required}
              placeholder={field.placeholder}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            />
            {field.help && <span className="mt-1 block text-xs text-neutral-400">{field.help}</span>}
          </FormField>
        );
      })}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
