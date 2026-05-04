import type { EdgeConstraint, GeometryEdge } from "./edge-model.ts"
import { getPolygonEdges } from "./edge-model.ts"
import type { Point } from "./types.ts"

export type FeaturePlacementType =
  | "stairs"
  | "railing"
  | "pergola"
  | "privacyScreen"
  | "siteTree"
  | "siteBush"
  | "sitePlanter"
  | "siteLight"
  | "boardDirection"

export type BoardDirectionMode =
  | "parallel-house"
  | "perpendicular-house"
  | "custom"

export type BoardDirectionSettings = {
  boardDirectionDeg: number
  boardDirectionMode: BoardDirectionMode
}

export type StairFeature = {
  id: string
  type: "stairs"
  edgeId: string
  positionT: number
  widthM: number
  depthM: number
  stepCount: number
  direction: "outward" | "inward"
  label: string
}

export type RailingFeature = {
  id: string
  type: "railing"
  edgeIds: string[]
  heightCm: number
  style: "wood" | "glass" | "metal"
  label: string
}

export type PergolaFeature = {
  id: string
  type: "pergola"
  x: number
  y: number
  widthM: number
  depthM: number
  rotationDeg: number
  postCount: number
  label: string
}

export type PrivacyScreenFeature = {
  id: string
  type: "privacyScreen"
  edgeId: string
  startT: number
  endT: number
  heightCm: number
  style: "slatted" | "solid" | "greenery"
  label: string
}

export type SiteObjectKind = "tree" | "bush" | "planter" | "outdoorLight"

export type SiteObjectFeature = {
  id: string
  type: "siteObject"
  kind: SiteObjectKind
  x: number
  y: number
  sizeM: number
  rotationDeg: number
  label: string
}

export type DeckFeature =
  | StairFeature
  | RailingFeature
  | PergolaFeature
  | PrivacyScreenFeature
  | SiteObjectFeature

export const defaultBoardDirection: BoardDirectionSettings = {
  boardDirectionDeg: 0,
  boardDirectionMode: "parallel-house",
}

export const STAIR_WIDTH_MIN_M = 0.6
export const STAIR_WIDTH_MAX_M = 30

export function getDeckEdges({
  constraints,
  points,
}: {
  constraints: EdgeConstraint[]
  points: Point[]
}) {
  return getPolygonEdges({ constraints, points, prefix: "deck" })
}

export function createDefaultStairs({
  deckHeightCm,
  edge,
}: {
  deckHeightCm?: number
  edge: GeometryEdge
}): StairFeature {
  return {
    id: createFeatureId("stairs"),
    type: "stairs",
    edgeId: edge.id,
    positionT: 0.5,
    widthM: 1.2,
    depthM: 0.9,
    stepCount: getDefaultStepCount(deckHeightCm),
    direction: "outward",
    label: "Stairs",
  }
}

export function createDefaultRailing(edge: GeometryEdge): RailingFeature {
  return {
    id: createFeatureId("railing"),
    type: "railing",
    edgeIds: [edge.id],
    heightCm: 110,
    style: "wood",
    label: "Fence",
  }
}

export function createDefaultPergola({
  point,
  rotationDeg = 0,
}: {
  point: Point
  rotationDeg?: number
}): PergolaFeature {
  return {
    id: createFeatureId("pergola"),
    type: "pergola",
    x: point.x,
    y: point.y,
    widthM: 3,
    depthM: 2.5,
    rotationDeg: normalizeAngle(rotationDeg),
    postCount: 4,
    label: "Pergola",
  }
}

export function createDefaultPrivacyScreen(
  edge: GeometryEdge
): PrivacyScreenFeature {
  return {
    id: createFeatureId("privacy-screen"),
    type: "privacyScreen",
    edgeId: edge.id,
    startT: 0.1,
    endT: 0.9,
    heightCm: 180,
    style: "slatted",
    label: "Privacy screen",
  }
}

