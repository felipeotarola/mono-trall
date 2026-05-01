import { degreesToRadians, distance } from "@/lib/trall/geometry"
import type { Point } from "@/lib/trall/types"

export function AngleSnapGuide({
  anchor,
  angle,
  point,
}: {
  anchor: Point
  angle: number
  point: Point
}) {
  const guideLength = Math.max(distance(anchor, point) + 140, 260)
  const angleRad = degreesToRadians(angle)
  const guideEnd = {
    x: anchor.x + Math.cos(angleRad) * guideLength,
    y: anchor.y + Math.sin(angleRad) * guideLength,
  }

  return (
    <g className="pointer-events-none">
      <line
        x1={anchor.x}
        y1={anchor.y}
        x2={guideEnd.x}
        y2={guideEnd.y}
        className="stroke-sky-500"
        strokeDasharray="10 8"
        strokeLinecap="round"
        strokeWidth="3"
        opacity="0.65"
      />
      <rect
        x={point.x + 18}
        y={point.y + 18}
        width="48"
        height="28"
        rx="7"
        className="fill-background/95 stroke-sky-500/40"
      />
      <text
        x={point.x + 31}
        y={point.y + 37}
        className="fill-sky-700 text-[14px] font-semibold dark:fill-sky-300"
      >
        {Math.round(angle)}°
      </text>
    </g>
  )
}
