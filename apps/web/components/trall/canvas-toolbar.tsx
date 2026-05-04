"use client"

import type { ReactNode } from "react"
import {
  HandIcon,
  Maximize2Icon,
  MinusIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SaveIcon,
  Undo2Icon,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import type { ActiveTool, PlannerViewMode, Tool } from "@/lib/trall/types"

export function CanvasToolbar({
  activeTool,
  extraTool,
  modeLabel,
  onResetView,
  onSaveProject,
  onViewModeChange,
  onZoomIn,
  onZoomOut,
  saveStatus,
  setActiveTool,
  viewMode,
  zoomPercent,
}: {
  activeTool: ActiveTool
  extraTool: Tool
  modeLabel: string
  onResetView: () => void
  onSaveProject: () => void
  onViewModeChange: (mode: PlannerViewMode) => void
  onZoomIn: () => void
  onZoomOut: () => void
  saveStatus: string
  setActiveTool: (tool: ActiveTool) => void
  viewMode: PlannerViewMode
  zoomPercent: number
}) {
  const panActive = activeTool === "pan"

  return (
    <div className="absolute top-3 left-3 z-20 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-white/92 p-2 shadow-sm backdrop-blur">
      <div className="flex min-h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white/70 px-3 py-1">
        <span className="hidden text-[10px] font-semibold tracking-[0.12em] text-stone-500 uppercase sm:inline">
          Mode
        </span>
        <span className="rounded-md bg-stone-950 px-2.5 py-1 text-xs font-semibold text-white">
          {modeLabel}
        </span>
      </div>

      <div
        aria-label="Planner view"
        className="flex h-10 items-center rounded-lg border border-stone-200 bg-stone-100 p-1"
        role="group"
      >
        <button
          aria-pressed={viewMode === "top"}
          className={getViewModeButtonClass(viewMode === "top")}
          type="button"
          onClick={() => onViewModeChange("top")}
        >
          Top
        </button>
        <button
          aria-pressed={viewMode === "3d"}
          className={getViewModeButtonClass(viewMode === "3d")}
          type="button"
          onClick={() => onViewModeChange("3d")}
        >
          3D
        </button>
      </div>

      {viewMode === "top" ? (
        <div
          aria-label="Canvas view controls"
          className="flex h-10 items-center overflow-hidden rounded-lg border border-stone-200 bg-white/75"
          role="group"
        >
          <ToolbarIconButton label="Zoom out" onClick={onZoomOut}>
            <MinusIcon />
          </ToolbarIconButton>
          <ToolbarIconButton label="Fit view" onClick={onResetView}>
            <Maximize2Icon />
          </ToolbarIconButton>
          <ToolbarIconButton label="Zoom in" onClick={onZoomIn}>
            <PlusIcon />
          </ToolbarIconButton>
          <span className="hidden min-w-14 px-2 text-center text-xs font-semibold text-stone-600 sm:inline">
            {zoomPercent}%
          </span>
          <ToolbarIconButton
            active={panActive}
            label={panActive ? "Pan active" : "Pan canvas"}
            onClick={() => setActiveTool(panActive ? "select" : "pan")}
          >
            <HandIcon />
          </ToolbarIconButton>
        </div>
      ) : null}

      <Button
        aria-label="Save project"
        className="h-10 min-w-10 gap-1.5 px-2.5"
        size="lg"
        title="Save project"
        variant="outline"
        onClick={onSaveProject}
      >
        <SaveIcon />
        <span className="hidden sm:inline">Save</span>
      </Button>

      <span className="hidden h-10 min-w-24 items-center justify-center rounded-lg px-2 text-xs font-medium text-muted-foreground md:flex">
        {saveStatus}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="More project actions"
            className="size-10"
            size="icon-lg"
            variant="ghost"
          >
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Project actions</DropdownMenuLabel>
          <ProjectAction
            disabled
            icon={Undo2Icon}
            label="Undo"
            title="Undo is not available yet"
          />
          <DropdownMenuItem
            className="h-9 gap-2"
            onSelect={() => extraTool.onClick?.()}
          >
            {extraTool.icon}
            {extraTool.label}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="font-normal text-muted-foreground">
            Status: {saveStatus}
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function ToolbarIconButton({
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
    <button
      aria-label={label}
      aria-pressed={active}
      className={
        active
          ? "flex size-10 items-center justify-center bg-stone-950 text-white"
          : "flex size-10 items-center justify-center text-stone-700 hover:bg-stone-100 hover:text-stone-950"
      }
      title={label}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function getViewModeButtonClass(active: boolean) {
  return active
    ? "h-8 rounded-md bg-stone-950 px-3 text-xs font-semibold text-white shadow-sm"
    : "h-8 rounded-md px-3 text-xs font-semibold text-stone-600 hover:bg-white/75 hover:text-stone-950"
}

function ProjectAction({
  disabled,
  icon: Icon,
  label,
  title,
}: {
  disabled?: boolean
  icon: LucideIcon
  label: string
  title?: string
}) {
  return (
    <DropdownMenuItem disabled={disabled} className="h-9 gap-2" title={title}>
      <Icon />
      {label}
    </DropdownMenuItem>
  )
}