export function createDefaultSiteObject({
  kind,
  point,
  rotationDeg = 0,
}: {
  kind: SiteObjectKind
  point: Point
  rotationDeg?: number
}): SiteObjectFeature {
  return {
    id: createFeatureId(`site-${kind}`),
    type: "siteObject",
    kind,
    x: point.x,
    y: point.y,
    sizeM: kind === "tree" ? 2.4 : kind === "outdoorLight" ? 1.2 : 1,
    rotationDeg: normalizeAngle(rotationDeg),
    label: getDefaultSiteObjectLabel(kind),
  }
}

export function updateFeature(
  features: DeckFeature[],
  featureId: string,
  updater: (feature: DeckFeature) => DeckFeature
) {
  return features.map((feature) =>
    feature.id === featureId ? updater(feature) : feature
  )
}

export function deleteFeature(features: DeckFeature[], featureId: string) {
  return features.filter((feature) => feature.id !== featureId)
}

export function getFeatureLabel(feature: DeckFeature) {
  return feature.label || feature.type
}

export function getEdgeMidpoint(edge: GeometryEdge) {
  return getPointAtT(edge, 0.5)
}

export function getPointAtT(edge: GeometryEdge, t: number): Point {
  const clampedT = clamp(t, 0, 1)
  return {
    x: edge.start.x + (edge.end.x - edge.start.x) * clampedT,
    y: edge.start.y + (edge.end.y - edge.start.y) * clampedT,
  }
}

export function getEdgeNormal(edge: GeometryEdge, polygonPoints: Point[]) {
  const dx = edge.end.x - edge.start.x
  const dy = edge.end.y - edge.start.y
  const length = Math.hypot(dx, dy) || 1
  const midpoint = getEdgeMidpoint(edge)
  const center = getPolygonCenter(polygonPoints)
  const normalA = { x: -dy / length, y: dx / length }
  const normalB = { x: dy / length, y: -dx / length }
  const awayVector = {
    x: midpoint.x - center.x,
    y: midpoint.y - center.y,
  }
  const dotA = normalA.x * awayVector.x + normalA.y * awayVector.y

  return dotA >= 0 ? normalA : normalB
}

export function getEdgeTangent(edge: GeometryEdge) {
  const length = distance(edge.start, edge.end) || 1
  return {
    x: (edge.end.x - edge.start.x) / length,
    y: (edge.end.y - edge.start.y) / length,
  }
}

export function pointInPolygon(point: Point, polygon: Point[]) {
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]
    const b = polygon[j]
    if (!a || !b) {
      continue
    }

    const intersects =
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y || 1) + a.x

    if (intersects) {
      inside = !inside
    }
  }

  return inside
}

export function normalizeBoardDirection(
  value: unknown
): BoardDirectionSettings {
  if (!value || typeof value !== "object") {
    return defaultBoardDirection
  }

  const candidate = value as Partial<BoardDirectionSettings>
  const mode: BoardDirectionMode =
    candidate.boardDirectionMode === "perpendicular-house" ||
    candidate.boardDirectionMode === "custom" ||
    candidate.boardDirectionMode === "parallel-house"
      ? candidate.boardDirectionMode
      : "parallel-house"
  const defaultDeg =
    mode === "perpendicular-house"
      ? 90
      : mode === "parallel-house"
        ? 0
        : defaultBoardDirection.boardDirectionDeg
  const boardDirectionDeg =
    typeof candidate.boardDirectionDeg === "number" &&
    Number.isFinite(candidate.boardDirectionDeg)
      ? normalizeAngle(candidate.boardDirectionDeg)
      : defaultDeg

  return {
    boardDirectionDeg,
    boardDirectionMode: mode,
  }
}

