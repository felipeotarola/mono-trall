"use client"

import {
  elevationRanges,
  type ElevationField,
  type ElevationSettings,
} from "@/lib/trall/elevation"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

const elevationControls = [
  {
    field: "deckHeightCm",
    label: "Deck height",
    description: "Ground to finished deck surface",
  },
  {
    field: "poolTopHeightCm",
    label: "Pool top height",
    description: "Ground to pool rim/top",
  },
  {
    field: "poolDepthCm",
    label: "Pool depth",
    description: "Pool body below the rim",
  },
  {
    field: "houseFloorHeightCm",
    label: "House floor height",
    description: "Ground to finished house floor",
  },
] satisfies {
  field: ElevationField
  label: string
  description: string
}[]

export function ElevationControls({
  elevation,
  onChange,
}: {
  elevation: ElevationSettings
  onChange: (field: ElevationField, value: number) => void
}) {
  return (
    <div className="rounded-lg border bg-background/95 p-3 shadow-sm">
      <div className="mb-3">
        <h2 className="text-sm font-semibold">Height controls</h2>
        <p className="text-xs text-muted-foreground">
          Values are saved with the current project.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {elevationControls.map((control) => {
          const range = elevationRanges[control.field]

          return (
            <Label key={control.field} className="grid gap-1.5">
              <span className="flex items-center justify-between gap-2">
                <span>{control.label}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  cm
                </span>
              </span>
              <Input
                inputMode="numeric"
                max={range.max}
                min={range.min}
                step={1}
                type="number"
                value={elevation[control.field]}
                onChange={(event) => {
                  const value = Number.parseFloat(event.target.value)

                  if (Number.isFinite(value)) {
                    onChange(control.field, value)
                  }
                }}
              />
              <span className="text-xs font-normal leading-4 text-muted-foreground">
                {control.description} - {range.min}-{range.max} cm
              </span>
            </Label>
          )
        })}
      </div>
    </div>
  )
}
