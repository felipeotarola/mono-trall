import {
  ANGLE_SNAP_DEGREES,
  ANGLE_SNAP_THRESHOLD_DEG,
} from "./constants"
import type { Point } from "./types"

export function polygonArea(points: Point[]): number {
  if (points.length < 3) {
    return 0
  }

  const signedArea = points.reduce((sum, point, index) => {
    const nextPoint = points[(index + 1) % points.length]
    if (!nextPoint) {
      return sum
    }

    return sum + point.x * nextPoint.y - nextPoint.x * point.y
  }, 0)

  return Math.abs(signedArea) / 2
}

export function polygonPerimeter(points: Point[]): number {
  return points.reduce((sum, point, index) => {
    const nextPoint = points[(index + 1) % points.length]
    return nextPoint ? sum + distance(point, nextPoint) : sum
  }, 0)
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function radiansToDegrees(rad: number): number {
  return (rad * 180) / Math.PI
}

export function degreesToRadians(deg: number): number {
  return (deg * Math.PI) / 180
}

export function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360
}

export function closestSnapAngle(angleDeg: number): {
  angle: number
  delta: number
  snapped: boolean
} {
  const normalizedAngle = normalizeAngle(angleDeg)
  const closest = ANGLE_SNAP_DEGREES.reduce(
    (best, angle) => {
      const delta = Math.abs(normalizeAngle(normalizedAngle - angle))
      const shortestDelta = Math.min(delta, 360 - delta)

      return shortestDelta < best.delta ? { angle, delta: shortestDelta } : best
    },
    { angle: ANGLE_SNAP_DEGREES[0] ?? 0, delta: 360 }
  )

  return {
    ...closest,
    snapped: closest.delta <= ANGLE_SNAP_THRESHOLD_DEG,
  }
}

export function edgeAngle(start: Point, end: Point): number {
  return normalizeAngle(
    radiansToDegrees(Math.atan2(end.y - start.y, end.x - start.x))
  )
}

export function isNearlyParallel(
  angleA: number,
  angleB: number,
  thresholdDeg: number
): boolean {
  const delta = Math.abs(normalizeAngle(angleA - angleB))
  const parallelDelta = Math.min(delta, 360 - delta, Math.abs(delta - 180))
  return parallelDelta <= thresholdDeg
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function lineAngle(a: Point, b: Point): number {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
}

export function isEdgeAttached(
  p1: Point,
  p2: Point,
  houseAttachY: number,
  thresholdPx = 4
): boolean {
  return (
    Math.abs(p1.y - houseAttachY) <= thresholdPx &&
    Math.abs(p2.y - houseAttachY) <= thresholdPx
  )
}
