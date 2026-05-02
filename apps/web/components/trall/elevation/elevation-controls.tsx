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
    <div className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-zinc-950">
          Height controls
        </h2>
        <p className="text-xs text-stone-600">
          Values are saved with the current project.
        </p>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2 2xl:grid-cols-1">
        {elevationControls.map((control) => {
          const range = elevationRanges[control.field]

          return (
            <Label
              key={control.field}
              className="grid gap-1.5 rounded-md border border-stone-200 bg-[#fffdf7] p-2.5"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-zinc-900">
                  {control.label}
                </span>
                <span className="text-xs font-normal text-stone-500">cm</span>
              </span>
              <span className="flex items-center overflow-hidden rounded-lg border border-stone-200 bg-white focus-within:border-zinc-400 focus-within:ring-3 focus-within:ring-zinc-200/70">
                <Input
                  className="h-9 border-0 bg-transparent text-base shadow-none focus-visible:ring-0 md:text-sm"
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
                <span className="border-l border-stone-200 px-2 text-xs text-stone-500">
                  cm
                </span>
              </span>
              <span className="text-xs font-normal leading-4 text-stone-600">
                {control.description} - {range.min}-{range.max} cm
              </span>
            </Label>
          )
        })}
      </div>
    </div>
  )
}
