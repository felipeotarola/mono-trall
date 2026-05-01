import {
  GRID_SIZE_PX,
  POINT_BOUNDS,
  SNAP_THRESHOLD_PX,
} from "./constants"
import { clamp } from "./geometry"
import { getHouseAttachEdge } from "./house"
import type { HouseBounds, Point, SnapType } from "./types"

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize
}

export function snapPointToGrid(point: Point): Point {
  return {
    x: snapToGrid(point.x, GRID_SIZE_PX),
    y: snapToGrid(point.y, GRID_SIZE_PX),
  }
}

export function snapPointToHouseAttachEdge(
  point: Point,
  houseBounds: HouseBounds
): {
  point: Point
  snapped: boolean
} {
  const houseAttachEdge = getHouseAttachEdge(houseBounds)
  const isNearAttachY =
    Math.abs(point.y - houseAttachEdge.y) <= SNAP_THRESHOLD_PX

  if (!isNearAttachY) {
    return { point, snapped: false }
  }

  return {
    point: {
      ...point,
      y: houseAttachEdge.y,
    },
    snapped: true,
  }
}

export function applySnap(
  point: Point,
  houseBounds: HouseBounds,
  options: { disableGrid?: boolean; preferredSnapType?: SnapType } = {}
): {
  point: Point
  snapType: SnapType
} {
  const clampedPoint = {
    x: clamp(point.x, POINT_BOUNDS.minX, POINT_BOUNDS.maxX),
    y: clamp(point.y, POINT_BOUNDS.minY, POINT_BOUNDS.maxY),
  }
  const gridPoint = options.disableGrid
    ? clampedPoint
    : snapPointToGrid(clampedPoint)
  const houseSnap = snapPointToHouseAttachEdge(gridPoint, houseBounds)
  const finalPoint = {
    x: clamp(houseSnap.point.x, POINT_BOUNDS.minX, POINT_BOUNDS.maxX),
    y: clamp(houseSnap.point.y, POINT_BOUNDS.minY, POINT_BOUNDS.maxY),
  }

  return {
    point: finalPoint,
    snapType: houseSnap.snapped
      ? "house"
      : options.preferredSnapType && options.preferredSnapType !== "none"
        ? options.preferredSnapType
        : options.disableGrid
          ? "none"
          : "grid",
  }
}
