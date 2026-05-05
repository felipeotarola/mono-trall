"use client"

import type { ReactNode } from "react"
import {
  BlindsIcon,
  BoxIcon,
  ChevronsLeftIcon,
  ConstructionIcon,
  FenceIcon,
  LightbulbIcon,
  MousePointer2Icon,
  PencilRulerIcon,
  RotateCwIcon,
  RulerIcon,
  SproutIcon,
  SquareIcon,
  TreePineIcon,
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
      icon: <MousePointer2Icon />,
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
      label: "Fence",
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
      label: "Tree",
      icon: <TreePineIcon />,
      active: placementMode === "siteTree",
      onClick: () => onSelectFeatureTool("siteTree"),
    },
    {
      label: "Bush",
      icon: <SproutIcon />,
      active: placementMode === "siteBush",
      onClick: () => onSelectFeatureTool("siteBush"),
    },
    {
      label: "Planter",
      icon: <BoxIcon />,
      active: placementMode === "sitePlanter",
      onClick: () => onSelectFeatureTool("sitePlanter"),
    },
    {
      label: "Outdoor light",
      icon: <LightbulbIcon />,
      active: placementMode === "siteLight",
      onClick: () => onSelectFeatureTool("siteLight"),
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
          ? "max-h-16 w-[calc(100vw-1rem)] overflow-hidden lg:max-h-[calc(100svh-15rem)] lg:w-14 lg:overflow-y-auto lg:rounded-2xl lg:border-stone-200 lg:bg-white/95 lg:p-1 lg:shadow-md lg:shadow-black/8"
          : "w-[min(17rem,calc(100vw-2rem))]",
        className
      )}
    >
      {!collapsed ? (
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm">Planner tools</CardTitle>
          {onToggleCollapsed ? (
            <Button
              aria-label="Collapse planner tools"
              className="size-7 shrink-0 bg-white/80"
              size="icon-sm"
              title="Collapse planner tools"
              variant="ghost"
              onClick={onToggleCollapsed}
            >
              <ChevronsLeftIcon />
            </Button>
          ) : null}
        </CardHeader>
      ) : null}
      <CardContent className={cn("grid gap-3", collapsed && "px-1.5 py-1.5 sm:px-2 sm:py-3")}>
        {collapsed ? (
          <div className="grid gap-1.5">
            <ToolSection collapsed label="Planner tools">
              {plannerTools}
            </ToolSection>
            <div className="mx-auto hidden h-px w-7 bg-stone-200 lg:block" />
            <ToolSection collapsed label="Features">
              {featureTools.slice(0, 6)}
            </ToolSection>
          </div>
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
            ? "grid-flow-col auto-cols-8 overflow-x-auto pr-8 sm:auto-cols-9 sm:grid-flow-row sm:grid-cols-1 sm:overflow-visible sm:pr-0 sm:pb-0"
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
          ? "h-12 w-full justify-center rounded-xl px-0 lg:h-10"
          : "justify-start px-3 text-left",
        active &&
          "border-stone-900 bg-stone-950 text-white shadow-sm hover:bg-stone-900"
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
