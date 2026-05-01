import type { Point } from "@/lib/trall/types"

export function DeletePointHint({ point }: { point: Point }) {
  return (
    <g className="pointer-events-none">
      <rect
        x={point.x + 18}
        y={point.y + 24}
        width="220"
        height="30"
        rx="7"
        className="fill-background/95 stroke-border"
      />
      <text
        x={point.x + 30}
        y={point.y + 44}
        className="fill-muted-foreground text-[13px] font-medium"
      >
        Delete / Backspace removes selected point
      </text>
    </g>
  )
}
