"use client"

import type { Dispatch, SetStateAction } from "react"
import { useEffect, useRef } from "react"

import { PlanSvg } from "@/components/trall/plan-svg"
import { ScaleIndicator } from "@/components/trall/svg/scale-indicator"
import type { ActiveTool, HouseBounds, Point, ViewBox } from "@/lib/trall/types"
import type { SupportSegment } from "@/lib/trall/supports"

export function PlanningSurface({
  activeTool,
  activePointIndex,
  deckPoints,
  houseBounds,
  setActivePointIndex,
  setDeckPoints,
  setViewAspectRatio,
  setViewBox,
  supportSegments,
  onResetView,
  viewBox,
  zoomPercent,
}: {
  activeTool: ActiveTool
  activePointIndex: number | null
  deckPoints: Point[]
  houseBounds: HouseBounds
  setActivePointIndex: (index: number | null) => void
  setDeckPoints: Dispatch<SetStateAction<Point[]>>
  setViewAspectRatio: (aspectRatio: number) => void
  setViewBox: Dispatch<SetStateAction<ViewBox>>
  supportSegments: SupportSegment[]
  onResetView: () => void
  viewBox: ViewBox
  zoomPercent: number
}) {
  const canvasFrameRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvasFrame = canvasFrameRef.current
    if (!canvasFrame) {
      return
    }

    const updateAspectRatio = () => {
      const { width, height } = canvasFrame.getBoundingClientRect()
      if (width > 0 && height > 0) {
        setViewAspectRatio(width / height)
      }
    }

    updateAspectRatio()
    const resizeObserver = new ResizeObserver(updateAspectRatio)
    resizeObserver.observe(canvasFrame)

    return () => resizeObserver.disconnect()
  }, [setViewAspectRatio])

  return (
    <div className="relative min-h-[calc(100svh-11rem)] overflow-hidden bg-stone-50 pt-16 md:min-h-[calc(100svh-7rem)] dark:bg-zinc-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.48)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.48)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.36)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.36)_1px,transparent_1px)] bg-[size:160px_160px]" />
      <div className="absolute top-16 left-0 h-px w-full bg-blue-500/20" />
      <div className="absolute top-0 left-16 h-full w-px bg-blue-500/20" />
      <div className="absolute top-16 left-16 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/50" />

      <div className="absolute top-20 left-4 hidden rounded-md border bg-background/80 px-2 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur sm:block">
        x 0, y 0
      </div>

      <p className="absolute top-20 right-4 rounded-md border bg-background/85 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur">
        Drag points to adjust deck shape
      </p>

      <div className="relative flex h-[calc(100svh-13.5rem)] min-h-[520px] items-stretch justify-center px-3 py-8 md:h-[calc(100svh-10rem)]">
        <div ref={canvasFrameRef} className="h-full w-full">
          <PlanSvg
            activeTool={activeTool}
            activePointIndex={activePointIndex}
            deckPoints={deckPoints}
            houseBounds={houseBounds}
            setActivePointIndex={setActivePointIndex}
            setDeckPoints={setDeckPoints}
            setViewBox={setViewBox}
            supportSegments={supportSegments}
            onResetView={onResetView}
            viewBox={viewBox}
          />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 border-t bg-background/80 px-4 py-3 text-xs text-muted-foreground backdrop-blur sm:flex-row sm:items-end sm:justify-between">
        <ScaleIndicator />
        <span>
          Scale 1:100 · 1 grid square = 0.5 m · Cmd/Ctrl snaps angle · Alt
          disables grid · Shift locks axis · Space pans · Zoom {zoomPercent}% ·
          Click a dimension to edit length · When edge snaps to house, it
          becomes attached
        </span>
      </div>
    </div>
  )
}
