import { PIXELS_PER_METER } from "./constants.ts"
import type { Point, PointBounds } from "./types.ts"

export type EdgeConstraint = {
  id: string
  locked: boolean
  linkedEdgeId?: string | null
}

export type GeometryEdge = {
  id: string
  startPointId: string
  endPointId: string
  length: number
  locked: boolean
  linkedEdgeId?: string | null
  index: number
  start: Point
  end: Point
}

export function getEdgeId(prefix: string, edgeIndex: number) {
  return `${prefix}-edge-${edgeIndex}`
}

export function getPointId(prefix: string, pointIndex: number) {
  return `${prefix}-point-${pointIndex}`
}

export function getPolygonEdges({
  constraints,
  points,
  prefix,
}: {
  constraints: EdgeConstraint[]
  points: Point[]
  prefix: string
}): GeometryEdge[] {
  return points.flatMap((point, index) => {
    const nextPoint = points[(index + 1) % points.length]
    if (!nextPoint) {
      return []
    }

    const id = getEdgeId(prefix, index)
    const constraint = constraints.find((item) => item.id === id)

    return {
      id,
      startPointId: getPointId(prefix, index),
      endPointId: getPointId(prefix, (index + 1) % points.length),
      index,
      start: point,
      end: nextPoint,
      length: distance(point, nextPoint) / PIXELS_PER_METER,
      locked: constraint?.locked ?? false,
      linkedEdgeId: constraint?.linkedEdgeId ?? null,
    }
  })
}

export function normalizeEdgeConstraints({
  constraints,
  points,
  prefix,
}: {
  constraints: EdgeConstraint[]
  points: Point[]
  prefix: string
}) {
  const edgeIds = points.map((_, index) => getEdgeId(prefix, index))

  return edgeIds.map<EdgeConstraint>((id) => {
    const existing = constraints.find((constraint) => constraint.id === id)
    const linkedEdgeId =
      existing?.linkedEdgeId && edgeIds.includes(existing.linkedEdgeId)
        ? existing.linkedEdgeId
        : null

    return {
      id,
      locked: existing?.locked ?? false,
      linkedEdgeId,
    }
  })
}

export function setEdgeLength({
  edgeIndex,
  lengthM,
  pointBounds,
  points,
}: {
  edgeIndex: number
  lengthM: number
  pointBounds: PointBounds
  points: Point[]
}) {
  const startPoint = points[edgeIndex]
  const endPoint = points[(edgeIndex + 1) % points.length]

  if (!startPoint || !endPoint || !Number.isFinite(lengthM) || lengthM <= 0) {
    return points
  }

  const currentLengthPx = distance(startPoint, endPoint)
  if (currentLengthPx === 0) {
    return points
  }

  const newLengthPx = lengthM * PIXELS_PER_METER
  const nextPoint = clampPoint(
    {
      x:
        startPoint.x +
        ((endPoint.x - startPoint.x) / currentLengthPx) * newLengthPx,
      y:
        startPoint.y +
        ((endPoint.y - startPoint.y) / currentLengthPx) * newLengthPx,
    },
    pointBounds
  )
  const nextIndex = (edgeIndex + 1) % points.length

  return points.map((point, index) => (index === nextIndex ? nextPoint : point))
}

export function setEdgeAndLinkedLengths({
  constraints,
  edgeIndex,
  lengthM,
  pointBounds,
  points,
  prefix,
}: {
  constraints: EdgeConstraint[]
  edgeIndex: number
  lengthM: number
  pointBounds: PointBounds
  points: Point[]
  prefix: string
}) {
  const edges = getPolygonEdges({ constraints, points, prefix })
  const edge = edges[edgeIndex]

  if (!edge || edge.locked) {
    return points
  }

  let nextPoints = setEdgeLength({ edgeIndex, lengthM, pointBounds, points })
  const linkedEdge = edge.linkedEdgeId
    ? edges.find((item) => item.id === edge.linkedEdgeId)
    : null

  if (linkedEdge && !linkedEdge.locked) {
    nextPoints = setEdgeLength({
      edgeIndex: linkedEdge.index,
      lengthM,
      pointBounds,
      points: nextPoints,
    })
  }

  return nextPoints
}

export function getOppositeEdgeId(edges: GeometryEdge[], edgeIndex: number) {
  if (edges.length < 4) {
    return null
  }

  return edges[(edgeIndex + Math.floor(edges.length / 2)) % edges.length]?.id ?? null
}

export function toggleEdgeLock(
  constraints: EdgeConstraint[],
  edgeId: string
) {
  return constraints.map((constraint) =>
    constraint.id === edgeId
      ? { ...constraint, locked: !constraint.locked }
      : constraint
  )
}

export function linkEdges(
  constraints: EdgeConstraint[],
  edgeId: string,
  linkedEdgeId: string
) {
  return constraints.map((constraint) => {
    if (constraint.id === edgeId) {
      return { ...constraint, linkedEdgeId }
    }

    if (constraint.id === linkedEdgeId) {
      return { ...constraint, linkedEdgeId: edgeId }
    }

    return constraint
  })
}

export function unlinkEdge(constraints: EdgeConstraint[], edgeId: string) {
  const linkedEdgeId = constraints.find(
    (constraint) => constraint.id === edgeId
  )?.linkedEdgeId

  return constraints.map((constraint) =>
    constraint.id === edgeId || constraint.id === linkedEdgeId
      ? { ...constraint, linkedEdgeId: null }
      : constraint
  )
}

function clampPoint(point: Point, pointBounds: PointBounds): Point {
  return {
    x: Math.min(Math.max(point.x, pointBounds.minX), pointBounds.maxX),
    y: Math.min(Math.max(point.y, pointBounds.minY), pointBounds.maxY),
  }
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}
