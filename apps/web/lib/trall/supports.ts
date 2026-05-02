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
  holes = [],
  points,
  spacingM = 0.6,
}: {
  holes?: Point[][]
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
    const deckIntervals = getVerticalIntervals(points, x)
    const holeIntervals = holes.flatMap((hole) => getVerticalIntervals(hole, x))

    for (const [y1, y2] of subtractIntervals(deckIntervals, holeIntervals)) {
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

function getVerticalIntervals(points: Point[], x: number) {
  const intersections = getVerticalIntersections(points, x)
  const intervals: Array<[number, number]> = []

  for (let index = 0; index < intersections.length - 1; index += 2) {
    const y1 = intersections[index]
    const y2 = intersections[index + 1]

    if (y1 === undefined || y2 === undefined || y2 <= y1) {
      continue
    }

    intervals.push([y1, y2])
  }

  return intervals
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

function subtractIntervals(
  intervals: Array<[number, number]>,
  subtractingIntervals: Array<[number, number]>
) {
  return subtractingIntervals
    .sort((a, b) => a[0] - b[0])
    .reduce<Array<[number, number]>>(
      (remainingIntervals, [subtractStart, subtractEnd]) =>
        remainingIntervals.flatMap(([start, end]) => {
          if (subtractEnd <= start || subtractStart >= end) {
            return [[start, end]]
          }

          const nextIntervals: Array<[number, number]> = []
          const beforeEnd = Math.min(subtractStart, end)
          const afterStart = Math.max(subtractEnd, start)

          if (beforeEnd > start) {
            nextIntervals.push([start, beforeEnd])
          }

          if (end > afterStart) {
            nextIntervals.push([afterStart, end])
          }

          return nextIntervals
        }),
      intervals
    )
}

function roundQuantity(value: number) {
  return Math.round((value + Number.EPSILON) * 10) / 10
}
