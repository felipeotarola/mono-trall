"use client"

import { ElevationControls } from "@/components/trall/elevation/elevation-controls"
import { ElevationSectionSvg } from "@/components/trall/elevation/elevation-section-svg"
import {
  getPoolDeckRelationship,
  type ElevationField,
  type ElevationSettings,
} from "@/lib/trall/elevation"
import { trallPlanClasses } from "@/lib/trall/visual-style"
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
  const relationshipTone =
    relationship.status === "flush"
      ? "text-emerald-700"
      : relationship.status === "above"
        ? "text-amber-700"
        : "text-sky-700"

  return (
    <div
      className={`relative min-h-[calc(100svh-11rem)] overflow-hidden pt-16 md:min-h-[calc(100svh-7rem)] ${trallPlanClasses.page}`}
    >
      <div className={`absolute inset-0 ${trallPlanClasses.gridFine}`} />

      <div className="relative h-[calc(100svh-13.5rem)] min-h-[560px] overflow-y-auto px-3 py-5 md:h-[calc(100svh-10rem)] md:px-5">
        <section className="mx-auto grid max-w-7xl overflow-hidden rounded-xl border border-stone-200 bg-[#fffdf7] shadow-sm 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 border-b border-stone-200 p-4 md:p-5 2xl:border-r 2xl:border-b-0">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Side elevation
                </p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-950">
                  Height relationship
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-stone-600">
                  Inspect house floor, deck build-up, ground level, and pool
                  position without leaving the top-down planner.
                </p>
              </div>
              <Badge
                className={`border bg-white px-3 py-1 text-sm ${relationshipTone}`}
                variant={relationshipVariant}
              >
                {hasPool ? relationship.label : "No pool in project"}
              </Badge>
            </div>

            <div className="h-[min(62svh,620px)] min-h-[460px] rounded-lg border border-stone-200 bg-white p-2 md:p-3">
              <ElevationSectionSvg elevation={elevation} hasPool={hasPool} />
            </div>
          </div>

          <aside className="bg-[#faf7ef] p-4 md:p-5">
            <div className="mb-4 rounded-lg border border-stone-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                Current relation
              </p>
              <p className={`mt-2 text-lg font-semibold ${relationshipTone}`}>
                {hasPool ? relationship.label : "Pool not added"}
              </p>
              <p className="mt-1 text-xs leading-5 text-stone-600">
                {hasPool
                  ? "The side drawing marks the vertical difference between the pool rim and finished deck surface."
                  : "Add a pool in Top view to compare pool height against the deck surface."}
              </p>
            </div>
            <ElevationControls
              elevation={elevation}
              onChange={onElevationChange}
            />
          </aside>
        </section>
      </div>
    </div>
  )
}
