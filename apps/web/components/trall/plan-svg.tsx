"use client"

import type {
  Dispatch,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  SetStateAction,
} from "react"
import { useRef } from "react"

import { AngleSnapGuide } from "@/components/trall/svg/angle-snap-guide"
import { DeckHandle } from "@/components/trall/svg/deck-handle"
import { DeletePointHint } from "@/components/trall/svg/delete-point-hint"
import { DimensionLine } from "@/components/trall/svg/dimension-line"
import { EdgeHoverLabel } from "@/components/trall/svg/edge-hover-label"
import { HouseLayer } from "@/components/trall/svg/house-layer"
import { ParallelHintLabel } from "@/components/trall/svg/parallel-hint-label"
import { SnapIndicator } from "@/components/trall/svg/snap-indicator"
import { useCanvasViewport } from "@/hooks/trall/use-canvas-viewport"
import { useDeckEditor } from "@/hooks/trall/use-deck-editor"
import {
  initialDeckPoints,
  initialPoolPoints,
  PIXELS_PER_METER,
} from "@/lib/trall/constants"
import { distance, lineAngle } from "@/lib/trall/geometry"
import { getHouseAttachEdge } from "@/lib/trall/house"
import type { SupportSegment } from "@/lib/trall/supports"
import type { ActiveTool, HouseBounds, Point, ViewBox } from "@/lib/trall/types"
import { getPlanContentBounds, getPointBounds } from "@/lib/trall/view"

