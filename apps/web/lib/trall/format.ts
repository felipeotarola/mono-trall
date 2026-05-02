export function formatMeters(value: number): string {
  const rounded = Math.round((value + Number.EPSILON) * 1000) / 1000
  return `${Number.isInteger(rounded) ? rounded : rounded.toString()} m`
}

export function formatCurrency(value: number): string {
  return `${Math.round(value).toLocaleString("sv-SE")} kr`
}
