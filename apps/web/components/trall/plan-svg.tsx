"use client"

import type {
  Dispatch,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  SetStateAction,
} from "react"
import { useEffect, useRef, useState } from "react"

import { AngleSnapGuide } from "@/components/trall/svg/angle-snap-guide"
import { DeckHandle } from "@/components/trall/svg/deck-handle"
import { DeletePointHint } from "@/components/trall/svg/delete-point-hint"
import { DimensionLine } from "@/components/trall/svg/dimension-line"
import { EdgeHoverLabel } from "@/components/trall/svg/edge-hover-label"
import { ParallelHintLabel } from "@/components/trall/svg/parallel-hint-label"
import { SnapIndicator } from "@/components/trall/svg/snap-indicator"
import {
  initialDeckPoints,
  PAN_BOUNDS,
  PARALLEL_HINT_THRESHOLD_DEG,
  PIXELS_PER_METER,
} from "@/lib/trall/constants"
import {
  clamp,
  closestSnapAngle,
  degreesToRadians,
  distance,
  edgeAngle,
  isNearlyParallel,
  lineAngle,
  radiansToDegrees,
} from "@/lib/trall/geometry"
import { getHouseAttachEdge } from "@/lib/trall/house"
import { applySnap } from "@/lib/trall/snap"
import { clientPointToSvgPoint } from "@/lib/trall/svg"
import type {
  ActiveTool,
  EditableDimension,
  HouseBounds,
  Point,
  SnapType,
  ViewBox,
} from "@/lib/trall/types"

