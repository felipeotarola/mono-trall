import type { PointerEvent as ReactPointerEvent } from "react"

import { DimensionLine } from "@/components/trall/svg/dimension-line"
import { PIXELS_PER_METER } from "@/lib/trall/constants"
import { trallPlanClasses } from "@/lib/trall/visual-style"
import type {
  EditableDimension,
  HouseBounds,
  HouseDoor,
  HouseWindow,
} from "@/lib/trall/types"

export function HouseLayer({
  doors,
  editingDimension,
  houseBounds,
  onCancelEdit,
  onCommitEdit,
  onDoorPointerDown,
  onEditValueChange,
  onWindowPointerDown,
  windows,
}: {
  doors: HouseDoor[]
  editingDimension: EditableDimension | null
  houseBounds: HouseBounds
  onCancelEdit: () => void
  onCommitEdit: () => void
  onDoorPointerDown: (
    event: ReactPointerEvent<SVGElement>,
    door: HouseDoor
  ) => void
  onEditValueChange: (value: string) => void
  onWindowPointerDown: (
    event: ReactPointerEvent<SVGElement>,
    window: HouseWindow
  ) => void
  windows: HouseWindow[]
}) {
  const doorWidth = Math.min(80, houseBounds.widthPx * 0.22)
  const doorHeight = Math.min(98, houseBounds.depthPx * 0.4)
  const doorY = houseBounds.bottom - doorHeight
  const windowWidth = Math.min(70, houseBounds.widthPx * 0.16)
  const windowHeight = Math.min(34, houseBounds.depthPx * 0.16)
  const roofPeakY = houseBounds.top - Math.min(82, houseBounds.widthPx * 0.2)
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
        className={trallPlanClasses.houseBody}
        strokeWidth="5"
      />
      <path
        d={`M${houseBounds.left} ${houseBounds.top} L${houseBounds.centerX} ${roofPeakY} L${houseBounds.right} ${houseBounds.top}`}
        className={trallPlanClasses.houseRoof}
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
            className={`cursor-ew-resize ${trallPlanClasses.houseDoor}`}
            strokeWidth="3"
            onPointerDown={(event) => onDoorPointerDown(event, door)}
          />
        )
      })}
      {windows.map((window) => {
        const windowCenterX = clamp(
          houseBounds.centerX + window.offsetM * PIXELS_PER_METER,
          houseBounds.left + windowWidth / 2,
          houseBounds.right - windowWidth / 2
        )
        const windowY = window.row === "upper" ? upperWindowY : lowerWindowY
        const windowX = windowCenterX - windowWidth / 2
        const windowTop = windowY - windowHeight / 2

        return (
          <g
            key={window.id}
            data-interactive="true"
            className="group/window cursor-ew-resize"
            onPointerDown={(event) => onWindowPointerDown(event, window)}
          >
            <rect
              x={windowX}
              y={windowTop}
              width={windowWidth}
              height={windowHeight}
              rx="4"
              className={trallPlanClasses.houseWindow}
              strokeWidth="3"
            />
            <line
              x1={windowCenterX}
              x2={windowCenterX}
              y1={windowTop + 4}
              y2={windowTop + windowHeight - 4}
              className={`pointer-events-none ${trallPlanClasses.houseWindowLine}`}
              strokeWidth="2"
            />
            <line
              x1={windowX + 5}
              x2={windowX + windowWidth - 5}
              y1={windowY}
              y2={windowY}
              className={`pointer-events-none ${trallPlanClasses.houseWindowLine}`}
              strokeWidth="2"
            />
          </g>
        )
      })}
      <text
        x={houseBounds.centerX}
        y={houseBounds.top + houseBounds.depthPx * 0.46}
        textAnchor="middle"
        className={`${trallPlanClasses.houseLabel} text-[22px] font-medium`}
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
