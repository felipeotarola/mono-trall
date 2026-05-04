import { PIXELS_PER_METER } from "./constants.ts"
import {
  getBoardLineSegments,
  getDeckEdges,
  getEdgeNormal,
  getEdgeTangent,
  getPointAtT,
  pointInPolygon,
  type BoardDirectionSettings,
  type DeckFeature,
  type PergolaFeature,
  type PrivacyScreenFeature,
  type RailingFeature,
} from "./features.ts"
import type { EdgeConstraint, GeometryEdge } from "./edge-model"
import type { HouseBounds, Point, PlanContentBounds } from "./types.ts"

export type Point3D = {
  x: number
  z: number
}

export type Plan3DEdge = {
  id: string
  index: number
  start: Point3D
  end: Point3D
  lengthM: number
  angleY: number
}

export type Plan3DLine = {
  id: string
  start: Point3D
  end: Point3D
}

export type Plan3DStairs = {
  id: string
  anchor: Point3D
  angleY: number
  widthM: number
  depthM: number
  stepCount: number
  normal: Point3D
}

export type Plan3DRailing = {
  id: string
  edge: Plan3DEdge
  heightM: number
  style: RailingFeature["style"]
}

export type Plan3DPergola = {
  id: string
  center: Point3D
  widthM: number
  depthM: number
  rotationRad: number
  postCount: number
}

export type Plan3DPrivacyScreen = {
  id: string
  start: Point3D
  end: Point3D
  heightM: number
  style: PrivacyScreenFeature["style"]
  angleY: number
  lengthM: number
}

export type Plan3DHouse = {
  center: Point3D
  widthM: number
  depthM: number
}

export type Plan3DModel = {
  boardLines: Plan3DLine[]
  bounds: {
    widthM: number
    depthM: number
    diagonalM: number
  }
  deckEdges: Plan3DEdge[]
  deckPoints: Point3D[]
  house: Plan3DHouse
  poolPoints: Point3D[] | null
  railings: Plan3DRailing[]
  stairs: Plan3DStairs[]
  pergolas: Plan3DPergola[]
  privacyScreens: Plan3DPrivacyScreen[]
}

export function pointToPlan3D(
  point: Point,
  origin: { x: number; y: number }
): Point3D {
  return {
    x: (point.x - origin.x) / PIXELS_PER_METER,
    z: (point.y - origin.y) / PIXELS_PER_METER,
  }
}

export function getPlan3DModel({
  boardDirection,
  deckEdgeConstraints,
  deckPoints,
  features,
  houseBounds,
  poolPoints,
}: {
  boardDirection: BoardDirectionSettings
  deckEdgeConstraints: EdgeConstraint[]
  deckPoints: Point[]
  features: DeckFeature[]
  houseBounds: HouseBounds
  poolPoints: Point[] | null
}): Plan3DModel {
  const contentBounds = getPlan3DContentBounds(
    houseBounds,
    deckPoints,
    poolPoints ?? []
  )
  const origin = getCenteredOrigin(contentBounds)
  const deckEdges = getDeckEdges({
    constraints: deckEdgeConstraints,
    points: deckPoints,
  })
  const convertedEdges = deckEdges.map((edge) => toPlan3DEdge(edge, origin))
  const boundsWidthM = (contentBounds.right - contentBounds.left) / PIXELS_PER_METER
  const boundsDepthM = (contentBounds.bottom - contentBounds.top) / PIXELS_PER_METER

  return {
    boardLines: getBoardLineSegments({
      angleDeg: boardDirection.boardDirectionDeg,
      points: deckPoints,
      spacingPx: 18,
    })
      .flatMap((line) => clipLineToPolygon(line.start, line.end, deckPoints))
      .map((line, index) => ({
        id: `board-line-${index}`,
        start: pointToPlan3D(line.start, origin),
        end: pointToPlan3D(line.end, origin),
      })),
    bounds: {
      widthM: boundsWidthM,
      depthM: boundsDepthM,
      diagonalM: Math.hypot(boundsWidthM, boundsDepthM),
    },
    deckEdges: convertedEdges,
    deckPoints: deckPoints.map((point) => pointToPlan3D(point, origin)),
    house: {
      center: pointToPlan3D(
        {
          x: houseBounds.centerX,
          y: (houseBounds.top + houseBounds.bottom) / 2,
        },
        origin
      ),
      widthM: houseBounds.widthPx / PIXELS_PER_METER,
      depthM: houseBounds.depthPx / PIXELS_PER_METER,
    },
    poolPoints: poolPoints?.map((point) => pointToPlan3D(point, origin)) ?? null,
    railings: get3DRailings(features, convertedEdges),
    stairs: get3DStairs(features, deckEdges, deckPoints, origin),
    pergolas: get3DPergolas(features, origin),
    privacyScreens: get3DPrivacyScreens(features, deckEdges, origin),
  }
}

function clipLineToPolygon(start: Point, end: Point, polygon: Point[]) {
  const intersections: Array<{ point: Point; t: number }> = []

  if (pointInPolygon(start, polygon)) {
    intersections.push({ point: start, t: 0 })
  }

  if (pointInPolygon(end, polygon)) {
    intersections.push({ point: end, t: 1 })
  }

  polygon.forEach((point, index) => {
    const next = polygon[(index + 1) % polygon.length]
    if (!next) {
      return
    }

    const intersection = getLineIntersection(start, end, point, next)
    if (intersection) {
      intersections.push(intersection)
    }
  })

  const sorted = dedupeIntersections(intersections).sort((a, b) => a.t - b.t)

  return sorted.flatMap((intersection, index) => {
    const next = sorted[index + 1]
    if (!next) {
      return []
    }

    const midpoint = {
      x: (intersection.point.x + next.point.x) / 2,
      y: (intersection.point.y + next.point.y) / 2,
    }

    return pointInPolygon(midpoint, polygon)
      ? [{ start: intersection.point, end: next.point }]
      : []
  })
}

