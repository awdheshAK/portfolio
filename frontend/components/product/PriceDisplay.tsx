import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";

export function PriceDisplay({
  priceMinor,
  salePriceMinor,
  currency = "INR",
  size = "md",
  className,
}: {
  priceMinor: number;
  salePriceMinor?: number | null;
  currency?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const hasSale = typeof salePriceMinor === "number" && salePriceMinor < priceMinor;
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl",
  }[size];

  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className={cn("font-semibold text-neutral-900", sizeClasses)}>
        {formatMoney(hasSale ? salePriceMinor : priceMinor, currency)}
      </span>
      {hasSale && (
        <span className={cn("text-neutral-400 line-through", size === "lg" ? "text-base" : "text-sm")}>
          {formatMoney(priceMinor, currency)}
        </span>
      )}
    </div>
  );
}

export function DiscountBadge({ priceMinor, salePriceMinor }: { priceMinor: number; salePriceMinor?: number | null }) {
  if (typeof salePriceMinor !== "number" || salePriceMinor >= priceMinor || priceMinor <= 0) return null;
  const percentOff = Math.round(((priceMinor - salePriceMinor) / priceMinor) * 100);
  if (percentOff <= 0) return null;
  return (
    <span className="absolute left-2 top-2 rounded-full bg-rose-600 px-2 py-1 text-xs font-semibold text-white shadow-sm">
      {percentOff}% OFF
    </span>
  );
}
