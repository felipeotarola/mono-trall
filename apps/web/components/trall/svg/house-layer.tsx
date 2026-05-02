import type { PointerEvent as ReactPointerEvent } from "react"

import { DimensionLine } from "@/components/trall/svg/dimension-line"
import { PIXELS_PER_METER } from "@/lib/trall/constants"
import type {
  EditableDimension,
  HouseBounds,
  HouseDoor,
} from "@/lib/trall/types"

export function HouseLayer({
  doors,
  editingDimension,
  houseBounds,
  onCancelEdit,
  onCommitEdit,
  onDoorPointerDown,
  onEditValueChange,
}: {
  doors: HouseDoor[]
  editingDimension: EditableDimension | null
  houseBounds: HouseBounds
  onCancelEdit: () => void
  onCommitEdit: () => void
  onDoorPointerDown: (
    event: ReactPointerEvent<SVGRectElement>,
    door: HouseDoor
  ) => void
  onEditValueChange: (value: string) => void
}) {
  const doorWidth = Math.min(80, houseBounds.widthPx * 0.22)
  const doorHeight = Math.min(98, houseBounds.depthPx * 0.4)
  const doorY = houseBounds.bottom - doorHeight
  const roofPeakY = houseBounds.top - Math.min(82, houseBounds.widthPx * 0.2)
  const leftWindowX1 = houseBounds.left + houseBounds.widthPx * 0.08
  const leftWindowX2 = houseBounds.left + houseBounds.widthPx * 0.24
  const rightWindowX1 = houseBounds.right - houseBounds.widthPx * 0.24
  const rightWindowX2 = houseBounds.right - houseBounds.widthPx * 0.08
  const upperWindowY = houseBounds.top + houseBounds.depthPx * 0.25
  const lowerWindowY = houseBounds.top + houseBounds.depthPx * 0.55

  return (
    <>
      <rect
        x={houseBounds.left}
        y={houseBounds.top}
        width={houseBounds.widthPx}
        height={houseBounds.depthPx}
        rx="6"
        className="fill-slate-100 stroke-slate-700 dark:fill-slate-900 dark:stroke-slate-300"
        strokeWidth="5"
      />
      <path
        d={`M${houseBounds.left} ${houseBounds.top} L${houseBounds.centerX} ${roofPeakY} L${houseBounds.right} ${houseBounds.top}`}
        className="fill-none stroke-slate-700 dark:stroke-slate-300"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
      {doors.map((door) => {
        const doorCenterX = clamp(
          houseBounds.centerX + door.offsetM * PIXELS_PER_METER,
          houseBounds.left + doorWidth / 2,
          houseBounds.right - doorWidth / 2
        )
        const doorX = doorCenterX - doorWidth / 2

        return (
          <rect
            key={door.id}
            data-interactive="true"
            x={doorX}
            y={doorY}
            width={doorWidth}
            height={doorHeight}
            className="cursor-ew-resize fill-background stroke-slate-500 dark:stroke-slate-400"
            strokeWidth="3"
            onPointerDown={(event) => onDoorPointerDown(event, door)}
          />
        )
      })}
      <path
        d={`M${leftWindowX1} ${upperWindowY} H${leftWindowX2} M${rightWindowX1} ${upperWindowY} H${rightWindowX2} M${leftWindowX1} ${lowerWindowY} H${leftWindowX2} M${rightWindowX1} ${lowerWindowY} H${rightWindowX2}`}
        className="stroke-slate-400 dark:stroke-slate-500"
        strokeLinecap="round"
        strokeWidth="5"
      />
      <text
        x={houseBounds.centerX}
        y={houseBounds.top + houseBounds.depthPx * 0.46}
        textAnchor="middle"
        className="fill-slate-700 text-[22px] font-medium dark:fill-slate-200"
      >
        House
      </text>
      <DimensionLine
        edgeIndex={-1}
        x1={houseBounds.left}
        y1={houseBounds.bottom + 20}
        x2={houseBounds.right}
        y2={houseBounds.bottom + 20}
        valueMeters={houseBounds.widthPx / PIXELS_PER_METER}
        labelX={houseBounds.centerX}
        labelY={houseBounds.bottom + 50}
        rotate={0}
        editingDimension={editingDimension}
        onCancelEdit={onCancelEdit}
        onCommitEdit={onCommitEdit}
        onEditValueChange={onEditValueChange}
        onStartEdit={() => undefined}
        readonly
      />
      <DimensionLine
        edgeIndex={-2}
        x1={houseBounds.right + 20}
        y1={houseBounds.top}
        x2={houseBounds.right + 20}
        y2={houseBounds.bottom}
        valueMeters={houseBounds.depthPx / PIXELS_PER_METER}
        labelX={houseBounds.right + 54}
        labelY={houseBounds.top + houseBounds.depthPx / 2}
        rotate={90}
        editingDimension={editingDimension}
        onCancelEdit={onCancelEdit}
        onCommitEdit={onCommitEdit}
        onEditValueChange={onEditValueChange}
        onStartEdit={() => undefined}
        readonly
      />
    </>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
