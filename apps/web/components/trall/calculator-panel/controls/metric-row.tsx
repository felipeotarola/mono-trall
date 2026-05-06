import type { Metric } from "@/lib/trall/types"

const labelMap: Record<string, string> = {
  "Board run": "Brädgård",
  "Deck area": "Däckyta",
  Perimeter: "Omkrets",
  "Project name": "Projektnamn",
  "Waste factor": "Spillfaktor",
}

export function MetricRow({ label, value }: Metric) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2">
      <span className="min-w-0 truncate text-sm text-muted-foreground">
        {labelMap[label] ?? label}
      </span>
      <span className="shrink-0 text-sm font-semibold">{value}</span>
    </div>
  )
}
