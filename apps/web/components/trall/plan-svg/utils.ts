import { PIXELS_PER_METER } from "@/lib/trall/constants"
import type {
  FeaturePlacementType,
  SiteObjectKind,
} from "@/lib/trall/features"
import { distance } from "@/lib/trall/geometry"
import type { MeasurementLine, Point } from "@/lib/trall/types"

export function getPolygonPoints(points: Point[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(" ")
}

export function getPointsCenter(points: Point[]): Point {
  const total = points.reduce(
    (sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }),
    { x: 0, y: 0 }
  )

  return {
    x: total.x / points.length,
    y: total.y / points.length,
  }
}

export function getDimensionLabelPoint(
  start: Point,
  end: Point,
  center: Point
): Point {
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

export function noopSetActivePointIndex() {}

export function noopSetPoolPoints() {}

export function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable)
  )
}

export function formatLengthInput(value: number) {
  return Number.isInteger(value) ? String(value) : String(roundLength(value))
}

export function formatDisplayMeters(value: number) {
  return `${formatLengthInput(value)} m`
}

export function setMeasurementLength(
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

export function getSiteObjectKindFromPlacementMode(
  placementMode: FeaturePlacementType | null
): SiteObjectKind | null {
  if (placementMode === "siteTree") {
    return "tree"
  }

  if (placementMode === "siteBush") {
    return "bush"
  }

  if (placementMode === "sitePlanter") {
    return "planter"
  }

  if (placementMode === "siteLight") {
    return "outdoorLight"
  }

  return null
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function roundLength(value: number) {
  return Math.round((value + Number.EPSILON) * 1000) / 1000
}
