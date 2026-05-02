import type { ReactNode } from "react"
import {
  FilePlusIcon,
  HandIcon,
  Maximize2Icon,
  MinusIcon,
  PencilRulerIcon,
  PlusIcon,
  PointerIcon,
  RulerIcon,
  SaveIcon,
  Undo2Icon,
  WavesIcon,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import type { ActiveTool, PlannerView, Tool } from "@/lib/trall/types"

export function CanvasToolbar({
  activeTool,
  extraTool,
  onAddPool,
  onNewProject,
  onSaveProject,
  onZoomIn,
  onZoomOut,
  onResetView,
  saveStatus,
  setActiveTool,
  setPlannerView,
  plannerView,
  zoomPercent,
}: {
  activeTool: ActiveTool
  extraTool: Tool
  onAddPool: () => void
  onNewProject: () => void
  onSaveProject: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
  saveStatus: string
  setActiveTool: (tool: ActiveTool) => void
  setPlannerView: (view: PlannerView) => void
  plannerView: PlannerView
  zoomPercent: number
}) {
  const tools: Tool[][] = [
    [
      {
        label: "Select",
        icon: <PointerIcon />,
        active: activeTool === "select",
        onClick: () => setActiveTool("select"),
      },
      {
        label: "Draw deck",
        icon: <PencilRulerIcon />,
        active: activeTool === "draw",
        onClick: () => setActiveTool("draw"),
      },
      {
        label: "Add pool",
        icon: <WavesIcon />,
        onClick: onAddPool,
      },
      {
        label: "Measure",
        icon: <RulerIcon />,
        active: activeTool === "measure",
        onClick: () => setActiveTool("measure"),
      },
      {
        label: "Pan",
        icon: <HandIcon />,
        active: activeTool === "pan",
        onClick: () => setActiveTool("pan"),
      },
    ],
    [
      { label: "New project", icon: <FilePlusIcon />, onClick: onNewProject },
      { label: "Save", icon: <SaveIcon />, onClick: onSaveProject },
    ],
    [{ label: "Undo", icon: <Undo2Icon /> }],
    [
      { label: "Zoom out", icon: <MinusIcon />, onClick: onZoomOut },
      { label: "Zoom in", icon: <PlusIcon />, onClick: onZoomIn },
      { label: "Reset view", icon: <Maximize2Icon />, onClick: onResetView },
    ],
    [extraTool],
  ]

  return (
    <div className="absolute top-3 right-3 left-3 z-20 flex items-center gap-2 overflow-x-auto rounded-lg border bg-background/90 p-1.5 shadow-sm backdrop-blur">
      <ToggleGroup
        aria-label="Planner view"
        className="shrink-0"
        size="sm"
        type="single"
        value={plannerView}
        variant="outline"
        onValueChange={(value) => {
          if (value === "top" || value === "side") {
            setPlannerView(value)
          }
        }}
      >
        <ToggleGroupItem value="top">Top view</ToggleGroupItem>
        <ToggleGroupItem value="side">Side view</ToggleGroupItem>
      </ToggleGroup>
      {tools.map((group, groupIndex) => (
        <ToolbarGroup key={groupIndex} separated={groupIndex > 0}>
          {group.map((tool) => (
            <ToolButton key={tool.label} {...tool} />
          ))}
          {groupIndex === 1 ? (
            <ToolbarStatus>{saveStatus}</ToolbarStatus>
          ) : null}
          {groupIndex === 3 ? (
            <ToolbarStatus minWidthClassName="min-w-14">
              {zoomPercent}%
            </ToolbarStatus>
          ) : null}
        </ToolbarGroup>
      ))}
    </div>
  )
}

function ToolbarGroup({
  children,
  separated,
}: {
  children: ReactNode
  separated: boolean
}) {
  return (
    <div className="flex items-center gap-1">
      {separated ? (
        <Separator orientation="vertical" className="mx-1 h-6" />
      ) : null}
      {children}
    </div>
  )
}

function ToolbarStatus({
  children,
  minWidthClassName = "min-w-24",
}: {
  children: ReactNode
  minWidthClassName?: string
}) {
  return (
    <div
      className={`flex h-8 ${minWidthClassName} items-center justify-center rounded-md px-2 text-xs font-medium text-muted-foreground`}
    >
      {children}
    </div>
  )
}

function ToolButton({ label, icon, active, onClick }: Tool) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="sm"
      className="h-8 min-w-fit gap-1.5 px-2"
      aria-pressed={active}
      title={label}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </Button>
  )
}
