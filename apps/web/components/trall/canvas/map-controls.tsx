"use client"

import type { ReactNode } from "react"
import {
  HandIcon,
  Maximize2Icon,
  MinusIcon,
  PlusIcon,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import type { ActiveTool } from "@/lib/trall/types"

export function MapControlsPanel({
  activeTool,
  onResetView,
  onZoomIn,
  onZoomOut,
  setActiveTool,
  zoomPercent,
}: {
  activeTool: ActiveTool
  onResetView: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  setActiveTool: (tool: ActiveTool) => void
  zoomPercent: number
}) {
  const panActive = activeTool === "pan"

  return (
    <div className="absolute bottom-24 left-4 z-30 flex items-end gap-2 sm:bottom-20">
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white/94 shadow-lg shadow-black/10 backdrop-blur">
        <div className="grid">
          <MapControlButton label="Zoom in" onClick={onZoomIn}>
            <PlusIcon />
          </MapControlButton>
          <Separator />
          <MapControlButton label="Zoom out" onClick={onZoomOut}>
            <MinusIcon />
          </MapControlButton>
          <Separator />
          <MapControlButton label="Fit view" onClick={onResetView}>
            <Maximize2Icon />
          </MapControlButton>
          <Separator />
          <MapControlButton
            active={panActive}
            label={panActive ? "Pan active" : "Pan canvas"}
            onClick={() => setActiveTool(panActive ? "select" : "pan")}
          >
            <HandIcon />
          </MapControlButton>
        </div>
      </div>
      <div className="hidden rounded-lg border border-stone-200 bg-white/90 px-2 py-1 text-xs font-medium text-stone-600 shadow-sm backdrop-blur sm:block">
        {zoomPercent}%
      </div>
    </div>
  )
}

function MapControlButton({
  active,
  children,
  label,
  onClick,
}: {
  active?: boolean
  children: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <Button
      aria-pressed={active}
      className="size-10 rounded-none border-0 bg-transparent text-stone-700 hover:bg-stone-100"
      size="icon-lg"
      title={label}
      variant={active ? "secondary" : "ghost"}
      onClick={onClick}
    >
      {children}
      <span className="sr-only">{label}</span>
    </Button>
  )
}
