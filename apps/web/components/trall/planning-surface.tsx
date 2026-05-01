"use client"

import type { Dispatch, SetStateAction } from "react"

import { PlanSvg } from "@/components/trall/plan-svg"
import { ScaleIndicator } from "@/components/trall/svg/scale-indicator"
import type {
  ActiveTool,
  HouseBounds,
  Point,
  ViewBox,
} from "@/lib/trall/types"

export function PlanningSurface({
  activeTool,
  activePointIndex,
  deckPoints,
  houseBounds,
  setActivePointIndex,
  setDeckPoints,
  setViewBox,
  viewBox,
}: {
  activeTool: ActiveTool
  activePointIndex: number | null
  deckPoints: Point[]
  houseBounds: HouseBounds
  setActivePointIndex: (index: number | null) => void
  setDeckPoints: Dispatch<SetStateAction<Point[]>>
  setViewBox: Dispatch<SetStateAction<ViewBox>>
  viewBox: ViewBox
}) {
  return (
    <div className="relative min-h-[calc(100svh-11rem)] overflow-hidden bg-stone-50 pt-16 dark:bg-zinc-950 md:min-h-[calc(100svh-7rem)]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.48)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.48)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.36)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.36)_1px,transparent_1px)] bg-[size:160px_160px]" />
      <div className="absolute left-0 top-16 h-px w-full bg-blue-500/20" />
      <div className="absolute left-16 top-0 h-full w-px bg-blue-500/20" />
      <div className="absolute left-16 top-16 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/50" />

      <div className="absolute left-4 top-20 hidden rounded-md border bg-background/80 px-2 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur sm:block">
        x 0, y 0
      </div>

      <p className="absolute right-4 top-20 rounded-md border bg-background/85 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur">
        Drag points to adjust deck shape
      </p>

      <div className="relative flex min-h-[calc(100svh-13.5rem)] items-center justify-center px-3 py-8 md:min-h-[calc(100svh-10rem)]">
        <div className="aspect-square w-[min(900px,98%)]">
          <PlanSvg
            activeTool={activeTool}
            activePointIndex={activePointIndex}
            deckPoints={deckPoints}
            houseBounds={houseBounds}
            setActivePointIndex={setActivePointIndex}
            setDeckPoints={setDeckPoints}
            setViewBox={setViewBox}
            viewBox={viewBox}
          />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 border-t bg-background/80 px-4 py-3 text-xs text-muted-foreground backdrop-blur sm:flex-row sm:items-end sm:justify-between">
        <ScaleIndicator />
        <span>
          Scale 1:100 · 1 grid square = 0.5 m · Cmd/Ctrl snaps angle · Alt
          disables grid · Shift locks axis · Space pans · Click a dimension to
          edit length
        </span>
      </div>
    </div>
  )
}
