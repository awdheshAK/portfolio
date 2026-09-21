"use client";

import { useState } from "react";
import type { Coupon, CouponPayload } from "@/types/api";
import * as couponsService from "@/services/admin/coupons";
import { ResourceListPage } from "@/components/admin/ResourceListPage";
import { ActiveBadge } from "@/components/admin/StatusBadge";
import { MoneyField } from "@/components/admin/MoneyField";
import { FormField } from "@/components/auth/FormField";
import { formatDate, formatMoney } from "@/lib/format";

export default function AdminCouponsPage() {
  return (
    <ResourceListPage<Coupon>
      title="Coupons"
      singularLabel="coupon"
      description="Discount codes customers can apply at checkout."
      newButtonLabel="New Coupon"
      getId={(c) => c.id}
      getName={(c) => c.code}
      fetchAll={couponsService.getAdminCoupons}
      createItem={(payload) => couponsService.createAdminCoupon(payload as CouponPayload)}
      updateItem={(id, payload) => couponsService.updateAdminCoupon(id, payload as CouponPayload)}
      deleteItem={couponsService.deleteAdminCoupon}
      emptyTitle="No coupons yet"
      emptyDescription="Create a coupon code to offer a discount."
      columns={[
        { header: "Code", render: (c) => <span className="font-mono text-sm font-medium text-neutral-900">{c.code}</span> },
        { header: "Type", render: (c) => <span className="capitalize text-neutral-600">{c.type}</span> },
        {
          header: "Value",
          render: (c) => (c.type === "percentage" ? `${c.value}%` : formatMoney(c.value)),
        },
        {
          header: "Usage",
          render: (c) => `${c.used_count}${c.usage_limit ? ` / ${c.usage_limit}` : ""}`,
        },
        { header: "Expires", render: (c) => formatDate(c.expires_at) },
        { header: "Status", render: (c) => <ActiveBadge active={c.is_active} /> },
      ]}
      renderForm={({ initial, onSubmit, isSubmitting, fieldErrors }) => (
        <CouponForm initial={initial} onSubmit={onSubmit} isSubmitting={isSubmitting} fieldErrors={fieldErrors} />
      )}
    />
  );
}

function toDateInput(value?: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function CouponForm({
  initial,
  onSubmit,
  isSubmitting,
  fieldErrors,
}: {
  initial?: Coupon;
  onSubmit: (payload: CouponPayload) => void;
  isSubmitting: boolean;
  fieldErrors: Record<string, string[]>;
}) {
  const [code, setCode] = useState(initial?.code ?? "");
  const [type, setType] = useState<"percentage" | "fixed">(initial?.type ?? "percentage");
  const [percentValue, setPercentValue] = useState(initial && initial.type === "percentage" ? String(initial.value) : "10");
  const [fixedValueMinor, setFixedValueMinor] = useState(initial && initial.type === "fixed" ? initial.value : 0);
  const [minOrderMinor, setMinOrderMinor] = useState(initial?.min_order_minor ?? 0);
  const [maxDiscountMinor, setMaxDiscountMinor] = useState<number | undefined>(initial?.max_discount_minor ?? undefined);
  const [usageLimit, setUsageLimit] = useState(initial?.usage_limit ? String(initial.usage_limit) : "");
  const [startsAt, setStartsAt] = useState(toDateInput(initial?.starts_at));
  const [expiresAt, setExpiresAt] = useState(toDateInput(initial?.expires_at));
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      code: code.trim().toUpperCase(),
      type,
      value: type === "percentage" ? Number(percentValue) : fixedValueMinor,
      min_order_minor: minOrderMinor || undefined,
      max_discount_minor: maxDiscountMinor || undefined,
      usage_limit: usageLimit.trim() ? Number(usageLimit) : undefined,
      starts_at: startsAt || undefined,
      expires_at: expiresAt || undefined,
      is_active: isActive,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Code" error={fieldErrors.code?.[0]}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Type" error={fieldErrors.type?.[0]}>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "percentage" | "fixed")}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </FormField>
        {type === "percentage" ? (
          <FormField label="Value (%)" error={fieldErrors.value?.[0]}>
            <input
              type="number"
              min={1}
              max={100}
              value={percentValue}
              onChange={(e) => setPercentValue(e.target.value)}
              required
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            />
          </FormField>
        ) : (
          <MoneyField
            key={`fixed-${initial?.id ?? "new"}`}
            label="Discount amount"
            initialMinor={fixedValueMinor}
            onChange={setFixedValueMinor}
            required
            error={fieldErrors.value?.[0]}
          />
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <MoneyField
          key={`min-${initial?.id ?? "new"}`}
          label="Minimum order value (optional)"
          initialMinor={minOrderMinor}
          onChange={setMinOrderMinor}
          error={fieldErrors.min_order_minor?.[0]}
        />
        <MoneyField
          key={`max-${initial?.id ?? "new"}`}
          label="Maximum discount (optional)"
          initialMinor={maxDiscountMinor}
          onChange={setMaxDiscountMinor}
          error={fieldErrors.max_discount_minor?.[0]}
        />
      </div>
      <FormField label="Usage limit (optional)" error={fieldErrors.usage_limit?.[0]}>
        <input
          type="number"
          min={1}
          value={usageLimit}
          onChange={(e) => setUsageLimit(e.target.value)}
          placeholder="Unlimited"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Starts at (optional)" error={fieldErrors.starts_at?.[0]}>
          <input
            type="date"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          />
        </FormField>
        <FormField label="Expires at (optional)" error={fieldErrors.expires_at?.[0]}>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          />
        </FormField>
      </div>
      <label className="flex items-center gap-2 text-sm text-neutral-800">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
        Active
      </label>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "Save coupon"}
        </button>
      </div>
    </form>
  );
}