export function PlanSvg({
  activeTool,
  activePointIndex,
  activePoolPointIndex = null,
  deckPoints,
  houseBounds,
  poolPoints = null,
  setActivePointIndex,
  setDeckPoints,
  setActivePoolPointIndex = noopSetActivePointIndex,
  setPoolPoints = noopSetPoolPoints,
  setViewBox,
  supportSegments,
  onResetView,
  viewBox,
}: {
  activeTool: ActiveTool
  activePointIndex: number | null
  activePoolPointIndex?: number | null
  deckPoints: Point[]
  houseBounds: HouseBounds
  poolPoints?: Point[] | null
  setActivePointIndex: (index: number | null) => void
  setDeckPoints: Dispatch<SetStateAction<Point[]>>
  setActivePoolPointIndex?: (index: number | null) => void
  setPoolPoints?: Dispatch<SetStateAction<Point[] | null>>
  setViewBox: Dispatch<SetStateAction<ViewBox>>
  supportSegments: SupportSegment[]
  onResetView: () => void
  viewBox: ViewBox
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const pointBounds = getPointBounds(houseBounds)
  const contentBounds = getPlanContentBounds(
    houseBounds,
    deckPoints,
    poolPoints ?? []
  )
  const editor = useDeckEditor({
    activePointIndex,
    deckPoints,
    houseBounds,
    pointBounds,
    setActivePointIndex: (index) => {
      setActivePointIndex(index)
      if (index !== null) {
        setActivePoolPointIndex(null)
      }
    },
    setDeckPoints,
    svgRef,
  })
  const poolEditor = useDeckEditor({
    activePointIndex: activePoolPointIndex,
    deckPoints: poolPoints ?? initialPoolPoints,
    houseBounds,
    pointBounds,
    setActivePointIndex: (index) => {
      setActivePoolPointIndex(index)
      if (index !== null) {
        setActivePointIndex(null)
      }
    },
    setDeckPoints: (nextPoints) => {
      setPoolPoints((currentPoints) => {
        const sourcePoints = currentPoints ?? initialPoolPoints
        return typeof nextPoints === "function"
          ? nextPoints(sourcePoints)
          : nextPoints
      })
    },
    snapToHouse: false,
    svgRef,
  })
  const viewport = useCanvasViewport({
    contentBounds,
    onResetView,
    setViewBox,
    svgRef,
    viewBox,
  })
  const canPan = activeTool === "pan" || viewport.spacePressed
  const svgCursorClass = viewport.panActive
    ? "cursor-grabbing"
    : canPan
      ? "cursor-grab"
      : ""
  const dimensions = editor.dimensionEditing

  function handleKeyDown(event: ReactKeyboardEvent<SVGSVGElement>) {
    if (!editor.editingDimension && viewport.handleKeyDown(event)) {
      return
    }

    if (editor.editingDimension) {
      return
    }

    if (event.key !== "Backspace" && event.key !== "Delete") {
      return
    }

    if (activePoolPointIndex !== null) {
      if (!poolPoints || poolPoints.length <= 3) {
        return
      }

      event.preventDefault()
      poolEditor.removeActivePoint()
      return
    }

    if (activePointIndex === null || deckPoints.length <= 3) {
      return
    }

    event.preventDefault()
    editor.removeActivePoint()
  }

  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (viewport.startPointer(event, canPan)) {
      return
    }
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (viewport.movePointer(event)) {
      return
    }

    if (editor.handlePointerMove(event)) {
      return
    }

    poolEditor.handlePointerMove(event)
  }

  function handlePointerEnd(event: ReactPointerEvent<SVGSVGElement>) {
    if (viewport.stopPointer(event)) {
      return
    }

    editor.stopDragging(event)
    poolEditor.stopDragging(event)
  }

  return (
    <svg
      ref={svgRef}
      tabIndex={0}
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      className={`h-full w-full touch-none drop-shadow-sm outline-none select-none ${svgCursorClass}`}
      onKeyDown={handleKeyDown}
      onPointerCancel={handlePointerEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      role="img"
      aria-label="Deck plan with house outline, deck polygon, dimensions, and draggable corner handles"
    >
      <defs>
        <clipPath id="deck-clip">
          <polygon points={getPolygonPoints(deckPoints)} />
        </clipPath>
        <pattern
          id="deck-board-lines"
          width="26"
          height="26"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(8)"
        >
          <path
            d="M 0 0 L 0 26"
            className="stroke-amber-950/18 dark:stroke-amber-100/18"
            strokeWidth="3"
          />
        </pattern>
      </defs>

      <HouseLayer
        editingDimension={editor.editingDimension}
        houseBounds={houseBounds}
        onCancelEdit={dimensions.cancelEditingDimension}
        onCommitEdit={dimensions.commitEditingDimension}
        onEditValueChange={dimensions.updateEditingDimension}
      />
      <DeckLayer
        activePointIndex={activePointIndex}
        activePoolPointIndex={activePoolPointIndex}
        deckPoints={deckPoints}
        editor={editor}
        houseBounds={houseBounds}
        poolEditor={poolEditor}
        poolPoints={poolPoints}
        supportSegments={supportSegments}
      />
    </svg>
  )
}

function DeckLayer({
  activePointIndex,
  activePoolPointIndex,
  deckPoints,
  editor,
  houseBounds,
  poolEditor,
  poolPoints,
  supportSegments,
}: {
  activePointIndex: number | null
  activePoolPointIndex: number | null
  deckPoints: Point[]
  editor: ReturnType<typeof useDeckEditor>
  houseBounds: HouseBounds
  poolEditor: ReturnType<typeof useDeckEditor>
  poolPoints: Point[] | null
  supportSegments: SupportSegment[]
}) {
  const polygonPoints = getPolygonPoints(deckPoints)
  const p1 = deckPoints[0] ?? initialDeckPoints[0]
  const p2 = deckPoints[1] ?? initialDeckPoints[1]
  const p3 = deckPoints[2] ?? initialDeckPoints[2]
  const previousPoint =
    deckPoints[deckPoints.length - 2] ?? initialDeckPoints[2]
  const lastPoint = deckPoints[deckPoints.length - 1] ?? initialDeckPoints[3]
  const selectedEdgeIndex = activePointIndex ?? 0
  const selectedEdgeStart = deckPoints[selectedEdgeIndex] ?? p1
  const selectedEdgeEnd =
    deckPoints[(selectedEdgeIndex + 1) % deckPoints.length] ?? p2
  const hoveredEdgeStart =
    editor.hoveredEdgeIndex !== null
      ? deckPoints[editor.hoveredEdgeIndex]
      : null
  const hoveredEdgeEnd =
    editor.hoveredEdgeIndex !== null
      ? deckPoints[(editor.hoveredEdgeIndex + 1) % deckPoints.length]
      : null
  const hoveredEdgeLabelPoint =
    hoveredEdgeStart && hoveredEdgeEnd
      ? {
          x: (hoveredEdgeStart.x + hoveredEdgeEnd.x) / 2,
          y: (hoveredEdgeStart.y + hoveredEdgeEnd.y) / 2,
        }
      : null
  const activePoint =
    activePointIndex !== null ? deckPoints[activePointIndex] : null
  const bottomEdgeIndex = Math.max(deckPoints.length - 2, 0)
  const houseAttachEdge = getHouseAttachEdge(houseBounds)
  const selectedEdgeAttached = editor.attachedEdgeIndexes.has(selectedEdgeIndex)
  const dimensions = editor.dimensionEditing

  return (
    <>
      {editor.snapState.type === "house" ? (
        <line
          x1={houseAttachEdge.x1}
          y1={houseAttachEdge.y}
          x2={houseAttachEdge.x2}
          y2={houseAttachEdge.y}
          className="stroke-sky-500"
          strokeLinecap="round"
          strokeWidth="8"
          opacity="0.5"
        />
      ) : null}

      <polygon
        points={polygonPoints}
        className="fill-amber-300/42 stroke-amber-800 dark:fill-amber-400/24 dark:stroke-amber-300"
        strokeLinejoin="round"
        strokeWidth="5"
      />
      <polygon
        points={polygonPoints}
        fill="url(#deck-board-lines)"
        className="stroke-transparent"
      />
      <g clipPath="url(#deck-clip)">
        <path
          d="M120 396 H980 M120 438 H980 M120 482 H980 M120 526 H980 M120 570 H980 M120 614 H980 M120 658 H980 M120 702 H980"
          className="stroke-amber-900/20 dark:stroke-amber-100/20"
          strokeWidth="3"
        />
      </g>
      <g clipPath="url(#deck-clip)" className="pointer-events-none">
        {supportSegments.map((segment, index) => (
          <line
            key={`support-segment-${index}`}
            x1={segment.x1}
            y1={segment.y1}
            x2={segment.x2}
            y2={segment.y2}
            className="stroke-emerald-700/65 dark:stroke-emerald-300/70"
            strokeDasharray="7 5"
            strokeLinecap="round"
            strokeWidth="4"
          />
        ))}
      </g>

      {editor.attachedEdges.map((edge) => {
        if (!edge.attached) {
          return null
        }

        const start = deckPoints[edge.edgeIndex]
        const end = deckPoints[(edge.edgeIndex + 1) % deckPoints.length]
        if (!start || !end) {
          return null
        }

        const labelPoint = {
          x: (start.x + end.x) / 2,
          y: houseAttachEdge.y - 18,
        }

        return (
          <g
            key={`attached-edge-${edge.edgeIndex}`}
            className="pointer-events-none"
          >
            <line
              x1={start.x}
              y1={houseAttachEdge.y}
              x2={end.x}
              y2={houseAttachEdge.y}
              className="stroke-stone-800 dark:stroke-stone-100"
              strokeLinecap="round"
              strokeWidth="8"
              opacity="0.82"
            />
            <rect
              x={labelPoint.x - 38}
              y={labelPoint.y - 21}
              width="76"
              height="24"
              rx="6"
              className="fill-background/90 stroke-border"
            />
            <text
              x={labelPoint.x}
              y={labelPoint.y - 5}
              textAnchor="middle"
              className="fill-muted-foreground text-[12px] font-semibold"
            >
              Attached
            </text>
          </g>
        )
      })}

      <path
        d={`M${selectedEdgeStart.x} ${selectedEdgeStart.y} L${selectedEdgeEnd.x} ${selectedEdgeEnd.y}`}
        className={
          selectedEdgeAttached
            ? "stroke-stone-700 dark:stroke-stone-200"
            : "stroke-orange-500"
        }
        strokeLinecap="round"
        strokeWidth={selectedEdgeAttached ? "11" : "9"}
      />
      <path
        d={`M${selectedEdgeStart.x} ${selectedEdgeStart.y} L${selectedEdgeEnd.x} ${selectedEdgeEnd.y}`}
        className={
          selectedEdgeAttached
            ? "stroke-amber-700 dark:stroke-amber-200"
            : "stroke-orange-950 dark:stroke-orange-100"
        }
        strokeLinecap="round"
        strokeWidth="3"
      />

      {editor.parallelHint.active &&
      p1 &&
      p2 &&
      editor.parallelHint.start &&
      editor.parallelHint.end ? (
        <g className="pointer-events-none">
          <line
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            className="stroke-violet-500"
            strokeLinecap="round"
            strokeWidth="7"
            opacity="0.32"
          />
          <line
            x1={editor.parallelHint.start.x}
            y1={editor.parallelHint.start.y}
            x2={editor.parallelHint.end.x}
            y2={editor.parallelHint.end.y}
            className="stroke-violet-500"
            strokeLinecap="round"
            strokeWidth="7"
            opacity="0.45"
          />
          <ParallelHintLabel
            point={{
              x: (editor.parallelHint.start.x + editor.parallelHint.end.x) / 2,
              y: (editor.parallelHint.start.y + editor.parallelHint.end.y) / 2,
            }}
          />
        </g>
      ) : null}

      {editor.angleSnapState.active &&
      editor.angleSnapState.anchor &&
      editor.angleSnapState.point &&
      editor.angleSnapState.angle !== null ? (
        <AngleSnapGuide
          anchor={editor.angleSnapState.anchor}
          angle={editor.angleSnapState.angle}
          point={editor.angleSnapState.point}
        />
      ) : null}

      {hoveredEdgeStart && hoveredEdgeEnd ? (
        <line
          x1={hoveredEdgeStart.x}
          y1={hoveredEdgeStart.y}
          x2={hoveredEdgeEnd.x}
          y2={hoveredEdgeEnd.y}
          className="pointer-events-none stroke-sky-500"
          strokeLinecap="round"
          strokeWidth="6"
          opacity="0.7"
        />
      ) : null}

      {deckPoints.map((point, index) => {
        const nextPoint = deckPoints[(index + 1) % deckPoints.length]
        if (!nextPoint) {
          return null
        }

        return (
          <line
            key={`edge-hit-${index}`}
            x1={point.x}
            y1={point.y}
            x2={nextPoint.x}
            y2={nextPoint.y}
            data-edge-index={index}
            data-interactive="true"
            className="cursor-pointer stroke-transparent"
            strokeWidth="30"
            pointerEvents="stroke"
            onDoubleClick={(event) =>
              editor.handleEdgeDoubleClick(event, index)
            }
            onPointerEnter={() => editor.setHoveredEdgeIndex(index)}
            onPointerLeave={() =>
              editor.setHoveredEdgeIndex((currentIndex) =>
                currentIndex === index ? null : currentIndex
              )
            }
          />
        )
      })}

      {hoveredEdgeLabelPoint ? (
        <EdgeHoverLabel point={hoveredEdgeLabelPoint} />
      ) : null}

      <DimensionLine
        edgeIndex={0}
        x1={p1.x}
        y1={p1.y - 26}
        x2={p2.x}
        y2={p2.y - 26}
        valueMeters={distance(p1, p2) / PIXELS_PER_METER}
        labelX={(p1.x + p2.x) / 2}
        labelY={(p1.y + p2.y) / 2 - 44}
        rotate={lineAngle(p1, p2)}
        editingDimension={editor.editingDimension}
        onCancelEdit={dimensions.cancelEditingDimension}
        onCommitEdit={dimensions.commitEditingDimension}
        onEditValueChange={dimensions.updateEditingDimension}
        onStartEdit={dimensions.startEditingDimension}
      />
      <DimensionLine
        edgeIndex={1}
        x1={p2.x + 28}
        y1={p2.y}
        x2={p3.x + 28}
        y2={p3.y}
        valueMeters={distance(p2, p3) / PIXELS_PER_METER}
        labelX={(p2.x + p3.x) / 2 + 55}
        labelY={(p2.y + p3.y) / 2}
        rotate={lineAngle(p2, p3)}
        editingDimension={editor.editingDimension}
        onCancelEdit={dimensions.cancelEditingDimension}
        onCommitEdit={dimensions.commitEditingDimension}
        onEditValueChange={dimensions.updateEditingDimension}
        onStartEdit={dimensions.startEditingDimension}
      />
      <DimensionLine
        edgeIndex={bottomEdgeIndex}
        x1={lastPoint.x}
        y1={lastPoint.y + 28}
        x2={previousPoint.x}
        y2={previousPoint.y + 28}
        valueMeters={distance(lastPoint, previousPoint) / PIXELS_PER_METER}
        labelX={(lastPoint.x + previousPoint.x) / 2}
        labelY={(lastPoint.y + previousPoint.y) / 2 + 58}
        rotate={lineAngle(lastPoint, previousPoint)}
        editingDimension={editor.editingDimension}
        onCancelEdit={dimensions.cancelEditingDimension}
        onCommitEdit={dimensions.commitEditingDimension}
        onEditValueChange={dimensions.updateEditingDimension}
        onStartEdit={dimensions.startEditingDimension}
      />

      {deckPoints.map((point, index) => (
        <DeckHandle
          key={index}
          x={point.x}
          y={point.y}
          label={`P${index + 1}`}
          selected={index === activePointIndex}
          dragging={editor.dragStart?.pointIndex === index}
          snappedToHouse={
            editor.snapState.type === "house" &&
            editor.snapState.pointIndex === index
          }
          onPointerDown={(event) => editor.handlePointPointerDown(event, index)}
        />
      ))}

      {editor.snapState.point ? (
        <SnapIndicator
          point={editor.snapState.point}
          type={editor.snapState.type}
        />
      ) : null}
      {activePoint && deckPoints.length > 3 ? (
        <DeletePointHint point={activePoint} />
      ) : null}

      {poolPoints ? (
        <PoolLayer
          activePointIndex={activePoolPointIndex}
          editor={poolEditor}
          points={poolPoints}
        />
      ) : null}
    </>
  )
}

function PoolLayer({
  activePointIndex,
  editor,
  points,
}: {
  activePointIndex: number | null
  editor: ReturnType<typeof useDeckEditor>
  points: Point[]
}) {
  const polygonPoints = getPolygonPoints(points)
  const center = getPointsCenter(points)
  const activePoint =
    activePointIndex !== null ? points[activePointIndex] : null
  const hoveredEdgeStart =
    editor.hoveredEdgeIndex !== null ? points[editor.hoveredEdgeIndex] : null
  const hoveredEdgeEnd =
    editor.hoveredEdgeIndex !== null
      ? points[(editor.hoveredEdgeIndex + 1) % points.length]
      : null
  const hoveredEdgeLabelPoint =
    hoveredEdgeStart && hoveredEdgeEnd
      ? {
          x: (hoveredEdgeStart.x + hoveredEdgeEnd.x) / 2,
          y: (hoveredEdgeStart.y + hoveredEdgeEnd.y) / 2,
        }
      : null
  const dimensions = editor.dimensionEditing

  return (
    <>
      <polygon
        points={polygonPoints}
        className="cursor-grab fill-cyan-300/72 stroke-cyan-900 active:cursor-grabbing dark:fill-cyan-400/40 dark:stroke-cyan-200"
        strokeLinejoin="round"
        strokeWidth="4"
        onPointerDown={editor.handleShapePointerDown}
      />
      <polygon
        points={polygonPoints}
        className="fill-transparent stroke-cyan-50/60 dark:stroke-cyan-950/30"
        strokeDasharray="10 8"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <text
        x={center.x}
        y={center.y + 5}
        textAnchor="middle"
        className="pointer-events-none fill-cyan-950 text-[18px] font-semibold dark:fill-cyan-50"
      >
        Pool
      </text>

      {hoveredEdgeStart && hoveredEdgeEnd ? (
        <line
          x1={hoveredEdgeStart.x}
          y1={hoveredEdgeStart.y}
          x2={hoveredEdgeEnd.x}
          y2={hoveredEdgeEnd.y}
          className="pointer-events-none stroke-cyan-500"
          strokeLinecap="round"
          strokeWidth="6"
          opacity="0.75"
        />
      ) : null}

      {points.map((point, index) => {
        const nextPoint = points[(index + 1) % points.length]
        if (!nextPoint) {
          return null
        }

        return (
          <line
            key={`pool-edge-hit-${index}`}
            x1={point.x}
            y1={point.y}
            x2={nextPoint.x}
            y2={nextPoint.y}
            data-edge-index={index}
            data-interactive="true"
            className="cursor-pointer stroke-transparent"
            strokeWidth="26"
            pointerEvents="stroke"
            onDoubleClick={(event) =>
              editor.handleEdgeDoubleClick(event, index)
            }
            onPointerEnter={() => editor.setHoveredEdgeIndex(index)}
            onPointerLeave={() =>
              editor.setHoveredEdgeIndex((currentIndex) =>
                currentIndex === index ? null : currentIndex
              )
            }
          />
        )
      })}

      {hoveredEdgeLabelPoint ? (
        <EdgeHoverLabel point={hoveredEdgeLabelPoint} />
      ) : null}

      {points.map((point, index) => {
        const nextPoint = points[(index + 1) % points.length]
        if (!nextPoint) {
          return null
        }

        const labelPoint = getDimensionLabelPoint(point, nextPoint, center)

        return (
          <DimensionLine
            key={`pool-dimension-${index}`}
            edgeIndex={index}
            x1={point.x}
            y1={point.y}
            x2={nextPoint.x}
            y2={nextPoint.y}
            valueMeters={distance(point, nextPoint) / PIXELS_PER_METER}
            labelX={labelPoint.x}
            labelY={labelPoint.y}
            rotate={lineAngle(point, nextPoint)}
            editingDimension={editor.editingDimension}
            onCancelEdit={dimensions.cancelEditingDimension}
            onCommitEdit={dimensions.commitEditingDimension}
            onEditValueChange={dimensions.updateEditingDimension}
            onStartEdit={dimensions.startEditingDimension}
          />
        )
      })}

      {points.map((point, index) => (
        <DeckHandle
          key={`pool-point-${index}`}
          x={point.x}
          y={point.y}
          label={`W${index + 1}`}
          selected={index === activePointIndex}
          dragging={editor.dragStart?.pointIndex === index}
          variant="pool"
          onPointerDown={(event) => editor.handlePointPointerDown(event, index)}
        />
      ))}

      {editor.snapState.point ? (
        <SnapIndicator point={editor.snapState.point} type="grid" />
      ) : null}
      {activePoint && points.length > 3 ? (
        <DeletePointHint point={activePoint} />
      ) : null}
    </>
  )
}

function getPolygonPoints(points: Point[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(" ")
}

function getPointsCenter(points: Point[]): Point {
  const total = points.reduce(
    (sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }),
    { x: 0, y: 0 }
  )

  return {
    x: total.x / points.length,
    y: total.y / points.length,
  }
}

function getDimensionLabelPoint(start: Point, end: Point, center: Point): Point {
  const midPoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  }
  const dx = midPoint.x - center.x
  const dy = midPoint.y - center.y
  const length = Math.hypot(dx, dy) || 1

  return {
    x: midPoint.x + (dx / length) * 34,
    y: midPoint.y + (dy / length) * 34,
  }
}

function noopSetActivePointIndex() {}

function noopSetPoolPoints() {}
