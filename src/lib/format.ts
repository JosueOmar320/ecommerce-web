/**
 * Money arrives from the API as integer minor units (`*Cents`) plus an ISO 4217 currency.
 * Formatting happens only at the edge, with Intl, in the user's language.
 */
const moneyFormatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(cents: number, currency: string, locale: string): string {
  const key = `${locale}|${currency}`;
  let formatter = moneyFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
    moneyFormatters.set(key, formatter);
  }
  return formatter.format(cents / 100);
}

/** "$249.00" or "$249.00 – $399.00" (null when the product has no active variant). */
export function formatPriceRange(
  minCents: number | null,
  maxCents: number | null,
  currency: string,
  locale: string,
): string | null {
  if (minCents === null) return null;
  const min = formatMoney(minCents, currency, locale);
  return maxCents === null || maxCents === minCents
    ? min
    : `${min} – ${formatMoney(maxCents, currency, locale)}`;
}

const dateFormatters = new Map<string, Intl.DateTimeFormat>();

export function formatDate(
  iso: string,
  locale: string,
  style: 'medium' | 'long' = 'medium',
): string {
  const key = `${locale}|${style}`;
  let formatter = dateFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { dateStyle: style });
    dateFormatters.set(key, formatter);
  }
  return formatter.format(new Date(iso));
}

export function formatDateTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  );
}

/** "499.99" → 49999 using string arithmetic (no floating-point rounding). */
export function decimalToCents(value: string): number {
  const [whole = '0', fraction = ''] = value.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2));
}

/** Currency symbol for input adornments, e.g. "$" for USD in en, "US$" in es. */
export function currencySymbol(currency: string, locale: string): string {
  return (
    new Intl.NumberFormat(locale, { style: 'currency', currency })
      .formatToParts(0)
      .find((part) => part.type === 'currency')?.value ?? currency
  );
}
