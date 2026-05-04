import { PIXELS_PER_METER } from "./constants.ts"
import {
  cmToM,
  getTerrainHeightAt,
  normalizeElevationSettings,
  type ElevationSettings,
  type TerrainBounds,
} from "./elevation.ts"
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
import type {
  HouseBounds,
  HouseDoor,
  HouseModel,
  HouseWindow,
  Point,
  PlanContentBounds,
} from "./types.ts"
import {
  DEFAULT_HOUSE_DOOR_HEIGHT_CM,
  DEFAULT_HOUSE_DOOR_WIDTH_CM,
  getHouseDoors,
  getHouseRoofStyle,
  getHouseWindows,
} from "./house.ts"

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
  doors: Plan3DHouseDoor[]
  heightM: number
  roofStyle: NonNullable<HouseModel["roofStyle"]>
  widthM: number
  depthM: number
  windows: Plan3DHouseWindow[]
}

export type Plan3DElevation = {
  settings: ElevationSettings
  deckFinishedY: number
  deckThicknessM: number
  poolTopY: number
  poolBodyHeightM: number
  terrainBounds: TerrainBounds
}

export type Plan3DSupportPost = {
  id: string
  point: Point3D
  terrainY: number
  deckBottomY: number
  heightM: number
}

export type Plan3DHouseDoor = {
  id: string
  centerX: number
  widthM: number
  heightM: number
}

export type Plan3DHouseWindow = {
  id: string
  centerX: number
  centerY: number
  widthM: number
  heightM: number
  row: HouseWindow["row"]
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
  elevation: Plan3DElevation
  house: Plan3DHouse
  poolPoints: Point3D[] | null
  railings: Plan3DRailing[]
  supportPosts: Plan3DSupportPost[]
  stairs: Plan3DStairs[]
  pergolas: Plan3DPergola[]
  privacyScreens: Plan3DPrivacyScreen[]
}

export const STANDARD_DOOR_WIDTH_M = DEFAULT_HOUSE_DOOR_WIDTH_CM / 100
export const STANDARD_DOOR_HEIGHT_M = DEFAULT_HOUSE_DOOR_HEIGHT_CM / 100
export const DEFAULT_HOUSE_WALL_HEIGHT_M = 2.7

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
  elevationSettings,
  features,
  house,
  houseBounds,
  poolPoints,
}: {
  boardDirection: BoardDirectionSettings
  deckEdgeConstraints: EdgeConstraint[]
  deckPoints: Point[]
  elevationSettings: ElevationSettings
  features: DeckFeature[]
  house: HouseModel
  houseBounds: HouseBounds
  poolPoints: Point[] | null
}): Plan3DModel {
  const contentBounds = getPlan3DContentBounds(
    houseBounds,
    deckPoints,
    poolPoints ?? []
  )
  const origin = getCenteredOrigin(contentBounds)
  const normalizedElevation = normalizeElevationSettings(elevationSettings)
  const deckEdges = getDeckEdges({
    constraints: deckEdgeConstraints,
    points: deckPoints,
  })
  const convertedEdges = deckEdges.map((edge) => toPlan3DEdge(edge, origin))
  const convertedDeckPoints = deckPoints.map((point) =>
    pointToPlan3D(point, origin)
  )
  const boundsWidthM =
    (contentBounds.right - contentBounds.left) / PIXELS_PER_METER
  const boundsDepthM =
    (contentBounds.bottom - contentBounds.top) / PIXELS_PER_METER
  const terrainBounds = getTerrainBounds(contentBounds, 3)
  const deckFinishedY = cmToM(normalizedElevation.deck.finishedHeightCm)
  const deckThicknessM = cmToM(normalizedElevation.deck.thicknessCm)
  const deckBottomY = deckFinishedY - deckThicknessM

  return {
    boardLines: getBoardLineSegments({
      angleDeg: boardDirection.boardDirectionDeg,
      points: deckPoints,
      spacingPx: 18,
    })
      .flatMap((line) => clipLineToPolygon(line.start, line.end, deckPoints))
      .filter((line) => !isLineInsidePool(line, poolPoints))
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
    deckPoints: convertedDeckPoints,
    elevation: {
      settings: normalizedElevation,
      deckFinishedY,
      deckThicknessM,
      poolTopY: cmToM(normalizedElevation.pool.topHeightCm),
      poolBodyHeightM: cmToM(normalizedElevation.pool.bodyHeightCm),
      terrainBounds,
    },
    house: {
      center: pointToPlan3D(
        {
          x: houseBounds.centerX,
          y: (houseBounds.top + houseBounds.bottom) / 2,
        },
        origin
      ),
      doors: get3DHouseDoors(house),
      heightM: DEFAULT_HOUSE_WALL_HEIGHT_M,
      roofStyle: getHouseRoofStyle(house),
      widthM: houseBounds.widthPx / PIXELS_PER_METER,
      depthM: houseBounds.depthPx / PIXELS_PER_METER,
      windows: get3DHouseWindows(house),
    },
    poolPoints:
      poolPoints?.map((point) => pointToPlan3D(point, origin)) ?? null,
    railings: get3DRailings(features, convertedEdges),
    supportPosts: normalizedElevation.supports.showPosts
      ? get3DSupportPosts({
          deckBottomY,
          deckPoints: convertedDeckPoints,
          maxSpacingM: normalizedElevation.supports.maxPostSpacingM,
          terrain: normalizedElevation.terrain,
          terrainBounds,
        })
      : [],
    stairs: get3DStairs(features, deckEdges, deckPoints, origin),
    pergolas: get3DPergolas(features, origin),
    privacyScreens: get3DPrivacyScreens(features, deckEdges, origin),
  }
}

