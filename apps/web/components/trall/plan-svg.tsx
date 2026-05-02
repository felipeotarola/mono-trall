"use client"

import type {
  Dispatch,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent,
  PointerEvent as ReactPointerEvent,
  SetStateAction,
} from "react"
import { useRef, useState } from "react"

import { AngleSnapGuide } from "@/components/trall/svg/angle-snap-guide"
import { DeckHandle } from "@/components/trall/svg/deck-handle"
import { DeletePointHint } from "@/components/trall/svg/delete-point-hint"
import { DimensionLine } from "@/components/trall/svg/dimension-line"
import { EdgeHoverLabel } from "@/components/trall/svg/edge-hover-label"
import { HouseLayer } from "@/components/trall/svg/house-layer"
import { ParallelHintLabel } from "@/components/trall/svg/parallel-hint-label"
import { SnapIndicator } from "@/components/trall/svg/snap-indicator"
import { useCanvasViewport } from "@/hooks/trall/use-canvas-viewport"
import { isInteractiveTarget } from "@/hooks/trall/use-canvas-viewport"
import { useDeckEditor } from "@/hooks/trall/use-deck-editor"
import {
  initialDeckPoints,
  initialPoolPoints,
  PIXELS_PER_METER,
} from "@/lib/trall/constants"
import { distance, lineAngle } from "@/lib/trall/geometry"
import { getHouseAttachEdge, getHouseDoors } from "@/lib/trall/house"
import { clientPointToSvgPoint } from "@/lib/trall/svg"
import type { SupportSegment } from "@/lib/trall/supports"
import type { EdgeConstraint, GeometryEdge } from "@/lib/trall/edge-model"
import type {
  ActiveTool,
  HouseModel,
  HouseDoor,
  HouseBounds,
  MeasurementLine,
  Point,
  ViewBox,
} from "@/lib/trall/types"
import { getPlanContentBounds, getPointBounds } from "@/lib/trall/view"

type MeasurementDrag =
  | {
      type: "create"
      id: string
    }
  | {
      type: "move" | "start" | "end"
      id: string
      pointerStart: Point
      lineStart: MeasurementLine
    }

