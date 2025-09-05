export function formatCurrency(
  value: number,
  locale: string = "es-AR",
  currency: string = "ARS"
): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    value
  );
}
