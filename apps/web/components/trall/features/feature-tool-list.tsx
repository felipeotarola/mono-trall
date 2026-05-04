"use client"

import type { ReactNode } from "react"
import {
  BlindsIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ConstructionIcon,
  FenceIcon,
  HandIcon,
  PencilRulerIcon,
  PointerIcon,
  RotateCwIcon,
  RulerIcon,
  SquareIcon,
  WavesIcon,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import type { FeaturePlacementType } from "@/lib/trall/features"
import type { ActiveTool } from "@/lib/trall/types"

export function FeatureToolList({
  activeTool,
  className,
  collapsed = false,
  onAddPool,
  onSelectFeatureTool,
  onSelectTool,
  onToggleCollapsed,
  placementMode,
}: {
  activeTool: ActiveTool
  className?: string
  collapsed?: boolean
  onAddPool: () => void
  onSelectFeatureTool: (featureType: FeaturePlacementType) => void
  onSelectTool: (tool: ActiveTool) => void
  onToggleCollapsed?: () => void
  placementMode: FeaturePlacementType | null
}) {
  const plannerTools: ToolAction[] = [
    {
      label: "Select / Edit",
      icon: <PointerIcon />,
      active: !placementMode && activeTool === "select",
      onClick: () => onSelectTool("select"),
    },
    {
      label: "Draw deck",
      icon: <PencilRulerIcon />,
      active: !placementMode && activeTool === "draw",
      onClick: () => onSelectTool("draw"),
    },
    {
      label: "Measure",
      icon: <RulerIcon />,
      active: !placementMode && activeTool === "measure",
      onClick: () => onSelectTool("measure"),
    },
    {
      label: "Pan",
      icon: <HandIcon />,
      active: !placementMode && activeTool === "pan",
      onClick: () => onSelectTool("pan"),
    },
    {
      label: "Add pool",
      icon: <WavesIcon />,
      onClick: onAddPool,
    },
  ]
  const featureTools: ToolAction[] = [
    {
      label: "Stairs",
      icon: <ConstructionIcon />,
      active: placementMode === "stairs",
      onClick: () => onSelectFeatureTool("stairs"),
    },
    {
      label: "Railing",
      icon: <FenceIcon />,
      active: placementMode === "railing",
      onClick: () => onSelectFeatureTool("railing"),
    },
    {
      label: "Pergola",
      icon: <SquareIcon />,
      active: placementMode === "pergola",
      onClick: () => onSelectFeatureTool("pergola"),
    },
    {
      label: "Privacy screen",
      icon: <BlindsIcon />,
      active: placementMode === "privacyScreen",
      onClick: () => onSelectFeatureTool("privacyScreen"),
    },
    {
      label: "Board direction",
      icon: <RotateCwIcon />,
      active: placementMode === "boardDirection",
      onClick: () => onSelectFeatureTool("boardDirection"),
    },
  ]

  return (
    <Card
      size="sm"
      className={cn(
        "min-w-0 border-stone-200 bg-white/94 shadow-lg shadow-black/10 backdrop-blur transition-[width] duration-200",
        collapsed
          ? "w-[calc(100vw-2rem)] sm:w-[4.25rem]"
          : "w-[min(17rem,calc(100vw-2rem))]",
        className
      )}
    >
      <CardHeader
        className={cn(
          "flex flex-row items-center gap-2 pb-2",
          collapsed ? "justify-center px-2" : "justify-between"
        )}
      >
        <CardTitle className={cn("text-sm", collapsed && "sr-only")}>
          Planner tools
        </CardTitle>
        {onToggleCollapsed ? (
          <Button
            aria-label={collapsed ? "Expand planner tools" : "Collapse planner tools"}
            className="size-8 shrink-0"
            size="icon-sm"
            title={collapsed ? "Expand planner tools" : "Collapse planner tools"}
            variant="ghost"
            onClick={onToggleCollapsed}
          >
            {collapsed ? <ChevronsRightIcon /> : <ChevronsLeftIcon />}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className={cn("grid gap-3", collapsed && "px-2")}>
        {collapsed ? (
          <ToolSection collapsed label="Planner tools">
            {[...plannerTools, ...featureTools]}
          </ToolSection>
        ) : (
          <>
            <ToolSection collapsed={false} label="Edit">
              {plannerTools}
            </ToolSection>
            <ToolSection collapsed={false} label="Features">
              {featureTools}
            </ToolSection>
          </>
        )}
      </CardContent>
    </Card>
  )
}

type ToolAction = {
  active?: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}

function ToolSection({
  children,
  collapsed,
  label,
}: {
  children: ToolAction[]
  collapsed: boolean
  label: string
}) {
  return (
    <section className="grid gap-1.5">
      <p
        className={cn(
          "px-1 text-[10px] font-semibold tracking-[0.14em] text-stone-500 uppercase",
          collapsed && "sr-only"
        )}
      >
        {label}
      </p>
      <div
        className={cn(
          "grid gap-1.5",
          collapsed
            ? "grid-flow-col auto-cols-9 overflow-x-auto pb-1 sm:grid-flow-row sm:grid-cols-1 sm:overflow-visible sm:pb-0"
            : "grid-flow-col auto-cols-[minmax(8.5rem,1fr)] overflow-x-auto pb-1 md:grid-flow-row md:grid-cols-1 md:overflow-visible md:pb-0"
        )}
      >
        {children.map((tool) => (
          <ToolButton key={tool.label} collapsed={collapsed} {...tool} />
        ))}
      </div>
    </section>
  )
}

function ToolButton({
  active,
  collapsed,
  icon,
  label,
  onClick,
}: ToolAction & { collapsed: boolean }) {
  return (
    <Button
      aria-pressed={active}
      aria-label={label}
      className={cn(
        "h-10 gap-2 text-sm",
        collapsed
          ? "w-full justify-center px-0"
          : "justify-start px-3 text-left",
        active && "border-stone-900 bg-stone-950 text-white hover:bg-stone-900"
      )}
      size={collapsed ? "icon-lg" : "lg"}
      title={label}
      variant={active ? "default" : "ghost"}
      onClick={onClick}
    >
      {icon}
      <span className={cn("truncate", collapsed && "sr-only")}>{label}</span>
    </Button>
  )
}
