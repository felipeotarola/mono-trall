import type { EditableDimension } from "@/lib/trall/types"
import { formatMeters } from "@/lib/trall/format"

export function DimensionLine({
  edgeIndex,
  x1,
  y1,
  x2,
  y2,
  valueMeters,
  labelX,
  labelY,
  editingDimension,
  onCancelEdit,
  onCommitEdit,
  onEditValueChange,
  onStartEdit,
  readonly = false,
  rotate = 0,
}: {
  edgeIndex: number
  x1: number
  y1: number
  x2: number
  y2: number
  valueMeters: number
  labelX: number
  labelY: number
  editingDimension: EditableDimension | null
  onCancelEdit: () => void
  onCommitEdit: () => void
  onEditValueChange: (value: string) => void
  onStartEdit: (edgeIndex: number, valueMeters: number) => void
  readonly?: boolean
  rotate?: number
}) {
  const isEditing = !readonly && editingDimension?.edgeIndex === edgeIndex

  return (
    <g
      data-interactive="true"
      className={
        isEditing
          ? "stroke-sky-700 text-[17px] font-semibold dark:stroke-sky-300"
          : editingDimension
            ? "stroke-sky-700/45 text-[17px] font-semibold opacity-55 dark:stroke-sky-300/45"
            : "stroke-sky-700 text-[17px] font-semibold dark:stroke-sky-300"
      }
    >
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="3" />
      <circle cx={x1} cy={y1} r="4" className="fill-sky-700 dark:fill-sky-300" />
      <circle cx={x2} cy={y2} r="4" className="fill-sky-700 dark:fill-sky-300" />
      {isEditing ? (
        <foreignObject
          data-interactive="true"
          x={labelX - 42}
          y={labelY - 20}
          width="84"
          height="34"
          transform={`rotate(${rotate} ${labelX} ${labelY})`}
        >
          <input
            autoFocus
            data-interactive="true"
            className="h-7 w-20 rounded-md border bg-background px-2 text-center text-sm font-semibold text-foreground shadow-sm outline-none ring-2 ring-sky-500/40"
            inputMode="decimal"
            value={editingDimension.value}
            onBlur={onCommitEdit}
            onChange={(event) => onEditValueChange(event.target.value)}
            onFocus={(event) => event.currentTarget.select()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                onCommitEdit()
              }
              if (event.key === "Escape") {
                event.preventDefault()
                onCancelEdit()
              }
            }}
          />
        </foreignObject>
      ) : (
        <text
          data-interactive="true"
          x={labelX}
          y={labelY}
          textAnchor="middle"
          transform={`rotate(${rotate} ${labelX} ${labelY})`}
          className={
            readonly
              ? "fill-slate-600 stroke-transparent text-[15px] dark:fill-slate-300"
              : "cursor-text fill-sky-700 stroke-transparent dark:fill-sky-300"
          }
          onClick={(event) => {
            if (readonly) {
              return
            }
            event.preventDefault()
            event.stopPropagation()
            onStartEdit(edgeIndex, valueMeters)
          }}
        >
          {formatMeters(valueMeters)}
        </text>
      )}
    </g>
  )
}
