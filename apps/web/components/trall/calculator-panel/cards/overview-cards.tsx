import {
  Layers3Icon,
  MountainIcon,
  PencilIcon,
  RulerIcon,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  normalizeElevationSettings,
  type ElevationSettings,
} from "@/lib/trall/elevation"
import type { Metric } from "@/lib/trall/types"

import { MetricRow } from "../controls/metric-row"

export function PriceSummaryCard({
  hasProjectMaterials,
  price,
}: {
  hasProjectMaterials: boolean
  price: string
}) {
  return (
    <Card
      size="sm"
      className="border-zinc-950 bg-zinc-950 text-white shadow-none dark:bg-primary"
    >
      <CardContent className="space-y-3 py-5">
        <div>
          <p className="text-sm text-white/70">Uppskattat materialpris</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight">{price}</p>
          <p className="mt-2 text-xs text-white/60">
            {hasProjectMaterials
              ? "Beräknat från material som tilldelats detta projekt."
              : "Visar en geometriuppskattning tills projektmaterial har lagts till."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function MeasurementsCard({ metrics }: { metrics: Metric[] }) {
  return (
    <Card size="sm" className="border-stone-200 shadow-none">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <RulerIcon className="size-4" />
        <CardTitle>Mått</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {metrics.map((metric) => (
          <MetricRow key={metric.label} {...metric} />
        ))}
      </CardContent>
    </Card>
  )
}

export function TerrainSummaryCard({
  elevationSettings,
}: {
  elevationSettings: ElevationSettings
}) {
  const normalized = normalizeElevationSettings(elevationSettings)
  const modeLabel =
    normalized.terrain.mode === "single_slope" ? "Single slope" : "Flat"

  return (
    <Card size="sm" className="border-stone-200 shadow-none">
      <CardContent className="flex items-center justify-between gap-3 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MountainIcon className="size-4" />
            <CardTitle>Nivåer & terräng</CardTitle>
          </div>
          <CardDescription className="mt-1 truncate">
            {modeLabel} · pool {normalized.pool.bodyHeightCm} cm · deck{" "}
            {normalized.deck.finishedHeightCm} cm
          </CardDescription>
        </div>
        <Button size="sm" variant="outline" type="button">
          <PencilIcon className="size-4" />
          Redigera nivåer
        </Button>
      </CardContent>
    </Card>
  )
}

export function ProjectSummaryCard({ projectName }: { projectName: string }) {
  return (
    <Card size="sm" className="border-stone-200 shadow-none">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <Layers3Icon className="size-4" />
        <CardTitle>Projektsammanfattning</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <MetricRow label="Project name" value={projectName} />
        <MetricRow label="House template" value="Single family house" />
        <MetricRow label="Deck type" value="Attached angled edge" />
        <MetricRow label="Last saved" value="Mock draft · 2 min ago" />
      </CardContent>
    </Card>
  )
}
