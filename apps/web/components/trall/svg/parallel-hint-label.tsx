import type { Point } from "@/lib/trall/types"

export function ParallelHintLabel({ point }: { point: Point }) {
  return (
    <g className="pointer-events-none">
      <rect
        x={point.x + 16}
        y={point.y - 46}
        width="142"
        height="28"
        rx="7"
        className="fill-background/95 stroke-violet-500/35"
      />
      <text
        x={point.x + 28}
        y={point.y - 27}
        className="fill-violet-700 text-[13px] font-medium dark:fill-violet-300"
      >
        Parallel to top edge
      </text>
    </g>
  )
}
