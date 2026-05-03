"use client"

import type { ReactNode } from "react"
import {
  BlindsIcon,
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
  onAddPool,
  onSelectFeatureTool,
  onSelectTool,
  placementMode,
}: {
  activeTool: ActiveTool
  className?: string
  onAddPool: () => void
  onSelectFeatureTool: (featureType: FeaturePlacementType) => void
  onSelectTool: (tool: ActiveTool) => void
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
        "min-w-0 border-stone-200 bg-white/92 shadow-sm backdrop-blur",
        className
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Planner tools</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <ToolSection label="Edit">{plannerTools}</ToolSection>
        <ToolSection label="Features">{featureTools}</ToolSection>
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
  label,
}: {
  children: ToolAction[]
  label: string
}) {
  return (
    <section className="grid gap-1.5">
      <p className="px-1 text-[10px] font-semibold tracking-[0.14em] text-stone-500 uppercase">
        {label}
      </p>
      <div className="grid grid-flow-col auto-cols-[minmax(8.5rem,1fr)] gap-1.5 overflow-x-auto pb-1 xl:grid-flow-row xl:grid-cols-1 xl:overflow-visible xl:pb-0">
        {children.map((tool) => (
          <ToolButton key={tool.label} {...tool} />
        ))}
      </div>
    </section>
  )
}

function ToolButton({ active, icon, label, onClick }: ToolAction) {
  return (
    <Button
      aria-pressed={active}
      className={cn(
        "h-10 justify-start gap-2 px-3 text-left text-sm",
        active && "border-stone-900 bg-stone-950 text-white hover:bg-stone-900"
      )}
      size="lg"
      title={label}
      variant={active ? "default" : "ghost"}
      onClick={onClick}
    >
      {icon}
      <span className="truncate">{label}</span>
    </Button>
  )
}
