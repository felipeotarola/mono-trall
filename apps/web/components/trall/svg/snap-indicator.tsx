import type { Point, SnapType } from "@/lib/trall/types"

export function SnapIndicator({ point, type }: { point: Point; type: SnapType }) {
  if (type === "none" || type === "angle") {
    return null
  }

  return (
    <g className="pointer-events-none">
      <rect
        x={point.x + 18}
        y={point.y - 58}
        width={type === "house" ? 178 : 166}
        height="30"
        rx="7"
        className="fill-background/95 stroke-border"
      />
      <text
        x={point.x + 31}
        y={point.y - 38}
        className={
          type === "house"
            ? "fill-sky-700 text-[14px] font-medium dark:fill-sky-300"
            : "fill-muted-foreground text-[14px] font-medium"
        }
      >
        {type === "house"
          ? "Snapped to house wall"
          : "Snapped to 0.5 m grid"}
      </text>
    </g>
  )
}