export function PlanSvg({
  activeTool,
  activePointIndex,
  activePoolPointIndex = null,
  deckEdgeConstraints,
  deckPoints,
  house,
  houseBounds,
  measurements,
  poolEdgeConstraints,
  poolPoints = null,
  setActivePointIndex,
  setDeckEdgeConstraints,
  setDeckPoints,
  setActivePoolPointIndex = noopSetActivePointIndex,
  setHouse,
  setMeasurements,
  setPoolEdgeConstraints,
  setPoolPoints = noopSetPoolPoints,
  setViewBox,
  supportSegments,
  onResetView,
  viewBox,
}: {
  activeTool: ActiveTool
  activePointIndex: number | null
  activePoolPointIndex?: number | null
  deckEdgeConstraints: EdgeConstraint[]
  deckPoints: Point[]
  house: HouseModel
  houseBounds: HouseBounds
  measurements: MeasurementLine[]
  poolEdgeConstraints: EdgeConstraint[]
  poolPoints?: Point[] | null
  setActivePointIndex: (index: number | null) => void
  setDeckEdgeConstraints: Dispatch<SetStateAction<EdgeConstraint[]>>
  setDeckPoints: Dispatch<SetStateAction<Point[]>>
  setActivePoolPointIndex?: (index: number | null) => void
  setHouse: Dispatch<SetStateAction<HouseModel>>
  setMeasurements: Dispatch<SetStateAction<MeasurementLine[]>>
  setPoolEdgeConstraints: Dispatch<SetStateAction<EdgeConstraint[]>>
  setPoolPoints?: Dispatch<SetStateAction<Point[] | null>>
  setViewBox: Dispatch<SetStateAction<ViewBox>>
  supportSegments: SupportSegment[]
  onResetView: () => void
  viewBox: ViewBox
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<
    string | null
  >(null)
  const [editingMeasurement, setEditingMeasurement] = useState<{
    id: string
    value: string
  } | null>(null)
  const [measurementDrag, setMeasurementDrag] = useState<MeasurementDrag | null>(
    null
  )
  const [doorDrag, setDoorDrag] = useState<{
    doorId: string
    pointerStartX: number
    startOffsetM: number
  } | null>(null)
  const houseDoors = getHouseDoors(house)
  const pointBounds = getPointBounds(houseBounds)
  const contentBounds = getPlanContentBounds(
    houseBounds,
    deckPoints,
    poolPoints ?? []
  )
  const editor = useDeckEditor({
    activePointIndex,
    deckPoints,
    edgeConstraints: deckEdgeConstraints,
    edgePrefix: "deck",
    houseBounds,
    pointBounds,
    setActivePointIndex: (index) => {
      setActivePointIndex(index)
      if (index !== null) {
        setActivePoolPointIndex(null)
      }
    },
    setDeckPoints,
    setEdgeConstraints: setDeckEdgeConstraints,
    svgRef,
  })
  const poolEditor = useDeckEditor({
    activePointIndex: activePoolPointIndex,
    deckPoints: poolPoints ?? initialPoolPoints,
    edgeConstraints: poolEdgeConstraints,
    edgePrefix: "pool",
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
    setEdgeConstraints: setPoolEdgeConstraints,
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
    if (startMeasurementCreate(event)) {
      return
    }

    if (viewport.startPointer(event, canPan)) {
      return
    }
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (updateDoorDrag(event)) {
      return
    }

    if (updateMeasurementDrag(event)) {
      return
    }

    if (viewport.movePointer(event)) {
      return
    }

    if (editor.handlePointerMove(event)) {
      return
    }

    poolEditor.handlePointerMove(event)
  }

  function handlePointerEnd(event: ReactPointerEvent<SVGSVGElement>) {
    if (finishDoorDrag(event)) {
      return
    }

    if (finishMeasurementDrag(event)) {
      return
    }

    if (viewport.stopPointer(event)) {
      return
    }

    editor.stopDragging(event)
    poolEditor.stopDragging(event)
  }

  function startDoorDrag(
    event: ReactPointerEvent<SVGRectElement>,
    door: HouseDoor
  ) {
    if (activeTool !== "select" || !svgRef.current) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    svgRef.current.focus()
    svgRef.current.setPointerCapture(event.pointerId)
    setActivePointIndex(null)
    setActivePoolPointIndex(null)
    setSelectedMeasurementId(null)
    setEditingMeasurement(null)
    setDoorDrag({
      doorId: door.id,
      pointerStartX: clientPointToSvgPoint(event, svgRef.current).x,
      startOffsetM: door.offsetM,
    })
  }

  function updateDoorDrag(event: ReactPointerEvent<SVGSVGElement>) {
    if (!doorDrag || !svgRef.current) {
      return false
    }

    event.preventDefault()
    const point = clientPointToSvgPoint(event, svgRef.current)
    const deltaM = (point.x - doorDrag.pointerStartX) / PIXELS_PER_METER
    const doorWidthM = Math.min(80, houseBounds.widthPx * 0.22) / PIXELS_PER_METER
    const maxOffsetM = Math.max(0, house.widthM / 2 - doorWidthM / 2)
    const nextOffsetM = clamp(
      doorDrag.startOffsetM + deltaM,
      -maxOffsetM,
      maxOffsetM
    )

    setHouse((currentHouse) => ({
      ...currentHouse,
      doorOffsetM:
        doorDrag.doorId === "door-1"
          ? nextOffsetM
          : (currentHouse.doorOffsetM ?? 0),
      doors: getHouseDoors(currentHouse).map((door) =>
        door.id === doorDrag.doorId
          ? { ...door, offsetM: nextOffsetM }
          : door
      ),
    }))

    return true
  }

  function finishDoorDrag(event: ReactPointerEvent<SVGSVGElement>) {
    if (!doorDrag) {
      return false
    }

    if (svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId)
    }

    setDoorDrag(null)
    return true
  }

  function startMeasurementCreate(event: ReactPointerEvent<SVGSVGElement>) {
    if (
      activeTool !== "measure" ||
      !svgRef.current ||
      isInteractiveTarget(event.target)
    ) {
      return false
    }

    event.preventDefault()
    svgRef.current.focus()
    svgRef.current.setPointerCapture(event.pointerId)
    const point = clientPointToSvgPoint(event, svgRef.current)
    const id = `measurement-${Date.now()}`
    setMeasurements((current) => [...current, { id, start: point, end: point }])
    setSelectedMeasurementId(id)
    setEditingMeasurement(null)
    setMeasurementDrag({ type: "create", id })
    return true
  }

  function updateMeasurementDrag(event: ReactPointerEvent<SVGSVGElement>) {
    if (!measurementDrag || !svgRef.current) {
      return false
    }

    event.preventDefault()
    const point = clientPointToSvgPoint(event, svgRef.current)
    setMeasurements((current) =>
      current.map((line) => {
        if (line.id !== measurementDrag.id) {
          return line
        }

        if (measurementDrag.type === "create") {
          return { ...line, end: point }
        }

        if (measurementDrag.type === "start") {
          return { ...line, start: point }
        }

        if (measurementDrag.type === "end") {
          return { ...line, end: point }
        }

        const delta = {
          x: point.x - measurementDrag.pointerStart.x,
          y: point.y - measurementDrag.pointerStart.y,
        }

        return {
          ...line,
          start: {
            x: measurementDrag.lineStart.start.x + delta.x,
            y: measurementDrag.lineStart.start.y + delta.y,
          },
          end: {
            x: measurementDrag.lineStart.end.x + delta.x,
            y: measurementDrag.lineStart.end.y + delta.y,
          },
        }
      })
    )
    return true
  }

  function finishMeasurementDrag(event: ReactPointerEvent<SVGSVGElement>) {
    if (!measurementDrag) {
      return false
    }

    if (svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId)
    }

    const drag = measurementDrag
    setMeasurementDrag(null)
    if (drag.type === "create") {
      setMeasurements((current) =>
        current.filter(
          (line) =>
            line.id !== drag.id || distance(line.start, line.end) >= 8
        )
      )
    }

    return true
  }

  function startMeasurementDrag(
    event: PointerEvent<SVGElement>,
    line: MeasurementLine,
    type: MeasurementDrag["type"]
  ) {
    if (type === "create" || !svgRef.current) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    svgRef.current.focus()
    svgRef.current.setPointerCapture(event.pointerId)
    setSelectedMeasurementId(line.id)
    setEditingMeasurement(null)
    setMeasurementDrag({
      type,
      id: line.id,
      pointerStart: clientPointToSvgPoint(event, svgRef.current),
      lineStart: line,
    })
  }

  function commitMeasurementLength() {
    if (!editingMeasurement) {
      return
    }

    const newLengthMeters = Number.parseFloat(
      editingMeasurement.value.replace(",", ".")
    )

    if (!Number.isFinite(newLengthMeters) || newLengthMeters <= 0) {
      setEditingMeasurement(null)
      return
    }

    setMeasurements((current) =>
      current.map((line) =>
        line.id === editingMeasurement.id
          ? setMeasurementLength(line, newLengthMeters)
          : line
      )
    )
    setEditingMeasurement(null)
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
        doors={houseDoors}
        editingDimension={editor.editingDimension}
        houseBounds={houseBounds}
        onCancelEdit={dimensions.cancelEditingDimension}
        onCommitEdit={dimensions.commitEditingDimension}
        onDoorPointerDown={startDoorDrag}
        onEditValueChange={dimensions.updateEditingDimension}
      />
      <DeckLayer
        activeTool={activeTool}
        activePointIndex={activePointIndex}
        activePoolPointIndex={activePoolPointIndex}
        deckPoints={deckPoints}
        editor={editor}
        houseBounds={houseBounds}
        poolEditor={poolEditor}
        poolPoints={poolPoints}
        supportSegments={supportSegments}
      />
      <MeasurementLayer
        editingMeasurement={editingMeasurement}
        measurements={measurements}
        selectedMeasurementId={selectedMeasurementId}
        onCommitMeasurementLength={commitMeasurementLength}
        onEditMeasurementValueChange={(value) =>
          setEditingMeasurement((current) =>
            current ? { ...current, value } : current
          )
        }
        onSelectMeasurement={(id) => {
          setSelectedMeasurementId(id)
          setActivePointIndex(null)
          setActivePoolPointIndex(null)
        }}
        onStartEdit={(line) =>
          setEditingMeasurement({
            id: line.id,
            value: formatLengthInput(
              distance(line.start, line.end) / PIXELS_PER_METER
            ),
          })
        }
        onStartDrag={startMeasurementDrag}
      />
    </svg>
  )
}

