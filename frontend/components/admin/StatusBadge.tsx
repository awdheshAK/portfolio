import { cn } from "@/lib/cn";
import type { OrderStatus } from "@/types/api";

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending_payment: "border-amber-200 bg-amber-50 text-amber-800",
  payment_confirmed: "border-blue-200 bg-blue-50 text-blue-800",
  processing: "border-blue-200 bg-blue-50 text-blue-800",
  customization_review: "border-purple-200 bg-purple-50 text-purple-800",
  production: "border-purple-200 bg-purple-50 text-purple-800",
  quality_check: "border-purple-200 bg-purple-50 text-purple-800",
  ready_to_ship: "border-teal-200 bg-teal-50 text-teal-800",
  shipped: "border-teal-200 bg-teal-50 text-teal-800",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-800",
  cancelled: "border-neutral-200 bg-neutral-100 text-neutral-600",
  refunded: "border-red-200 bg-red-50 text-red-700",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium capitalize",
        ORDER_STATUS_STYLES[status] ?? "border-neutral-200 bg-neutral-100 text-neutral-600"
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

/**
 * `active` is `undefined` for a few resources whose backend JSON resource
 * doesn't currently serialize `is_active` (see the note in types/api.ts) —
 * in that case this renders as "Active" rather than asserting a state the
 * API never actually told us.
 */
export function ActiveBadge({ active }: { active: boolean | undefined }) {
  const isActive = active ?? true;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        isActive ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-neutral-200 bg-neutral-100 text-neutral-600"
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

export function DisabledBadge({ disabled }: { disabled: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        disabled ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"
      )}
    >
      {disabled ? "Disabled" : "Active"}
    </span>
  );
}