function getLineIntersection(
  startA: Point,
  endA: Point,
  startB: Point,
  endB: Point
) {
  const denominator =
    (endA.x - startA.x) * (endB.y - startB.y) -
    (endA.y - startA.y) * (endB.x - startB.x)

  if (Math.abs(denominator) < 0.0001) {
    return null
  }

  const t =
    ((startB.x - startA.x) * (endB.y - startB.y) -
      (startB.y - startA.y) * (endB.x - startB.x)) /
    denominator
  const u =
    ((startB.x - startA.x) * (endA.y - startA.y) -
      (startB.y - startA.y) * (endA.x - startA.x)) /
    denominator

  if (t < 0 || t > 1 || u < 0 || u > 1) {
    return null
  }

  return {
    point: {
      x: startA.x + (endA.x - startA.x) * t,
      y: startA.y + (endA.y - startA.y) * t,
    },
    t,
  }
}

function dedupeIntersections(intersections: Array<{ point: Point; t: number }>) {
  return intersections.filter((intersection, index) =>
    intersections.every(
      (candidate, candidateIndex) =>
        candidateIndex >= index || Math.abs(candidate.t - intersection.t) > 0.0001
    )
  )
}

function getCenteredOrigin(bounds: PlanContentBounds) {
  return {
    x: (bounds.left + bounds.right) / 2,
    y: (bounds.top + bounds.bottom) / 2,
  }
}

function getPlan3DContentBounds(
  houseBounds: HouseBounds,
  deckPoints: Point[],
  poolPoints: Point[]
): PlanContentBounds {
  const points = [...deckPoints, ...poolPoints]

  return {
    left: Math.min(houseBounds.left, ...points.map((point) => point.x)),
    right: Math.max(houseBounds.right, ...points.map((point) => point.x)),
    top: Math.min(houseBounds.top, ...points.map((point) => point.y)),
    bottom: Math.max(houseBounds.bottom, ...points.map((point) => point.y)),
  }
}

function toPlan3DEdge(
  edge: GeometryEdge,
  origin: { x: number; y: number }
): Plan3DEdge {
  const start = pointToPlan3D(edge.start, origin)
  const end = pointToPlan3D(edge.end, origin)

  return {
    id: edge.id,
    index: edge.index,
    start,
    end,
    lengthM: edge.length,
    angleY: Math.atan2(end.z - start.z, end.x - start.x),
  }
}

function get3DRailings(
  features: DeckFeature[],
  edges: Plan3DEdge[]
): Plan3DRailing[] {
  return features.flatMap((feature) => {
    if (feature.type !== "railing") {
      return []
    }

    return feature.edgeIds.flatMap((edgeId) => {
      const edge = edges.find((item) => item.id === edgeId)
      return edge
        ? [
            {
              id: `${feature.id}-${edge.id}`,
              edge,
              heightM: feature.heightCm / 100,
              style: feature.style,
            },
          ]
        : []
    })
  })
}

function get3DStairs(
  features: DeckFeature[],
  edges: GeometryEdge[],
  deckPoints: Point[],
  origin: { x: number; y: number }
): Plan3DStairs[] {
  return features.flatMap((feature) => {
    if (feature.type !== "stairs") {
      return []
    }

    const edge = edges.find((item) => item.id === feature.edgeId)
    if (!edge) {
      return []
    }

    const normalBase = getEdgeNormal(edge, deckPoints)
    const normal =
      feature.direction === "inward"
        ? { x: -normalBase.x, y: -normalBase.y }
        : normalBase
    const tangent = getEdgeTangent(edge)
    const anchor = pointToPlan3D(getPointAtT(edge, feature.positionT), origin)

    return [
      {
        id: feature.id,
        anchor,
        angleY: Math.atan2(tangent.y, tangent.x),
        widthM: feature.widthM,
        depthM: feature.depthM,
        stepCount: feature.stepCount,
        normal: { x: normal.x, z: normal.y },
      },
    ]
  })
}

function get3DPergolas(
  features: DeckFeature[],
  origin: { x: number; y: number }
): Plan3DPergola[] {
  return features.flatMap((feature) => {
    if (feature.type !== "pergola") {
      return []
    }

    const pergola = feature as PergolaFeature
    return [
      {
        id: pergola.id,
        center: pointToPlan3D({ x: pergola.x, y: pergola.y }, origin),
        widthM: pergola.widthM,
        depthM: pergola.depthM,
        rotationRad: (pergola.rotationDeg * Math.PI) / 180,
        postCount: pergola.postCount,
      },
    ]
  })
}

function get3DPrivacyScreens(
  features: DeckFeature[],
  edges: GeometryEdge[],
  origin: { x: number; y: number }
): Plan3DPrivacyScreen[] {
  return features.flatMap((feature) => {
    if (feature.type !== "privacyScreen") {
      return []
    }

    const screen = feature as PrivacyScreenFeature
    const edge = edges.find((item) => item.id === screen.edgeId)
    if (!edge) {
      return []
    }

    const start = pointToPlan3D(getPointAtT(edge, screen.startT), origin)
    const end = pointToPlan3D(getPointAtT(edge, screen.endT), origin)

    return [
      {
        id: screen.id,
        start,
        end,
        heightM: screen.heightCm / 100,
        style: screen.style,
        angleY: Math.atan2(end.z - start.z, end.x - start.x),
        lengthM: Math.hypot(end.x - start.x, end.z - start.z),
      },
    ]
  })
}
