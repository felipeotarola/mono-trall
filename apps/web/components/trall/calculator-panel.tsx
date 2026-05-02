"use client"

import type { Dispatch, SetStateAction } from "react"
import { QuoteIcon } from "lucide-react"

import { MaterialsManager } from "@/components/trall/materials-manager"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import type { HouseModel, Material, Metric } from "@/lib/trall/types"
import { clamp } from "@/lib/trall/geometry"

export function CalculatorPanel({
  calculations,
  ensureProject,
  house,
  projectId,
  setHouse,
}: {
  calculations: {
    priceLabel: string
    metrics: Metric[]
    materials: Material[]
  }
  ensureProject: () => Promise<string>
  house: HouseModel
  projectId: string | null
  setHouse: Dispatch<SetStateAction<HouseModel>>
}) {
  return (
    <div className="space-y-3">
      <Card size="sm" className="bg-zinc-950 text-white dark:bg-primary">
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-white/70">Estimated material price</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              {calculations.priceLabel}
            </p>
            <p className="mt-1 text-xs text-white/60">
              Includes 10% waste factor
            </p>
          </div>
          <Button className="w-full bg-white text-zinc-950 hover:bg-white/90">
            <QuoteIcon />
            Create quote
          </Button>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Measurements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {calculations.metrics.map((metric) => (
            <MetricRow key={metric.label} {...metric} />
          ))}
        </CardContent>
      </Card>

      <MaterialsManager ensureProject={ensureProject} projectId={projectId} />

      <HouseDimensionsCard house={house} setHouse={setHouse} />

      <Card size="sm">
        <CardHeader>
          <CardTitle>Project summary</CardTitle>
          <CardDescription>Backyard deck extension</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <MetricRow label="House template" value="Single family house" />
          <MetricRow label="Deck type" value="Attached angled edge" />
          <MetricRow label="Last saved" value="Mock draft · 2 min ago" />
        </CardContent>
      </Card>
    </div>
  )
}

function MetricRow({ label, value }: Metric) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/25 px-3 py-2">
      <span className="min-w-0 truncate text-sm text-muted-foreground">
        {label}
      </span>
      <span className="shrink-0 text-sm font-semibold">{value}</span>
    </div>
  )
}

function HouseDimensionsCard({
  house,
  setHouse,
}: {
  house: HouseModel
  setHouse: Dispatch<SetStateAction<HouseModel>>
}) {
  function updateHouseDimension(key: "widthM" | "depthM", value: string) {
    const numericValue = Number.parseFloat(value)
    if (!Number.isFinite(numericValue)) {
      return
    }

    const bounds = key === "widthM" ? { min: 2, max: 30 } : { min: 2, max: 20 }

    setHouse((current) => ({
      ...current,
      [key]: clamp(numericValue, bounds.min, bounds.max),
    }))
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>House dimensions</CardTitle>
        <CardDescription>
          Set house size first, then snap deck points to the wall.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Width</span>
          <div className="flex items-center gap-1 rounded-lg border bg-background px-2">
            <Input
              className="border-0 px-0 shadow-none focus-visible:ring-0"
              inputMode="decimal"
              max={30}
              min={2}
              step={0.1}
              type="number"
              value={house.widthM}
              onChange={(event) =>
                updateHouseDimension("widthM", event.target.value)
              }
            />
            <span className="text-xs text-muted-foreground">m</span>
          </div>
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Depth</span>
          <div className="flex items-center gap-1 rounded-lg border bg-background px-2">
            <Input
              className="border-0 px-0 shadow-none focus-visible:ring-0"
              inputMode="decimal"
              max={20}
              min={2}
              step={0.1}
              type="number"
              value={house.depthM}
              onChange={(event) =>
                updateHouseDimension("depthM", event.target.value)
              }
            />
            <span className="text-xs text-muted-foreground">m</span>
          </div>
        </label>
      </CardContent>
    </Card>
  )
}
