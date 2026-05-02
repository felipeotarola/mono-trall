"use client"

import { ElevationControls } from "@/components/trall/elevation/elevation-controls"
import { ElevationSectionSvg } from "@/components/trall/elevation/elevation-section-svg"
import {
  getPoolDeckRelationship,
  type ElevationField,
  type ElevationSettings,
} from "@/lib/trall/elevation"
import { Badge } from "@workspace/ui/components/badge"

export function ElevationView({
  elevation,
  hasPool,
  onElevationChange,
}: {
  elevation: ElevationSettings
  hasPool: boolean
  onElevationChange: (field: ElevationField, value: number) => void
}) {
  const relationship = getPoolDeckRelationship(elevation)
  const relationshipVariant =
    relationship.status === "flush" ? "secondary" : "outline"

  return (
    <div className="relative min-h-[calc(100svh-11rem)] overflow-hidden bg-stone-50 pt-16 md:min-h-[calc(100svh-7rem)] dark:bg-zinc-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.34)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.34)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute top-20 right-4 rounded-md border bg-background/85 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur">
        Side elevation
      </div>

      <div className="relative flex h-[calc(100svh-13.5rem)] min-h-[560px] flex-col gap-3 overflow-y-auto px-3 py-8 md:h-[calc(100svh-10rem)] xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:items-stretch">
        <section className="min-h-[390px] rounded-lg border bg-background/90 p-3 shadow-sm backdrop-blur">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-sm font-semibold">Elevation section</h1>
              <p className="text-xs text-muted-foreground">
                Height relationship from ground, house, deck, and pool.
              </p>
            </div>
            <Badge variant={relationshipVariant}>
              {hasPool ? relationship.label : "No pool in project"}
            </Badge>
          </div>
          <div className="h-[420px] min-h-0">
            <ElevationSectionSvg elevation={elevation} hasPool={hasPool} />
          </div>
        </section>

        <aside className="xl:sticky xl:top-0 xl:self-start">
          <ElevationControls
            elevation={elevation}
            onChange={onElevationChange}
          />
        </aside>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 border-t bg-background/80 px-4 py-3 text-xs text-muted-foreground backdrop-blur">
        Side view is an inspection view. Use Top view to edit plan geometry,
        pool shape, doors, and measurements.
      </div>
    </div>
  )
}
