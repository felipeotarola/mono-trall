export function formatMeters(value: number): string {
  return `${value.toFixed(1)} m`
}

export function formatCurrency(value: number): string {
  return `${Math.round(value).toLocaleString("sv-SE")} kr`
}