function DeckLayer({
  activeTool,
  activePointIndex,
  activePoolPointIndex,
  deckPoints,
  editor,
  houseBounds,
  poolEditor,
  poolPoints,
  supportSegments,
}: {
  activeTool: ActiveTool
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
  const selectedEdgeIndex = editor.selectedEdgeIndex ?? activePointIndex ?? 0
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
  const houseAttachEdge = getHouseAttachEdge(houseBounds)
  const selectedEdgeAttached = editor.attachedEdgeIndexes.has(selectedEdgeIndex)
  const dimensions = editor.dimensionEditing
  const center = getPointsCenter(deckPoints)
  const selectedEdge = editor.edges[selectedEdgeIndex]

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
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              editor.selectEdge(index)
            }}
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

      {editor.edges.map((edge) => {
        const labelPoint = getDimensionLabelPoint(edge.start, edge.end, center)

        return (
          <DimensionLine
            key={edge.id}
            edgeIndex={edge.index}
            x1={edge.start.x}
            y1={edge.start.y}
            x2={edge.end.x}
            y2={edge.end.y}
            valueMeters={edge.length}
            labelX={labelPoint.x}
            labelY={labelPoint.y}
            rotate={lineAngle(edge.start, edge.end)}
            editingDimension={editor.editingDimension}
            readonly={edge.locked}
            onCancelEdit={dimensions.cancelEditingDimension}
            onCommitEdit={dimensions.commitEditingDimension}
            onEditValueChange={dimensions.updateEditingDimension}
            onStartEdit={dimensions.startEditingDimension}
          />
        )
      })}

      {selectedEdge ? (
        <EdgeConstraintControls
          edge={selectedEdge}
          point={getDimensionLabelPoint(
            selectedEdge.start,
            selectedEdge.end,
            center
          )}
          onAddNode={dimensions.addNodeToSelectedEdge}
          onEdit={() =>
            dimensions.startEditingDimension(
              selectedEdge.index,
              selectedEdge.length
            )
          }
          onLink={dimensions.linkSelectedEdgeToOpposite}
          onLock={dimensions.toggleSelectedEdgeLock}
          onRemoveNode={dimensions.removeSelectedEdgeEndPoint}
          onUnlink={dimensions.unlinkSelectedEdge}
        />
      ) : null}

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
          canMovePlane={activeTool === "select"}
          editor={poolEditor}
          points={poolPoints}
        />
      ) : null}
    </>
  )
}

