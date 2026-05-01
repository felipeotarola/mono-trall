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
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import type { ActiveTool, Tool } from "@/lib/trall/types"

export function CanvasToolbar({
  activeTool,
  extraTool,
  onNewProject,
  onSaveProject,
  onZoomIn,
  onZoomOut,
  onResetView,
  saveStatus,
  setActiveTool,
  zoomPercent,
}: {
  activeTool: ActiveTool
  extraTool: Tool
  onNewProject: () => void
  onSaveProject: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
  saveStatus: string
  setActiveTool: (tool: ActiveTool) => void
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
    <div className="absolute left-3 right-3 top-3 z-20 flex items-center gap-2 overflow-x-auto rounded-lg border bg-background/90 p-1.5 shadow-sm backdrop-blur">
      {tools.map((group, groupIndex) => (
        <div key={groupIndex} className="flex items-center gap-1">
          {groupIndex > 0 ? (
            <Separator orientation="vertical" className="mx-1 h-6" />
          ) : null}
          {group.map((tool) => (
            <ToolButton key={tool.label} {...tool} />
          ))}
          {groupIndex === 1 ? (
            <div className="flex h-8 min-w-24 items-center justify-center rounded-md px-2 text-xs font-medium text-muted-foreground">
              {saveStatus}
            </div>
          ) : null}
          {groupIndex === 3 ? (
            <div className="flex h-8 min-w-14 items-center justify-center rounded-md px-2 text-xs font-medium text-muted-foreground">
              {zoomPercent}%
            </div>
          ) : null}
        </div>
      ))}
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
