const amountFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatAmount(value: number) {
  return Number.isFinite(value) ? `$${amountFormat.format(value)}` : "—";
}