function PoolLayer({
  activePointIndex,
  canMovePlane,
  editor,
  points,
}: {
  activePointIndex: number | null
  canMovePlane: boolean
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
  const selectedEdge =
    editor.selectedEdgeIndex !== null ? editor.edges[editor.selectedEdgeIndex] : null

  return (
    <>
      <polygon
        points={polygonPoints}
        className={
          canMovePlane
            ? "cursor-grab fill-cyan-300/72 stroke-cyan-900 active:cursor-grabbing dark:fill-cyan-400/40 dark:stroke-cyan-200"
            : "fill-cyan-300/72 stroke-cyan-900 dark:fill-cyan-400/40 dark:stroke-cyan-200"
        }
        strokeLinejoin="round"
        strokeWidth="4"
        onPointerDown={
          canMovePlane ? editor.handleShapePointerDown : undefined
        }
      />
      <polygon
        points={polygonPoints}
        className="pointer-events-none fill-transparent stroke-cyan-50/60 dark:stroke-cyan-950/30"
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
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              editor.selectEdge(index)
            }}
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

      {editor.edges.map((edge) => {
        const labelPoint = getDimensionLabelPoint(edge.start, edge.end, center)

        return (
          <DimensionLine
            key={`pool-dimension-${edge.id}`}
            edgeIndex={edge.index}
            x1={edge.start.x}
            y1={edge.start.y}
            x2={edge.end.x}
            y2={edge.end.y}
            valueMeters={edge.length}
            labelX={labelPoint.x}
            labelY={labelPoint.y}
            rotate={lineAngle(edge.start, edge.end)}
            editingDimension={editor.editingDimension}
            readonly={edge.locked}
            onCancelEdit={dimensions.cancelEditingDimension}
            onCommitEdit={dimensions.commitEditingDimension}
            onEditValueChange={dimensions.updateEditingDimension}
            onStartEdit={dimensions.startEditingDimension}
          />
        )
      })}

      {selectedEdge ? (
        <EdgeConstraintControls
          edge={selectedEdge}
          point={getDimensionLabelPoint(
            selectedEdge.start,
            selectedEdge.end,
            center
          )}
          onAddNode={dimensions.addNodeToSelectedEdge}
          onEdit={() =>
            dimensions.startEditingDimension(
              selectedEdge.index,
              selectedEdge.length
            )
          }
          onLink={dimensions.linkSelectedEdgeToOpposite}
          onLock={dimensions.toggleSelectedEdgeLock}
          onRemoveNode={dimensions.removeSelectedEdgeEndPoint}
          onUnlink={dimensions.unlinkSelectedEdge}
        />
      ) : null}

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

function EdgeConstraintControls({
  edge,
  onAddNode,
  onEdit,
  onLink,
  onLock,
  onRemoveNode,
  onUnlink,
  point,
}: {
  edge: GeometryEdge
  onAddNode: () => void
  onEdit: () => void
  onLink: () => void
  onLock: () => void
  onRemoveNode: () => void
  onUnlink: () => void
  point: Point
}) {
  return (
    <foreignObject
      data-interactive="true"
      x={point.x - 168}
      y={point.y + 14}
      width="336"
      height="34"
    >
      <div className="flex h-8 items-center justify-center gap-1 rounded-md border bg-background/95 px-1 shadow-sm">
        <button
          className="h-6 rounded px-2 text-[11px] font-medium text-foreground hover:bg-muted"
          type="button"
          onClick={onEdit}
        >
          Edit
        </button>
        <button
          className="h-6 rounded px-2 text-[11px] font-medium text-foreground hover:bg-muted"
          type="button"
          onClick={onAddNode}
        >
          Add node
        </button>
        <button
          className="h-6 rounded px-2 text-[11px] font-medium text-foreground hover:bg-muted"
          type="button"
          onClick={onRemoveNode}
        >
          Remove node
        </button>
        <button
          className="h-6 rounded px-2 text-[11px] font-medium text-foreground hover:bg-muted"
          type="button"
          onClick={onLock}
        >
          {edge.locked ? "Unlock" : "Lock"}
        </button>
        {edge.linkedEdgeId ? (
          <button
            className="h-6 rounded px-2 text-[11px] font-medium text-foreground hover:bg-muted"
            type="button"
            onClick={onUnlink}
          >
            Unlink
          </button>
        ) : (
          <button
            className="h-6 rounded px-2 text-[11px] font-medium text-foreground hover:bg-muted"
            type="button"
            onClick={onLink}
          >
            Link opposite
          </button>
        )}
      </div>
    </foreignObject>
  )
}

function MeasurementLayer({
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
                  className="h-7 w-20 rounded-md border bg-background px-2 text-center text-sm font-semibold text-foreground shadow-sm outline-none ring-2 ring-fuchsia-500/40"
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
                className="cursor-text fill-fuchsia-700 text-[15px] font-semibold stroke-transparent dark:fill-fuchsia-300"
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

function formatLengthInput(value: number) {
  return Number.isInteger(value) ? String(value) : String(roundLength(value))
}

function formatDisplayMeters(value: number) {
  return `${formatLengthInput(value)} m`
}

function roundLength(value: number) {
  return Math.round((value + Number.EPSILON) * 1000) / 1000
}

function setMeasurementLength(
  line: MeasurementLine,
  lengthM: number
): MeasurementLine {
  const currentLength = distance(line.start, line.end)
  if (currentLength === 0) {
    return line
  }

  const newLengthPx = lengthM * PIXELS_PER_METER
  return {
    ...line,
    end: {
      x:
        line.start.x +
        ((line.end.x - line.start.x) / currentLength) * newLengthPx,
      y:
        line.start.y +
        ((line.end.y - line.start.y) / currentLength) * newLengthPx,
    },
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