export function setBoardDirectionMode(
  mode: BoardDirectionMode,
  current: BoardDirectionSettings
): BoardDirectionSettings {
  if (mode === "parallel-house") {
    return { boardDirectionDeg: 0, boardDirectionMode: mode }
  }

  if (mode === "perpendicular-house") {
    return { boardDirectionDeg: 90, boardDirectionMode: mode }
  }

  return {
    boardDirectionDeg: normalizeAngle(current.boardDirectionDeg),
    boardDirectionMode: "custom",
  }
}

export function rotateBoardDirection(
  current: BoardDirectionSettings
): BoardDirectionSettings {
  const nextDeg = normalizeAngle(current.boardDirectionDeg + 90)
  const nextMode =
    current.boardDirectionMode === "parallel-house"
      ? "perpendicular-house"
      : current.boardDirectionMode === "perpendicular-house"
        ? "parallel-house"
        : "custom"

  return {
    boardDirectionDeg: nextDeg,
    boardDirectionMode: nextMode,
  }
}

export function setCustomBoardDirection(
  current: BoardDirectionSettings,
  value: number
): BoardDirectionSettings {
  if (!Number.isFinite(value)) {
    return current
  }

  return {
    boardDirectionDeg: normalizeAngle(value),
    boardDirectionMode: "custom",
  }
}

export function normalizeDeckFeatures(value: unknown): DeckFeature[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item): DeckFeature[] => {
    if (!item || typeof item !== "object") {
      return []
    }

    const feature = item as Partial<DeckFeature>

    if (feature.type === "stairs" && typeof feature.edgeId === "string") {
      return [
        {
          id: getPersistedId(feature.id, "stairs"),
          type: "stairs",
          edgeId: feature.edgeId,
          positionT: clampNumber(feature.positionT, 0, 1, 0.5),
          widthM: clampNumber(
            feature.widthM,
            STAIR_WIDTH_MIN_M,
            STAIR_WIDTH_MAX_M,
            1.2
          ),
          depthM: clampNumber(feature.depthM, 0.5, 5, 0.9),
          stepCount: Math.round(clampNumber(feature.stepCount, 1, 16, 2)),
          direction: feature.direction === "inward" ? "inward" : "outward",
          label: getPersistedLabel(feature.label, "Stairs"),
        },
      ]
    }

    if (feature.type === "railing" && Array.isArray(feature.edgeIds)) {
      return [
        {
          id: getPersistedId(feature.id, "railing"),
          type: "railing",
          edgeIds: feature.edgeIds.filter(
            (edgeId): edgeId is string => typeof edgeId === "string"
          ),
          heightCm: Math.round(clampNumber(feature.heightCm, 80, 140, 110)),
          style:
            feature.style === "glass" || feature.style === "metal"
              ? feature.style
              : "wood",
          label: getPersistedLabel(feature.label, "Fence"),
        },
      ]
    }

    if (feature.type === "pergola") {
      return [
        {
          id: getPersistedId(feature.id, "pergola"),
          type: "pergola",
          x: clampNumber(feature.x, -10000, 10000, 0),
          y: clampNumber(feature.y, -10000, 10000, 0),
          widthM: clampNumber(feature.widthM, 1, 8, 3),
          depthM: clampNumber(feature.depthM, 1, 8, 2.5),
          rotationDeg: normalizeAngle(
            clampNumber(feature.rotationDeg, -360, 360, 0)
          ),
          postCount: Math.round(clampNumber(feature.postCount, 4, 12, 4)),
          label: getPersistedLabel(feature.label, "Pergola"),
        },
      ]
    }

    if (
      feature.type === "privacyScreen" &&
      typeof feature.edgeId === "string"
    ) {
      const startT = clampNumber(feature.startT, 0, 1, 0.1)
      const endT = clampNumber(feature.endT, 0, 1, 0.9)

      return [
        {
          id: getPersistedId(feature.id, "privacy-screen"),
          type: "privacyScreen",
          edgeId: feature.edgeId,
          startT: Math.min(startT, endT),
          endT: Math.max(startT, endT),
          heightCm: Math.round(clampNumber(feature.heightCm, 120, 240, 180)),
          style:
            feature.style === "solid" || feature.style === "greenery"
              ? feature.style
              : "slatted",
          label: getPersistedLabel(feature.label, "Privacy screen"),
        },
      ]
    }

    if (feature.type === "siteObject") {
      const kind =
        feature.kind === "tree" ||
        feature.kind === "bush" ||
        feature.kind === "planter" ||
        feature.kind === "outdoorLight"
          ? feature.kind
          : "tree"

      return [
        {
          id: getPersistedId(feature.id, `site-${kind}`),
          type: "siteObject",
          kind,
          x: clampNumber(feature.x, -10000, 10000, 0),
          y: clampNumber(feature.y, -10000, 10000, 0),
          sizeM: clampNumber(feature.sizeM, 0.3, 8, kind === "tree" ? 2.4 : 1),
          rotationDeg: normalizeAngle(
            clampNumber(feature.rotationDeg, -360, 360, 0)
          ),
          label: getPersistedLabel(
            feature.label,
            getDefaultSiteObjectLabel(kind)
          ),
        },
      ]
    }

    return []
  })
}

