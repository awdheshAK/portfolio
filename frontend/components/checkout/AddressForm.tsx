"use client";

import { useState } from "react";
import type { Address, AddressPayload } from "@/types/api";
import { isValidPhone, isValidPostalCode } from "@/utils/validators";

const EMPTY: AddressPayload = {
  full_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "India",
};

export function AddressForm({
  initial,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initial?: Address;
  onSubmit: (payload: AddressPayload) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}) {
  const [values, setValues] = useState<AddressPayload>(initial ?? EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update<K extends keyof AddressPayload>(key: K, value: AddressPayload[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};
    if (!values.full_name.trim()) nextErrors.full_name = "Full name is required.";
    if (!isValidPhone(values.phone)) nextErrors.phone = "Enter a valid phone number.";
    if (!values.line1.trim()) nextErrors.line1 = "Address line is required.";
    if (!values.city.trim()) nextErrors.city = "City is required.";
    if (!values.state.trim()) nextErrors.state = "State is required.";
    if (!isValidPostalCode(values.postal_code)) nextErrors.postal_code = "Enter a valid postal code.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" error={errors.full_name}>
          <input
            value={values.full_name}
            onChange={(e) => update("full_name", e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            required
          />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <input value={values.phone} onChange={(e) => update("phone", e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900" required />
        </Field>
      </div>
      <Field label="Address line 1" error={errors.line1}>
        <input value={values.line1} onChange={(e) => update("line1", e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900" required />
      </Field>
      <Field label="Address line 2 (optional)">
        <input value={values.line2 ?? ""} onChange={(e) => update("line2", e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City" error={errors.city}>
          <input value={values.city} onChange={(e) => update("city", e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900" required />
        </Field>
        <Field label="State" error={errors.state}>
          <input value={values.state} onChange={(e) => update("state", e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900" required />
        </Field>
        <Field label="Postal code" error={errors.postal_code}>
          <input value={values.postal_code} onChange={(e) => update("postal_code", e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900" required />
        </Field>
      </div>
      <Field label="Country">
        <input value={values.country} onChange={(e) => update("country", e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900" required />
      </Field>
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "Save address"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-900">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
