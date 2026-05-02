"use client"

import type {
  Dispatch,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
  SetStateAction,
} from "react"
import { useMemo, useRef, useState } from "react"

import {
  initialDeckPoints,
  PARALLEL_HINT_THRESHOLD_DEG,
  PIXELS_PER_METER,
  SNAP_THRESHOLD_PX,
} from "@/lib/trall/constants"
import {
  clamp,
  closestSnapAngle,
  degreesToRadians,
  distance,
  edgeAngle,
  isEdgeAttached,
  isNearlyParallel,
  radiansToDegrees,
} from "@/lib/trall/geometry"
import { getHouseAttachEdge } from "@/lib/trall/house"
import { applySnap } from "@/lib/trall/snap"
import { clientPointToSvgPoint } from "@/lib/trall/svg"
import type {
  AttachedEdge,
  EditableDimension,
  HouseBounds,
  Point,
  PointBounds,
  SnapType,
} from "@/lib/trall/types"

export function useDeckEditor({
  activePointIndex,
  deckPoints,
  houseBounds,
  pointBounds,
  setActivePointIndex,
  setDeckPoints,
  svgRef,
}: {
  activePointIndex: number | null
  deckPoints: Point[]
  houseBounds: HouseBounds
  pointBounds: PointBounds
  setActivePointIndex: (index: number | null) => void
  setDeckPoints: Dispatch<SetStateAction<Point[]>>
  svgRef: RefObject<SVGSVGElement | null>
}) {
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
  const [hoveredEdgeIndex, setHoveredEdgeIndex] = useState<number | null>(null)
  const [editingDimension, setEditingDimension] =
    useState<EditableDimension | null>(null)
  const cancelDimensionEditRef = useRef(false)
  const houseAttachEdge = getHouseAttachEdge(houseBounds)

  const attachedEdges = useMemo(
    (): AttachedEdge[] =>
      deckPoints.map((point, edgeIndex) => {
        const nextPoint = deckPoints[(edgeIndex + 1) % deckPoints.length]

        return {
          edgeIndex,
          attached: nextPoint
            ? isEdgeAttached(point, nextPoint, houseAttachEdge.y)
            : false,
        }
      }),
    [deckPoints, houseAttachEdge.y]
  )

  const attachedEdgeIndexes = useMemo(
    () =>
      new Set(
        attachedEdges
          .filter((edge) => edge.attached)
          .map((edge) => edge.edgeIndex)
      ),
    [attachedEdges]
  )

  const attachedEdgeForActivePoint =
    dragStart !== null
      ? attachedEdges.find((edge) => {
          if (!edge.attached) {
            return false
          }

          const nextIndex = (edge.edgeIndex + 1) % deckPoints.length
          return (
            edge.edgeIndex === dragStart.pointIndex ||
            nextIndex === dragStart.pointIndex
          )
        })
      : null

  function resetTransientState() {
    setSnapState({ pointIndex: null, type: "none", point: null })
    setAngleSnapState({ active: false, angle: null, anchor: null, point: null })
    setParallelHint({ active: false, start: null, end: null })
  }

  function handlePointPointerDown(
    event: ReactPointerEvent<SVGGElement>,
    index: number
  ) {
    event.preventDefault()
    event.stopPropagation()
    setEditingDimension(null)
    svgRef.current?.focus()
    if (svgRef.current) {
      const captured = setPointerCaptureIfPossible(
        svgRef.current,
        event.pointerId
      )
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
    const snapped = applySnap(point, houseBounds, pointBounds, {
      disableGrid: event.altKey,
    })
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
    resetTransientState()
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (!dragStart || !svgRef.current) {
      return false
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

    const snapped = applySnap(point, houseBounds, pointBounds, {
      disableGrid: event.altKey,
      preferredSnapType: angleSnapType,
    })
    const shouldKeepAttached =
      Boolean(attachedEdgeForActivePoint) &&
      Math.abs(point.y - houseAttachEdge.y) <= SNAP_THRESHOLD_PX
    const snappedPoint = shouldKeepAttached
      ? { ...snapped.point, y: houseAttachEdge.y }
      : snapped.point
    const referenceEdgeStart = deckPoints[0]
    const referenceEdgeEnd = deckPoints[1]
    const activeEdgeStart =
      deckPoints[
        (dragStart.pointIndex - 1 + deckPoints.length) % deckPoints.length
      ]
    const activeEdgeEnd = snappedPoint
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
        index === dragStart.pointIndex ? snappedPoint : currentPoint
      )
    )
    setSnapState({
      pointIndex: dragStart.pointIndex,
      type: shouldKeepAttached ? "house" : snapped.snapType,
      point: snappedPoint,
    })
    setAngleSnapState(
      angleGuide.active
        ? { ...angleGuide, point: snappedPoint }
        : { active: false, angle: null, anchor: null, point: null }
    )
    setParallelHint({
      active: showParallelHint,
      start: activeEdgeStart ?? null,
      end: showParallelHint ? snappedPoint : null,
    })

    return true
  }

  function stopDragging(event: ReactPointerEvent<SVGSVGElement>) {
    if (svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId)
    }
    setDragStart(null)
    resetTransientState()
  }

  function startEditingDimension(edgeIndex: number, valueMeters: number) {
    cancelDimensionEditRef.current = false
    setEditingDimension({
      edgeIndex,
      value: valueMeters.toFixed(1),
    })
    setHoveredEdgeIndex(null)
    setDragStart(null)
    resetTransientState()
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
    const snapped = applySnap(newPoint, houseBounds, pointBounds)

    setDeckPoints((points) =>
      points.map((point, index) =>
        index === nextIndex ? snapped.point : point
      )
    )
    setActivePointIndex(nextIndex)
    setEditingDimension(null)
  }

  return {
    angleSnapState,
    attachedEdgeIndexes,
    attachedEdges,
    dragStart,
    editingDimension,
    handleEdgeDoubleClick,
    handlePointPointerDown,
    handlePointerMove,
    hoveredEdgeIndex,
    parallelHint,
    removeActivePoint,
    setHoveredEdgeIndex,
    snapState,
    stopDragging,
    dimensionEditing: {
      cancelEditingDimension,
      commitEditingDimension,
      startEditingDimension,
      updateEditingDimension,
    },
  }
}

function setPointerCaptureIfPossible(
  element: SVGSVGElement,
  pointerId: number
): boolean {
  try {
    element.setPointerCapture(pointerId)
    return true
  } catch {
    return false
  }
}
