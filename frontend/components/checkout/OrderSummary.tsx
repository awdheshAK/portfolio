import type { Cart } from "@/types/api";
import { formatMoney } from "@/lib/format";

export function OrderSummary({ cart }: { cart: Cart }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-5">
      <h2 className="text-sm font-semibold text-neutral-900">Order Summary</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between text-neutral-600">
          <dt>Subtotal</dt>
          <dd>{formatMoney(cart.subtotal_minor, cart.currency)}</dd>
        </div>
        {!!cart.discount_minor && (
          <div className="flex items-center justify-between text-emerald-700">
            <dt>Discount</dt>
            <dd>−{formatMoney(cart.discount_minor, cart.currency)}</dd>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-neutral-200 pt-2 text-base font-semibold text-neutral-900">
          <dt>Total</dt>
          <dd>{formatMoney(cart.total_minor, cart.currency)}</dd>
        </div>
      </dl>
    </div>
  );
}
