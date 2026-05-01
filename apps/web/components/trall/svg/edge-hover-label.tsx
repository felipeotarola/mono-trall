import type { Point } from "@/lib/trall/types"

export function EdgeHoverLabel({ point }: { point: Point }) {
  return (
    <g className="pointer-events-none">
      <rect
        x={point.x + 16}
        y={point.y - 46}
        width="166"
        height="28"
        rx="7"
        className="fill-background/95 stroke-border"
      />
      <text
        x={point.x + 28}
        y={point.y - 27}
        className="fill-muted-foreground text-[13px] font-medium"
      >
        Double-click to add point
      </text>
    </g>
  )
}