export function getBoardLineSegments({
  angleDeg,
  points,
  spacingPx = 26,
}: {
  angleDeg: number
  points: Point[]
  spacingPx?: number
}) {
  const bounds = getPointBounds(points, 220)
  const center = {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  }
  const rad = degreesToRadians(angleDeg)
  const tangent = { x: Math.cos(rad), y: Math.sin(rad) }
  const normal = { x: -tangent.y, y: tangent.x }
  const diagonal = Math.hypot(
    bounds.maxX - bounds.minX,
    bounds.maxY - bounds.minY
  )
  const count = Math.ceil(diagonal / spacingPx)

  return Array.from({ length: count * 2 + 1 }, (_, index) => {
    const offset = (index - count) * spacingPx
    const base = {
      x: center.x + normal.x * offset,
      y: center.y + normal.y * offset,
    }

    return {
      start: {
        x: base.x - tangent.x * diagonal,
        y: base.y - tangent.y * diagonal,
      },
      end: {
        x: base.x + tangent.x * diagonal,
        y: base.y + tangent.y * diagonal,
      },
    }
  })
}

function getDefaultStepCount(deckHeightCm?: number) {
  if (!deckHeightCm || !Number.isFinite(deckHeightCm)) {
    return 2
  }

  return Math.round(clamp(Math.ceil(deckHeightCm / 18), 1, 8))
}

function getPolygonCenter(points: Point[]): Point {
  if (points.length === 0) {
    return { x: 0, y: 0 }
  }

  const total = points.reduce(
    (sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }),
    { x: 0, y: 0 }
  )

  return {
    x: total.x / points.length,
    y: total.y / points.length,
  }
}

function getPointBounds(points: Point[], padding: number) {
  return {
    minX: Math.min(...points.map((point) => point.x)) - padding,
    maxX: Math.max(...points.map((point) => point.x)) + padding,
    minY: Math.min(...points.map((point) => point.y)) - padding,
    maxY: Math.max(...points.map((point) => point.y)) + padding,
  }
}

function clampNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number
) {
  return typeof value === "number" && Number.isFinite(value)
    ? clamp(value, min, max)
    : fallback
}

function createFeatureId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getDefaultSiteObjectLabel(kind: SiteObjectKind) {
  if (kind === "tree") {
    return "Tree"
  }

  if (kind === "bush") {
    return "Bush"
  }

  if (kind === "planter") {
    return "Planter"
  }

  return "Outdoor light"
}

function getPersistedId(value: unknown, prefix: string) {
  return typeof value === "string" && value.trim()
    ? value
    : createFeatureId(prefix)
}

function getPersistedLabel(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function distance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function degreesToRadians(deg: number) {
  return (deg * Math.PI) / 180
}

function normalizeAngle(deg: number) {
  return ((deg % 360) + 360) % 360
}
