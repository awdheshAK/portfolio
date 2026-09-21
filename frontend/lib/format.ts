const currencyFormatterCache = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(currency: string): Intl.NumberFormat {
  const key = currency.toUpperCase();
  let formatter = currencyFormatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: key,
      maximumFractionDigits: 0,
    });
    currencyFormatterCache.set(key, formatter);
  }
  return formatter;
}

/**
 * Formats an integer minor-unit amount (e.g. paise) as a display currency
 * string. Never do arithmetic on the formatted string — only on the minor
 * unit integers themselves.
 */
export function formatMoney(amountMinor: number | null | undefined, currency = "INR"): string {
  if (amountMinor === null || amountMinor === undefined || Number.isNaN(amountMinor)) return "—";
  return getCurrencyFormatter(currency).format(amountMinor / 100);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}
