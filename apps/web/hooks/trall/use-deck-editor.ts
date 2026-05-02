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
  GRID_SIZE_PX,
  initialDeckPoints,
  PARALLEL_HINT_THRESHOLD_DEG,
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
import {
  getOppositeEdgeId,
  getPolygonEdges,
  linkEdges,
  normalizeEdgeConstraints,
  setEdgeAndLinkedLengths,
  toggleEdgeLock,
  unlinkEdge,
  type EdgeConstraint,
} from "@/lib/trall/edge-model"
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
  edgeConstraints,
  edgePrefix,
  houseBounds,
  pointBounds,
  setActivePointIndex,
  setDeckPoints,
  setEdgeConstraints,
  snapToHouse = true,
  svgRef,
}: {
  activePointIndex: number | null
  deckPoints: Point[]
  edgeConstraints: EdgeConstraint[]
  edgePrefix: string
  houseBounds: HouseBounds
  pointBounds: PointBounds
  setActivePointIndex: (index: number | null) => void
  setDeckPoints: Dispatch<SetStateAction<Point[]>>
  setEdgeConstraints: Dispatch<SetStateAction<EdgeConstraint[]>>
  snapToHouse?: boolean
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
  const [shapeDragStart, setShapeDragStart] = useState<{
    point: Point
    points: Point[]
  } | null>(null)
  const [hoveredEdgeIndex, setHoveredEdgeIndex] = useState<number | null>(null)
  const [editingDimension, setEditingDimension] =
    useState<EditableDimension | null>(null)
  const [selectedEdgeIndex, setSelectedEdgeIndex] = useState<number | null>(
    null
  )
  const cancelDimensionEditRef = useRef(false)
  const houseAttachEdge = getHouseAttachEdge(houseBounds)
  const normalizedEdgeConstraints = useMemo(
    () =>
      normalizeEdgeConstraints({
        constraints: edgeConstraints,
        points: deckPoints,
        prefix: edgePrefix,
      }),
    [deckPoints, edgeConstraints, edgePrefix]
  )
  const edges = useMemo(
    () =>
      getPolygonEdges({
        constraints: normalizedEdgeConstraints,
        points: deckPoints,
        prefix: edgePrefix,
      }),
    [deckPoints, edgePrefix, normalizedEdgeConstraints]
  )

  const attachedEdges = useMemo(
    (): AttachedEdge[] =>
      snapToHouse
        ? deckPoints.map((point, edgeIndex) => {
            const nextPoint = deckPoints[(edgeIndex + 1) % deckPoints.length]

            return {
              edgeIndex,
              attached: nextPoint
                ? isEdgeAttached(point, nextPoint, houseAttachEdge.y)
                : false,
            }
          })
        : [],
    [deckPoints, houseAttachEdge.y, snapToHouse]
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
    setSelectedEdgeIndex(null)
    setDragStart({ pointIndex: index, point })
    setSnapState({ pointIndex: index, type: "none", point: null })
    setAngleSnapState({ active: false, angle: null, anchor: null, point: null })
    setParallelHint({ active: false, start: null, end: null })
  }

  function handleShapePointerDown(event: ReactPointerEvent<SVGPolygonElement>) {
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

    if (!svgRef.current) {
      return
    }

    setActivePointIndex(null)
    setHoveredEdgeIndex(null)
    setSelectedEdgeIndex(null)
    setDragStart(null)
    setShapeDragStart({
      point: clientPointToSvgPoint(event, svgRef.current),
      points: deckPoints,
    })
    resetTransientState()
  }

  function handleEdgeDoubleClick(
    event: ReactMouseEvent<SVGLineElement>,
    edgeIndex: number
  ) {
    event.preventDefault()
    event.stopPropagation()

    if (!svgRef.current) {
      return
    }

    setEditingDimension(null)
    svgRef.current.focus()

    const point = clientPointToSvgPoint(event, svgRef.current)
    const snapped = applySnap(point, houseBounds, pointBounds, {
      disableGrid: event.altKey,
      disableHouse: !snapToHouse,
    })
    const insertedIndex = edgeIndex + 1

    setDeckPoints((points) => [
      ...points.slice(0, insertedIndex),
      snapped.point,
      ...points.slice(insertedIndex),
    ])
    setActivePointIndex(insertedIndex)
    setHoveredEdgeIndex(null)
    setSelectedEdgeIndex(null)
    setDragStart(null)
    resetTransientState()
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

  function removeSelectedEdgeEndPoint() {
    if (selectedEdgeIndex === null) {
      return
    }

    removeEdgeEndPoint(selectedEdgeIndex)
  }

  function removeEdgeEndPoint(edgeIndex: number) {
    if (deckPoints.length <= 3) {
      return
    }

    const pointIndex = (edgeIndex + 1) % deckPoints.length
    setDeckPoints((points) => points.filter((_, index) => index !== pointIndex))
    setActivePointIndex(null)
    setHoveredEdgeIndex(null)
    setSelectedEdgeIndex(null)
    setDragStart(null)
    resetTransientState()
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (shapeDragStart && svgRef.current) {
      let point = clientPointToSvgPoint(event, svgRef.current)

      if (event.shiftKey) {
        const dx = point.x - shapeDragStart.point.x
        const dy = point.y - shapeDragStart.point.y
        point =
          Math.abs(dx) > Math.abs(dy)
            ? { ...point, y: shapeDragStart.point.y }
            : { ...point, x: shapeDragStart.point.x }
      }

      const rawDelta = {
        x: point.x - shapeDragStart.point.x,
        y: point.y - shapeDragStart.point.y,
      }
      const snappedDelta = event.altKey
        ? rawDelta
        : {
            x: snapDelta(rawDelta.x),
            y: snapDelta(rawDelta.y),
          }
      const delta = clampShapeDelta(
        shapeDragStart.points,
        snappedDelta,
        pointBounds
      )

      setDeckPoints(
        shapeDragStart.points.map((startPoint) => ({
          x: startPoint.x + delta.x,
          y: startPoint.y + delta.y,
        }))
      )

      return true
    }

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
      disableHouse: !snapToHouse,
      preferredSnapType: angleSnapType,
    })
    const shouldKeepAttached =
      snapToHouse &&
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
    setShapeDragStart(null)
    resetTransientState()
  }

  function selectEdge(edgeIndex: number) {
    setSelectedEdgeIndex(edgeIndex)
    setActivePointIndex(null)
  }

  function startEditingDimension(edgeIndex: number, valueMeters: number) {
    const edge = edges[edgeIndex]
    if (edge?.locked) {
      selectEdge(edgeIndex)
      return
    }

    cancelDimensionEditRef.current = false
    setEditingDimension({
      edgeIndex,
      value: formatLengthInput(valueMeters),
    })
    setSelectedEdgeIndex(edgeIndex)
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

    const clampedMeters = clamp(newLengthMeters, 0.01, 100)
    const edgeIndex = editingDimension.edgeIndex
    const edge = edges[edgeIndex]
    if (!edge || edge.locked) {
      setEditingDimension(null)
      return
    }

    setDeckPoints((points) =>
      setEdgeAndLinkedLengths({
        constraints: normalizedEdgeConstraints,
        edgeIndex,
        lengthM: clampedMeters,
        pointBounds,
        points,
        prefix: edgePrefix,
      })
    )
    setActivePointIndex((edgeIndex + 1) % deckPoints.length)
    setSelectedEdgeIndex(edgeIndex)
    setEditingDimension(null)
  }

  function toggleSelectedEdgeLock() {
    if (selectedEdgeIndex === null) {
      return
    }

    toggleEdgeLockByIndex(selectedEdgeIndex)
  }

  function toggleEdgeLockByIndex(edgeIndex: number) {
    const edge = edges[edgeIndex]
    if (!edge) {
      return
    }

    setEdgeConstraints((constraints) =>
      toggleEdgeLock(
        normalizeEdgeConstraints({
          constraints,
          points: deckPoints,
          prefix: edgePrefix,
        }),
        edge.id
      )
    )
  }

  function linkSelectedEdgeToOpposite() {
    if (selectedEdgeIndex === null) {
      return
    }

    linkEdgeToOpposite(selectedEdgeIndex)
  }

  function linkEdgeToOpposite(edgeIndex: number) {
    const edge = edges[edgeIndex]
    const linkedEdgeId = getOppositeEdgeId(edges, edgeIndex)

    if (!edge || !linkedEdgeId) {
      return
    }

    setEdgeConstraints((constraints) =>
      linkEdges(
        normalizeEdgeConstraints({
          constraints,
          points: deckPoints,
          prefix: edgePrefix,
        }),
        edge.id,
        linkedEdgeId
      )
    )
  }

  function addNodeToSelectedEdge() {
    if (selectedEdgeIndex === null) {
      return
    }

    addNodeToEdge(selectedEdgeIndex)
  }

  function addNodeToEdge(edgeIndex: number) {
    const edge = edges[edgeIndex]
    if (!edge) {
      return
    }

    const insertedIndex = edge.index + 1
    setDeckPoints((points) => [
      ...points.slice(0, insertedIndex),
      {
        x: (edge.start.x + edge.end.x) / 2,
        y: (edge.start.y + edge.end.y) / 2,
      },
      ...points.slice(insertedIndex),
    ])
    setActivePointIndex(insertedIndex)
    setHoveredEdgeIndex(null)
    setSelectedEdgeIndex(null)
    resetTransientState()
  }

  function unlinkSelectedEdge() {
    if (selectedEdgeIndex === null) {
      return
    }

    unlinkEdgeByIndex(selectedEdgeIndex)
  }

  function unlinkEdgeByIndex(edgeIndex: number) {
    const edge = edges[edgeIndex]
    if (!edge) {
      return
    }

    setEdgeConstraints((constraints) =>
      unlinkEdge(
        normalizeEdgeConstraints({
          constraints,
          points: deckPoints,
          prefix: edgePrefix,
        }),
        edge.id
      )
    )
  }

  return {
    angleSnapState,
    attachedEdgeIndexes,
    attachedEdges,
    dragStart,
    editingDimension,
    edges,
    handleEdgeDoubleClick,
    handlePointPointerDown,
    handlePointerMove,
    handleShapePointerDown,
    hoveredEdgeIndex,
    parallelHint,
    removeActivePoint,
    selectEdge,
    selectedEdgeIndex,
    setHoveredEdgeIndex,
    snapState,
    stopDragging,
    dimensionEditing: {
      addNodeToEdge,
      addNodeToSelectedEdge,
      cancelEditingDimension,
      commitEditingDimension,
      linkEdgeToOpposite,
      linkSelectedEdgeToOpposite,
      removeEdgeEndPoint,
      removeSelectedEdgeEndPoint,
      startEditingDimension,
      toggleEdgeLockByIndex,
      toggleSelectedEdgeLock,
      unlinkEdgeByIndex,
      unlinkSelectedEdge,
      updateEditingDimension,
    },
  }
}

function formatLengthInput(value: number) {
  return Number.isInteger(value) ? String(value) : String(roundLength(value))
}

function roundLength(value: number) {
  return Math.round((value + Number.EPSILON) * 1000) / 1000
}

function snapDelta(value: number) {
  return Math.round(value / GRID_SIZE_PX) * GRID_SIZE_PX
}

function clampShapeDelta(
  points: Point[],
  delta: Point,
  pointBounds: PointBounds
): Point {
  const minX = Math.min(...points.map((point) => point.x))
  const maxX = Math.max(...points.map((point) => point.x))
  const minY = Math.min(...points.map((point) => point.y))
  const maxY = Math.max(...points.map((point) => point.y))

  return {
    x: clamp(delta.x, pointBounds.minX - minX, pointBounds.maxX - maxX),
    y: clamp(delta.y, pointBounds.minY - minY, pointBounds.maxY - maxY),
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
