export const MONEY_UNAVAILABLE = "n/a";

export function formatMoney(
  amount: string | number | null | undefined,
  currency: string | null | undefined,
  locale = "en-US",
): string {
  if (amount === null || amount === undefined || amount === "") return MONEY_UNAVAILABLE;

  const value = Number(amount);
  if (!Number.isFinite(value)) return MONEY_UNAVAILABLE;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