export function PlanSvg({
  activeTool,
  activePointIndex,
  deckPoints,
  houseBounds,
  setActivePointIndex,
  setDeckPoints,
  setViewBox,
  viewBox,
}: {
  activeTool: ActiveTool
  activePointIndex: number | null
  deckPoints: Point[]
  houseBounds: HouseBounds
  setActivePointIndex: (index: number | null) => void
  setDeckPoints: Dispatch<SetStateAction<Point[]>>
  setViewBox: Dispatch<SetStateAction<ViewBox>>
  viewBox: ViewBox
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [snapState, setSnapState] = useState<{
    pointIndex: number | null
    type: SnapType
    point: Point | null
  }>({ pointIndex: null, type: "none", point: null })
  const [angleSnapState, setAngleSnapState] = useState<{
    active: boolean
    angle: number | null
    anchor: Point | null
    point: Point | null
  }>({ active: false, angle: null, anchor: null, point: null })
  const [parallelHint, setParallelHint] = useState<{
    active: boolean
    start: Point | null
    end: Point | null
  }>({ active: false, start: null, end: null })
  const [dragStart, setDragStart] = useState<{
    pointIndex: number
    point: Point
  } | null>(null)
  const [panStart, setPanStart] = useState<{
    pointerId: number
    clientX: number
    clientY: number
    viewBox: ViewBox
  } | null>(null)
  const [spacePressed, setSpacePressed] = useState(false)
  const [hoveredEdgeIndex, setHoveredEdgeIndex] = useState<number | null>(null)
  const [editingDimension, setEditingDimension] =
    useState<EditableDimension | null>(null)
  const cancelDimensionEditRef = useRef(false)
  const polygonPoints = deckPoints.map((point) => `${point.x},${point.y}`).join(" ")
  const p1 = deckPoints[0] ?? initialDeckPoints[0]
  const p2 = deckPoints[1] ?? initialDeckPoints[1]
  const p3 = deckPoints[2] ?? initialDeckPoints[2]
  const previousPoint =
    deckPoints[deckPoints.length - 2] ?? initialDeckPoints[2]
  const lastPoint =
    deckPoints[deckPoints.length - 1] ?? initialDeckPoints[3]
  const selectedEdgeIndex = activePointIndex ?? 0
  const selectedEdgeStart = deckPoints[selectedEdgeIndex] ?? p1
  const selectedEdgeEnd =
    deckPoints[(selectedEdgeIndex + 1) % deckPoints.length] ?? p2
  const hoveredEdgeStart =
    hoveredEdgeIndex !== null ? deckPoints[hoveredEdgeIndex] : null
  const hoveredEdgeEnd =
    hoveredEdgeIndex !== null
      ? deckPoints[(hoveredEdgeIndex + 1) % deckPoints.length]
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
  const doorWidth = Math.min(80, houseBounds.widthPx * 0.22)
  const doorHeight = Math.min(98, houseBounds.depthPx * 0.4)
  const doorX = houseBounds.centerX - doorWidth / 2
  const doorY = houseBounds.bottom - doorHeight
  const roofPeakY = houseBounds.top - Math.min(82, houseBounds.widthPx * 0.2)
  const leftWindowX1 = houseBounds.left + houseBounds.widthPx * 0.08
  const leftWindowX2 = houseBounds.left + houseBounds.widthPx * 0.24
  const rightWindowX1 = houseBounds.right - houseBounds.widthPx * 0.24
  const rightWindowX2 = houseBounds.right - houseBounds.widthPx * 0.08
  const upperWindowY = houseBounds.top + houseBounds.depthPx * 0.25
  const lowerWindowY = houseBounds.top + houseBounds.depthPx * 0.55
  const canPan = activeTool === "pan" || spacePressed
  const svgCursorClass = panStart
    ? "cursor-grabbing"
    : canPan
      ? "cursor-grab"
      : ""

  useEffect(() => {
    function handleWindowKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space" || isTypingTarget(event.target)) {
        return
      }

      event.preventDefault()
      setSpacePressed(true)
    }

    function handleWindowKeyUp(event: KeyboardEvent) {
      if (event.code === "Space") {
        setSpacePressed(false)
      }
    }

    window.addEventListener("keydown", handleWindowKeyDown)
    window.addEventListener("keyup", handleWindowKeyUp)

    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown)
      window.removeEventListener("keyup", handleWindowKeyUp)
    }
  }, [])

  function handleCanvasPointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (!svgRef.current || !canPan || isInteractiveTarget(event.target)) {
      return
    }

    event.preventDefault()
    setEditingDimension(null)
    svgRef.current.focus()
    const captured = setPointerCaptureIfPossible(svgRef.current, event.pointerId)
    if (!captured && !event.isTrusted) {
      return
    }

    setPanStart({
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      viewBox,
    })
  }

  function handlePointerDown(
    event: ReactPointerEvent<SVGGElement>,
    index: number
  ) {
    event.preventDefault()
    event.stopPropagation()
    setEditingDimension(null)
    svgRef.current?.focus()
    if (svgRef.current) {
      const captured = setPointerCaptureIfPossible(svgRef.current, event.pointerId)
      if (!captured && !event.isTrusted) {
        return
      }
    }

    const point = deckPoints[index] ?? initialDeckPoints[0]
    setActivePointIndex(index)
    setHoveredEdgeIndex(null)
    setDragStart({ pointIndex: index, point })
    setSnapState({ pointIndex: index, type: "none", point: null })
    setAngleSnapState({ active: false, angle: null, anchor: null, point: null })
    setParallelHint({ active: false, start: null, end: null })
  }

  function insertPointAfterEdge(edgeIndex: number, point: Point) {
    const insertedIndex = edgeIndex + 1
    setDeckPoints((points) => [
      ...points.slice(0, insertedIndex),
      point,
      ...points.slice(insertedIndex),
    ])
    setActivePointIndex(insertedIndex)
    setHoveredEdgeIndex(null)
    setSnapState({ pointIndex: insertedIndex, type: "none", point: null })
  }

  function handleEdgeDoubleClick(
    event: ReactMouseEvent<SVGLineElement>,
    edgeIndex: number
  ) {
    if (!svgRef.current) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    setEditingDimension(null)
    svgRef.current.focus()

    const point = clientPointToSvgPoint(event, svgRef.current)
    const snapped = applySnap(point, houseBounds, { disableGrid: event.altKey })
    insertPointAfterEdge(edgeIndex, snapped.point)
  }

  function removeActivePoint() {
    if (activePointIndex === null || deckPoints.length <= 3) {
      return
    }

    setDeckPoints((points) =>
      points.filter((_, index) => index !== activePointIndex)
    )
    setActivePointIndex(null)
    setHoveredEdgeIndex(null)
    setDragStart(null)
    setSnapState({ pointIndex: null, type: "none", point: null })
    setAngleSnapState({ active: false, angle: null, anchor: null, point: null })
    setParallelHint({ active: false, start: null, end: null })
  }

  function handleKeyDown(event: ReactKeyboardEvent<SVGSVGElement>) {
    if (editingDimension) {
      return
    }

    if (event.key !== "Backspace" && event.key !== "Delete") {
      return
    }

    if (activePointIndex === null || deckPoints.length <= 3) {
      return
    }

    event.preventDefault()
    removeActivePoint()
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (panStart && svgRef.current) {
      const svg = svgRef.current
      const scaleX = panStart.viewBox.width / svg.clientWidth
      const scaleY = panStart.viewBox.height / svg.clientHeight
      const dxSvg = (event.clientX - panStart.clientX) * scaleX
      const dySvg = (event.clientY - panStart.clientY) * scaleY

      setViewBox({
        ...panStart.viewBox,
        x: clamp(panStart.viewBox.x - dxSvg, PAN_BOUNDS.minX, PAN_BOUNDS.maxX),
        y: clamp(panStart.viewBox.y - dySvg, PAN_BOUNDS.minY, PAN_BOUNDS.maxY),
      })
      return
    }

    if (!dragStart || !svgRef.current) {
      return
    }

    let point = clientPointToSvgPoint(event, svgRef.current)

    if (event.shiftKey) {
      const dx = point.x - dragStart.point.x
      const dy = point.y - dragStart.point.y
      point =
        Math.abs(dx) > Math.abs(dy)
          ? { ...point, y: dragStart.point.y }
          : { ...point, x: dragStart.point.x }
    }

    let angleSnapType: SnapType = "none"
    let angleGuide = {
      active: false,
      angle: null as number | null,
      anchor: null as Point | null,
      point: null as Point | null,
    }

    if (event.metaKey || event.ctrlKey) {
      const anchor =
        deckPoints[
          (dragStart.pointIndex - 1 + deckPoints.length) % deckPoints.length
        ]

      if (anchor) {
        const activeDistance = distance(anchor, point)
        const rawAngle = radiansToDegrees(
          Math.atan2(point.y - anchor.y, point.x - anchor.x)
        )
        const snapAngle = closestSnapAngle(rawAngle)

        if (activeDistance > 0 && snapAngle.snapped) {
          const snappedRad = degreesToRadians(snapAngle.angle)
          point = {
            x: anchor.x + Math.cos(snappedRad) * activeDistance,
            y: anchor.y + Math.sin(snappedRad) * activeDistance,
          }
          angleSnapType = "angle"
          angleGuide = {
            active: true,
            angle: snapAngle.angle,
            anchor,
            point,
          }
        }
      }
    }

    const snapped = applySnap(point, houseBounds, {
      disableGrid: event.altKey,
      preferredSnapType: angleSnapType,
    })
    const referenceEdgeStart = deckPoints[0]
    const referenceEdgeEnd = deckPoints[1]
    const activeEdgeStart =
      deckPoints[
        (dragStart.pointIndex - 1 + deckPoints.length) % deckPoints.length
      ]
    const activeEdgeEnd = snapped.point
    const showParallelHint =
      dragStart.pointIndex !== 1 &&
      Boolean(referenceEdgeStart && referenceEdgeEnd && activeEdgeStart) &&
      isNearlyParallel(
        edgeAngle(
          referenceEdgeStart ?? initialDeckPoints[0],
          referenceEdgeEnd ?? initialDeckPoints[1]
        ),
        edgeAngle(activeEdgeStart ?? initialDeckPoints[0], activeEdgeEnd),
        PARALLEL_HINT_THRESHOLD_DEG
      )

    setDeckPoints((currentPoints) =>
      currentPoints.map((currentPoint, index) =>
        index === dragStart.pointIndex ? snapped.point : currentPoint
      )
    )
    setSnapState({
      pointIndex: dragStart.pointIndex,
      type: snapped.snapType,
      point: snapped.point,
    })
    setAngleSnapState(
      angleGuide.active
        ? { ...angleGuide, point: snapped.point }
        : { active: false, angle: null, anchor: null, point: null }
    )
    setParallelHint({
      active: showParallelHint,
      start: activeEdgeStart ?? null,
      end: showParallelHint ? snapped.point : null,
    })
  }

  function stopDragging(event: ReactPointerEvent<SVGSVGElement>) {
    if (svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId)
    }
    if (panStart?.pointerId === event.pointerId) {
      setPanStart(null)
      return
    }
    setDragStart(null)
    setSnapState({ pointIndex: null, type: "none", point: null })
    setAngleSnapState({ active: false, angle: null, anchor: null, point: null })
    setParallelHint({ active: false, start: null, end: null })
  }

  function startEditingDimension(edgeIndex: number, valueMeters: number) {
    cancelDimensionEditRef.current = false
    setEditingDimension({
      edgeIndex,
      value: valueMeters.toFixed(1),
    })
    setHoveredEdgeIndex(null)
    setDragStart(null)
    setSnapState({ pointIndex: null, type: "none", point: null })
    setAngleSnapState({ active: false, angle: null, anchor: null, point: null })
    setParallelHint({ active: false, start: null, end: null })
  }

  function updateEditingDimension(value: string) {
    setEditingDimension((current) =>
      current ? { ...current, value } : current
    )
  }

  function cancelEditingDimension() {
    cancelDimensionEditRef.current = true
    setEditingDimension(null)
  }

  function commitEditingDimension() {
    if (cancelDimensionEditRef.current) {
      cancelDimensionEditRef.current = false
      return
    }

    if (!editingDimension) {
      return
    }

    const newLengthMeters = Number.parseFloat(
      editingDimension.value.replace(",", ".")
    )
    if (!Number.isFinite(newLengthMeters) || newLengthMeters <= 0) {
      setEditingDimension(null)
      return
    }

    const clampedMeters = clamp(newLengthMeters, 0.5, 100)
    const edgeIndex = editingDimension.edgeIndex
    const nextIndex = edgeIndex + 1
    const startPoint = deckPoints[edgeIndex]
    const endPoint = deckPoints[nextIndex]

    if (!startPoint || !endPoint) {
      setEditingDimension(null)
      return
    }

    const currentLength = distance(startPoint, endPoint)
    if (currentLength === 0) {
      setEditingDimension(null)
      return
    }

    const newLengthPx = clampedMeters * PIXELS_PER_METER
    const newPoint = {
      x:
        startPoint.x +
        ((endPoint.x - startPoint.x) / currentLength) * newLengthPx,
      y:
        startPoint.y +
        ((endPoint.y - startPoint.y) / currentLength) * newLengthPx,
    }
    const snapped = applySnap(newPoint, houseBounds)

    setDeckPoints((points) =>
      points.map((point, index) => (index === nextIndex ? snapped.point : point))
    )
    setActivePointIndex(nextIndex)
    setEditingDimension(null)
  }

  return (
    <svg
      ref={svgRef}
      tabIndex={0}
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      className={`h-full w-full touch-none select-none outline-none drop-shadow-sm ${svgCursorClass}`}
      onKeyDown={handleKeyDown}
      onPointerCancel={stopDragging}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      role="img"
      aria-label="Deck plan with house outline, deck polygon, dimensions, and draggable corner handles"
    >
      <defs>
        <clipPath id="deck-clip">
          <polygon points={polygonPoints} />
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
      <rect
        x={doorX}
        y={doorY}
        width={doorWidth}
        height={doorHeight}
        className="fill-background stroke-slate-500 dark:stroke-slate-400"
        strokeWidth="3"
      />
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
        onCancelEdit={cancelEditingDimension}
        onCommitEdit={commitEditingDimension}
        onEditValueChange={updateEditingDimension}
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
        onCancelEdit={cancelEditingDimension}
        onCommitEdit={commitEditingDimension}
        onEditValueChange={updateEditingDimension}
        onStartEdit={() => undefined}
        readonly
      />
      {snapState.type === "house" ? (
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
      <path
        d={`M${selectedEdgeStart.x} ${selectedEdgeStart.y} L${selectedEdgeEnd.x} ${selectedEdgeEnd.y}`}
        className="stroke-orange-500"
        strokeLinecap="round"
        strokeWidth="9"
      />
      <path
        d={`M${selectedEdgeStart.x} ${selectedEdgeStart.y} L${selectedEdgeEnd.x} ${selectedEdgeEnd.y}`}
        className="stroke-orange-950 dark:stroke-orange-100"
        strokeLinecap="round"
        strokeWidth="3"
      />
      {parallelHint.active && p1 && p2 && parallelHint.start && parallelHint.end ? (
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
            x1={parallelHint.start.x}
            y1={parallelHint.start.y}
            x2={parallelHint.end.x}
            y2={parallelHint.end.y}
            className="stroke-violet-500"
            strokeLinecap="round"
            strokeWidth="7"
            opacity="0.45"
          />
          <ParallelHintLabel
            point={{
              x: (parallelHint.start.x + parallelHint.end.x) / 2,
              y: (parallelHint.start.y + parallelHint.end.y) / 2,
            }}
          />
        </g>
      ) : null}
      {angleSnapState.active &&
      angleSnapState.anchor &&
      angleSnapState.point &&
      angleSnapState.angle !== null ? (
        <AngleSnapGuide
          anchor={angleSnapState.anchor}
          angle={angleSnapState.angle}
          point={angleSnapState.point}
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
            className="cursor-copy stroke-transparent"
            strokeWidth="30"
            pointerEvents="stroke"
            onDoubleClick={(event) => handleEdgeDoubleClick(event, index)}
            onPointerEnter={() => setHoveredEdgeIndex(index)}
            onPointerLeave={() =>
              setHoveredEdgeIndex((currentIndex) =>
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
        editingDimension={editingDimension}
        onCancelEdit={cancelEditingDimension}
        onCommitEdit={commitEditingDimension}
        onEditValueChange={updateEditingDimension}
        onStartEdit={startEditingDimension}
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
        editingDimension={editingDimension}
        onCancelEdit={cancelEditingDimension}
        onCommitEdit={commitEditingDimension}
        onEditValueChange={updateEditingDimension}
        onStartEdit={startEditingDimension}
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
        editingDimension={editingDimension}
        onCancelEdit={cancelEditingDimension}
        onCommitEdit={commitEditingDimension}
        onEditValueChange={updateEditingDimension}
        onStartEdit={startEditingDimension}
      />

      {deckPoints.map((point, index) => (
        <DeckHandle
          key={index}
          x={point.x}
          y={point.y}
          label={`P${index + 1}`}
          selected={index === activePointIndex}
          dragging={dragStart?.pointIndex === index}
          snappedToHouse={
            snapState.type === "house" && snapState.pointIndex === index
          }
          onPointerDown={(event) => handlePointerDown(event, index)}
        />
      ))}
      {snapState.point ? (
        <SnapIndicator point={snapState.point} type={snapState.type} />
      ) : null}
      {activePoint && deckPoints.length > 3 ? (
        <DeletePointHint point={activePoint} />
      ) : null}
    </svg>
  )
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    Boolean(target.closest("[data-interactive='true']"))
  )
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable)
  )
}

function setPointerCaptureIfPossible(
  element: SVGSVGElement,
  pointerId: number
): boolean {
  try {
    element.setPointerCapture(pointerId)
    return true
  } catch {
    // Synthetic pointer events used by tests may not have an active browser pointer.
    return false
  }
}
