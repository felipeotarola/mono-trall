import type { PointerEvent } from "react"

import { PIXELS_PER_METER } from "@/lib/trall/constants"
import { distance } from "@/lib/trall/geometry"
import type { MeasurementLine } from "@/lib/trall/types"

import { formatDisplayMeters } from "./utils"

export function MeasurementLayer({
  editingMeasurement,
  measurements,
  onCommitMeasurementLength,
  onEditMeasurementValueChange,
  onSelectMeasurement,
  onStartDrag,
  onStartEdit,
  selectedMeasurementId,
}: {
  editingMeasurement: { id: string; value: string } | null
  measurements: MeasurementLine[]
  onCommitMeasurementLength: () => void
  onEditMeasurementValueChange: (value: string) => void
  onSelectMeasurement: (id: string) => void
  onStartDrag: (
    event: PointerEvent<SVGElement>,
    line: MeasurementLine,
    type: "move" | "start" | "end"
  ) => void
  onStartEdit: (line: MeasurementLine) => void
  selectedMeasurementId: string | null
}) {
  return (
    <g>
      {measurements.map((line) => {
        const selected = line.id === selectedMeasurementId
        const editing = editingMeasurement?.id === line.id
        const lengthM = distance(line.start, line.end) / PIXELS_PER_METER
        const labelPoint = {
          x: (line.start.x + line.end.x) / 2,
          y: (line.start.y + line.end.y) / 2 - 18,
        }

        return (
          <g key={line.id} data-interactive="true">
            <line
              x1={line.start.x}
              y1={line.start.y}
              x2={line.end.x}
              y2={line.end.y}
              className={
                selected
                  ? "stroke-fuchsia-600 dark:stroke-fuchsia-300"
                  : "stroke-fuchsia-500/70 dark:stroke-fuchsia-300/70"
              }
              strokeDasharray="8 6"
              strokeLinecap="round"
              strokeWidth={selected ? "4" : "3"}
            />
            <line
              x1={line.start.x}
              y1={line.start.y}
              x2={line.end.x}
              y2={line.end.y}
              className="cursor-grab stroke-transparent active:cursor-grabbing"
              pointerEvents="stroke"
              strokeWidth="28"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onSelectMeasurement(line.id)
              }}
              onPointerDown={(event) => onStartDrag(event, line, "move")}
            />
            {(["start", "end"] as const).map((key) => {
              const point = line[key]

              return (
                <circle
                  key={key}
                  cx={point.x}
                  cy={point.y}
                  r="8"
                  className="cursor-grab fill-background stroke-fuchsia-600 active:cursor-grabbing dark:stroke-fuchsia-300"
                  strokeWidth="3"
                  onPointerDown={(event) => onStartDrag(event, line, key)}
                />
              )
            })}
            {editing ? (
              <foreignObject
                data-interactive="true"
                x={labelPoint.x - 42}
                y={labelPoint.y - 18}
                width="84"
                height="34"
              >
                <input
                  autoFocus
                  data-interactive="true"
                  className="h-7 w-20 rounded-md border bg-background px-2 text-center text-sm font-semibold text-foreground shadow-sm ring-2 ring-fuchsia-500/40 outline-none"
                  inputMode="decimal"
                  value={editingMeasurement.value}
                  onBlur={onCommitMeasurementLength}
                  onChange={(event) =>
                    onEditMeasurementValueChange(event.target.value)
                  }
                  onFocus={(event) => event.currentTarget.select()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      onCommitMeasurementLength()
                    }
                  }}
                />
              </foreignObject>
            ) : (
              <text
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor="middle"
                className="cursor-text fill-fuchsia-700 stroke-transparent text-[15px] font-semibold dark:fill-fuchsia-300"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onSelectMeasurement(line.id)
                  onStartEdit(line)
                }}
              >
                {formatDisplayMeters(lengthM)}
              </text>
            )}
          </g>
        )
      })}
    </g>
  )
}
