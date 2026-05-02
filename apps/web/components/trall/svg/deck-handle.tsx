import type { PointerEvent as ReactPointerEvent } from "react"

import { trallPlanClasses } from "@/lib/trall/visual-style"

export function DeckHandle({
  x,
  y,
  label,
  selected,
  dragging,
  snappedToHouse,
  variant = "deck",
  onPointerDown,
}: {
  x: number
  y: number
  label: string
  selected?: boolean
  dragging?: boolean
  snappedToHouse?: boolean
  variant?: "deck" | "pool"
  onPointerDown: (event: ReactPointerEvent<SVGGElement>) => void
}) {
  const selectedClassName =
    variant === "pool"
      ? "fill-[#9fd3e5]/22 stroke-[#2f6f86]/45"
      : "fill-[#c7a36f]/24 stroke-[#8a6a3d]/45"
  const ringClassName =
    variant === "pool"
      ? "fill-white stroke-[#2f6f86] transition group-hover/handle:stroke-[#1b5264]"
      : "fill-white stroke-[#8a6a3d] transition group-hover/handle:stroke-[#7b5b31]"
  const dotClassName =
    variant === "pool"
      ? "fill-[#2f6f86] transition group-hover/handle:fill-[#1b5264]"
      : "fill-[#8a6a3d] transition group-hover/handle:fill-[#7b5b31]"
  const labelClassName =
    variant === "pool"
      ? `pointer-events-none text-[16px] font-semibold ${trallPlanClasses.poolLabel}`
      : "pointer-events-none fill-[#7b5b31] text-[16px] font-semibold"

  return (
    <g
      className="group/handle cursor-grab touch-none active:cursor-grabbing"
      data-interactive="true"
      data-point-index={label}
      onPointerDown={onPointerDown}
    >
      <circle cx={x} cy={y} r="28" className="fill-transparent" />
      {selected ? (
        <circle
          cx={x}
          cy={y}
          r={dragging ? "28" : "24"}
          className={
            snappedToHouse
              ? "fill-sky-400/18 stroke-sky-500/55"
              : selectedClassName
          }
          strokeWidth="3"
        />
      ) : null}
      {snappedToHouse ? (
        <circle
          cx={x}
          cy={y}
          r="34"
          className="fill-transparent stroke-sky-500/30"
          strokeWidth="3"
        />
      ) : null}
      <circle
        cx={x}
        cy={y}
        r={dragging ? "17" : "14"}
        className={ringClassName}
        strokeWidth="5"
      />
      <circle cx={x} cy={y} r="5" className={dotClassName} />
      <text
        x={x + 22}
        y={y - 13}
        className={
          selected
            ? labelClassName
            : "pointer-events-none fill-muted-foreground text-[15px] font-medium"
        }
      >
        {label}
      </text>
    </g>
  )
}
