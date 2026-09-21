import { formatMoney } from "@/lib/format";
import type { PriceBreakdown } from "@/types/api";

export function PriceSummary({
  price,
  isLoading,
  error,
}: {
  price: PriceBreakdown | null;
  isLoading: boolean;
  error: string | null;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 p-5">
      <h3 className="text-sm font-semibold text-neutral-900">Price</h3>
      {error ? (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      ) : !price ? (
        <p className="mt-3 text-sm text-neutral-500">{isLoading ? "Calculating…" : "Select your options to see a price."}</p>
      ) : (
        <div className="mt-3 space-y-2">
          {price.breakdown.map((line, i) => (
            <div key={i} className="flex items-center justify-between text-sm text-neutral-600">
              <span>{line.label}</span>
              <span>{formatMoney(line.amount_minor, price.currency)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-neutral-200 pt-2 text-base font-semibold text-neutral-900">
            <span>Total</span>
            <span className={isLoading ? "opacity-50" : ""}>{formatMoney(price.total_minor, price.currency)}</span>
          </div>
          <p className="pt-1 text-xs text-neutral-400">Final price is calculated by our server and may include taxes.</p>
        </div>
      )}
    </div>
  );
}
