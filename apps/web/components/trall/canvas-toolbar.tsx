"use client"

import type { ReactNode } from "react"
import {
  ChevronDownIcon,
  HandIcon,
  Maximize2Icon,
  MinusIcon,
  MoreHorizontalIcon,
  PlusIcon,
  Redo2Icon,
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
  canRedo,
  canUndo,
  onRedo,
  onResetView,
  onSaveProject,
  onUndo,
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
  canRedo: boolean
  canUndo: boolean
  onRedo: () => void
  onResetView: () => void
  onSaveProject: () => void
  onUndo: () => void
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
    <div className="flex h-14 shrink-0 items-center gap-3 overflow-x-auto border-b border-stone-200 bg-white px-4">
      <div className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3">
        <span className="text-[10px] font-semibold tracking-[0.14em] text-stone-500 uppercase">
          Läge
        </span>
        <button
          className="flex h-7 items-center gap-2 rounded-md px-1 text-xs font-semibold text-stone-950 hover:bg-stone-50"
          type="button"
          onClick={() => setActiveTool(activeTool === "select" ? "draw" : "select")}
        >
          {modeLabel}
          <ChevronDownIcon className="size-3.5 text-stone-500" />
        </button>
      </div>

      <div
        aria-label="Planner view"
        className="flex h-9 shrink-0 items-center rounded-lg border border-stone-200 bg-stone-50 p-1"
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
          className="flex h-9 shrink-0 items-center overflow-hidden rounded-lg border border-stone-200 bg-white"
          role="group"
        >
          <ToolbarIconButton label="Zoom out" onClick={onZoomOut}>
            <MinusIcon />
          </ToolbarIconButton>
          <span className="min-w-14 border-x border-stone-200 px-3 text-center text-xs font-semibold text-stone-700">
            {zoomPercent}%
          </span>
          <ToolbarIconButton label="Zoom in" onClick={onZoomIn}>
            <PlusIcon />
          </ToolbarIconButton>
        </div>
      ) : null}

      {viewMode === "top" ? (
        <div className="flex h-9 shrink-0 items-center gap-2">
          <ToolbarPillButton label="Fit view" onClick={onResetView}>
            <Maximize2Icon />
          </ToolbarPillButton>
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
        className="h-9 shrink-0 gap-1.5 rounded-lg px-3 text-xs font-semibold"
        size="sm"
        title="Save project"
        variant="outline"
        onClick={onSaveProject}
      >
        <SaveIcon className="size-4" />
        Spara
      </Button>

      <span className="hidden min-w-20 text-xs font-medium text-muted-foreground xl:inline">
        {saveStatus}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="More project actions"
            className="size-9 shrink-0 rounded-lg"
            size="icon-sm"
            variant="ghost"
          >
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Project actions</DropdownMenuLabel>
          <ProjectAction
            disabled={!canUndo}
            icon={Undo2Icon}
            label="Undo"
            title={canUndo ? "Undo" : "Nothing to undo"}
            onSelect={onUndo}
          />
          <ProjectAction
            disabled={!canRedo}
            icon={Redo2Icon}
            label="Redo"
            title={canRedo ? "Redo" : "Nothing to redo"}
            onSelect={onRedo}
          />
          <DropdownMenuItem
            className="h-9 gap-2"
            onSelect={() => extraTool.onClick?.()}
          >
            {extraTool.icon}
            {extraTool.label}
          </DropdownMenuItem>
          <DropdownMenuItem className="h-9 gap-2 sm:hidden" onSelect={onSaveProject}>
            <SaveIcon />
            Save
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

function ToolbarPillButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-label={label}
      className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-950"
      title={label}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
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
          ? "flex size-9 shrink-0 items-center justify-center rounded-lg bg-stone-950 text-white"
          : "flex size-9 shrink-0 items-center justify-center rounded-lg text-stone-700 hover:bg-stone-100 hover:text-stone-950"
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
    ? "h-7 rounded-md bg-stone-950 px-4 text-xs font-semibold text-white shadow-sm"
    : "h-7 rounded-md px-4 text-xs font-semibold text-stone-600 hover:bg-white/75 hover:text-stone-950"
}

function ProjectAction({
  disabled,
  icon: Icon,
  label,
  onSelect,
  title,
}: {
  disabled?: boolean
  icon: LucideIcon
  label: string
  onSelect?: () => void
  title?: string
}) {
  return (
    <DropdownMenuItem
      disabled={disabled}
      className="h-9 gap-2"
      title={title}
      onSelect={onSelect}
    >
      <Icon />
      {label}
    </DropdownMenuItem>
  )
}
