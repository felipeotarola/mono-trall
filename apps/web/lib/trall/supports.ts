import { PIXELS_PER_METER } from "./constants.ts"
import type { Point } from "./types.ts"

export type SupportSegment = {
  x1: number
  y1: number
  x2: number
  y2: number
  lengthM: number
}

export type SupportLayout = {
  spacingM: number
  totalLengthM: number
  segments: SupportSegment[]
}

export function getSupportLayout({
  points,
  spacingM = 0.6,
}: {
  points: Point[]
  spacingM?: number
}): SupportLayout {
  if (points.length < 3 || spacingM <= 0) {
    return { spacingM, totalLengthM: 0, segments: [] }
  }

  const spacingPx = spacingM * PIXELS_PER_METER
  const minX = Math.min(...points.map((point) => point.x))
  const maxX = Math.max(...points.map((point) => point.x))
  const segments: SupportSegment[] = []

  for (let x = minX + spacingPx / 2; x < maxX; x += spacingPx) {
    const intersections = getVerticalIntersections(points, x)

    for (let index = 0; index < intersections.length - 1; index += 2) {
      const y1 = intersections[index]
      const y2 = intersections[index + 1]

      if (y1 === undefined || y2 === undefined || y2 <= y1) {
        continue
      }

      segments.push({
        x1: x,
        y1,
        x2: x,
        y2,
        lengthM: (y2 - y1) / PIXELS_PER_METER,
      })
    }
  }

  return {
    spacingM,
    totalLengthM: roundQuantity(
      segments.reduce((sum, segment) => sum + segment.lengthM, 0)
    ),
    segments,
  }
}

function getVerticalIntersections(points: Point[], x: number) {
  const intersections: number[] = []

  points.forEach((point, index) => {
    const nextPoint = points[(index + 1) % points.length]
    if (!nextPoint || point.x === nextPoint.x) {
      return
    }

    const minX = Math.min(point.x, nextPoint.x)
    const maxX = Math.max(point.x, nextPoint.x)
    if (x < minX || x >= maxX) {
      return
    }

    const progress = (x - point.x) / (nextPoint.x - point.x)
    intersections.push(point.y + progress * (nextPoint.y - point.y))
  })

  return intersections.sort((a, b) => a - b)
}

function roundQuantity(value: number) {
  return Math.round((value + Number.EPSILON) * 10) / 10
}