function isLineInsidePool(
  line: { start: Point; end: Point },
  poolPoints: Point[] | null
) {
  if (!poolPoints || poolPoints.length < 3) {
    return false
  }

  return pointInPolygon(
    {
      x: (line.start.x + line.end.x) / 2,
      y: (line.start.y + line.end.y) / 2,
    },
    poolPoints
  )
}

function getTerrainBounds(
  bounds: PlanContentBounds,
  paddingM: number
): TerrainBounds {
  return {
    minX: -((bounds.right - bounds.left) / PIXELS_PER_METER) / 2 - paddingM,
    maxX: (bounds.right - bounds.left) / PIXELS_PER_METER / 2 + paddingM,
    minZ: -((bounds.bottom - bounds.top) / PIXELS_PER_METER) / 2 - paddingM,
    maxZ: (bounds.bottom - bounds.top) / PIXELS_PER_METER / 2 + paddingM,
  }
}

function get3DHouseDoors(house: HouseModel): Plan3DHouseDoor[] {
  return getHouseDoors(house).map((door: HouseDoor) => {
    const widthM = (door.widthCm ?? DEFAULT_HOUSE_DOOR_WIDTH_CM) / 100
    const heightM = (door.heightCm ?? DEFAULT_HOUSE_DOOR_HEIGHT_CM) / 100
    const maxOffsetM = Math.max(0, house.widthM / 2 - widthM / 2)

    return {
      id: door.id,
      centerX: clamp(door.offsetM, -maxOffsetM, maxOffsetM),
      widthM,
      heightM,
    }
  })
}

function get3DHouseWindows(house: HouseModel): Plan3DHouseWindow[] {
  return getHouseWindows(house).map((window: HouseWindow) => {
    const widthM = (window.widthCm ?? 120) / 100
    const heightM = (window.heightCm ?? 120) / 100
    const maxOffsetM = Math.max(0, house.widthM / 2 - widthM / 2)

    return {
      id: window.id,
      centerX: clamp(window.offsetM, -maxOffsetM, maxOffsetM),
      centerY: window.row === "upper" ? 1.82 : 1.05,
      widthM,
      heightM,
      row: window.row,
    }
  })
}

function get3DSupportPosts({
  deckBottomY,
  deckPoints,
  maxSpacingM,
  terrain,
  terrainBounds,
}: {
  deckBottomY: number
  deckPoints: Point3D[]
  maxSpacingM: number
  terrain: ElevationSettings["terrain"]
  terrainBounds: TerrainBounds
}): Plan3DSupportPost[] {
  const candidates: Point3D[] = []

  deckPoints.forEach((point, index) => {
    const next = deckPoints[(index + 1) % deckPoints.length]
    candidates.push(point)
    if (!next) {
      return
    }

    const edgeLength = Math.hypot(next.x - point.x, next.z - point.z)
    const extraCount = Math.max(0, Math.ceil(edgeLength / maxSpacingM) - 1)
    for (let step = 1; step <= extraCount; step += 1) {
      const t = step / (extraCount + 1)
      candidates.push({
        x: point.x + (next.x - point.x) * t,
        z: point.z + (next.z - point.z) * t,
      })
    }
  })

  return dedupeSupportPoints(candidates)
    .slice(0, 48)
    .flatMap((point, index) => {
      const terrainY = getTerrainHeightAt(point, terrain, terrainBounds)
      const heightM = deckBottomY - terrainY

      return heightM > 0.12
        ? [
            {
              id: `support-post-${index}`,
              point,
              terrainY,
              deckBottomY,
              heightM,
            },
          ]
        : []
    })
}

function dedupeSupportPoints(points: Point3D[]) {
  return points.filter((point, index) =>
    points.every(
      (candidate, candidateIndex) =>
        candidateIndex >= index ||
        Math.hypot(candidate.x - point.x, candidate.z - point.z) > 0.08
    )
  )
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

function dedupeIntersections(
  intersections: Array<{ point: Point; t: number }>
) {
  return intersections.filter((intersection, index) =>
    intersections.every(
      (candidate, candidateIndex) =>
        candidateIndex >= index ||
        Math.abs(candidate.t - intersection.t) > 0.0001
    )
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
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
