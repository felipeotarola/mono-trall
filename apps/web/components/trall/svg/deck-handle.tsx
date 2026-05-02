import type { PointerEvent as ReactPointerEvent } from "react"

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
      ? "fill-cyan-400/20 stroke-cyan-600/40"
      : "fill-orange-400/20 stroke-orange-500/35"
  const ringClassName =
    variant === "pool"
      ? "fill-background stroke-cyan-700 transition group-hover/handle:stroke-cyan-500 dark:stroke-cyan-300"
      : "fill-background stroke-orange-700 transition group-hover/handle:stroke-orange-500 dark:stroke-orange-300"
  const dotClassName =
    variant === "pool"
      ? "fill-cyan-700 transition group-hover/handle:fill-cyan-500 dark:fill-cyan-300"
      : "fill-orange-700 transition group-hover/handle:fill-orange-500 dark:fill-orange-300"
  const labelClassName =
    variant === "pool"
      ? "pointer-events-none fill-cyan-700 text-[16px] font-semibold dark:fill-cyan-300"
      : "pointer-events-none fill-orange-700 text-[16px] font-semibold dark:fill-orange-300"

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
