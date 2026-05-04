import { PIXELS_PER_METER } from "./constants.ts"
import type {
  HouseBounds,
  HouseDoor,
  HouseModel,
  HouseWindow,
} from "./types.ts"

export const DEFAULT_HOUSE_WINDOW_WIDTH_CM = 120
export const DEFAULT_HOUSE_WINDOW_HEIGHT_CM = 120
export const MIN_HOUSE_WINDOW_WIDTH_CM = 30
export const MAX_HOUSE_WINDOW_WIDTH_CM = 300
export const MIN_HOUSE_WINDOW_HEIGHT_CM = 30
export const MAX_HOUSE_WINDOW_HEIGHT_CM = 240
export const DEFAULT_HOUSE_DOOR_WIDTH_CM = 90
export const DEFAULT_HOUSE_DOOR_HEIGHT_CM = 210
export const MIN_HOUSE_DOOR_WIDTH_CM = 60
export const MAX_HOUSE_DOOR_WIDTH_CM = 240
export const MIN_HOUSE_DOOR_HEIGHT_CM = 180
export const MAX_HOUSE_DOOR_HEIGHT_CM = 260

export function getHouseBounds(house: HouseModel): HouseBounds {
  const widthPx = house.widthM * PIXELS_PER_METER
  const depthPx = house.depthM * PIXELS_PER_METER

  return {
    left: house.centerX - widthPx / 2,
    right: house.centerX + widthPx / 2,
    top: house.topY,
    bottom: house.topY + depthPx,
    centerX: house.centerX,
    widthPx,
    depthPx,
  }
}

export function getHouseAttachEdge(houseBounds: HouseBounds): {
  y: number
  x1: number
  x2: number
} {
  return {
    y: houseBounds.bottom,
    x1: houseBounds.left,
    x2: houseBounds.right,
  }
}

export function getHouseDoors(house: HouseModel): HouseDoor[] {
  if (house.doors) {
    return house.doors.map(normalizeHouseDoor)
  }

  return [createDefaultHouseDoor("door-1", house.doorOffsetM ?? 0)]
}

export function getHouseWindows(house: HouseModel): HouseWindow[] {
  if (house.windows) {
    return house.windows.map(normalizeHouseWindow)
  }

  return [
    createDefaultHouseWindow("window-1", -house.widthM * 0.3, "upper"),
    createDefaultHouseWindow("window-2", house.widthM * 0.3, "upper"),
    createDefaultHouseWindow("window-3", -house.widthM * 0.3, "lower"),
    createDefaultHouseWindow("window-4", house.widthM * 0.3, "lower"),
  ]
}

export function createDefaultHouseWindow(
  id: string,
  offsetM: number,
  row: HouseWindow["row"]
): HouseWindow {
  return {
    id,
    offsetM,
    row,
    widthCm: DEFAULT_HOUSE_WINDOW_WIDTH_CM,
    heightCm: DEFAULT_HOUSE_WINDOW_HEIGHT_CM,
  }
}

export function createDefaultHouseDoor(id: string, offsetM: number): HouseDoor {
  return {
    id,
    offsetM,
    widthCm: DEFAULT_HOUSE_DOOR_WIDTH_CM,
    heightCm: DEFAULT_HOUSE_DOOR_HEIGHT_CM,
  }
}

export function normalizeHouseDoor(door: HouseDoor): HouseDoor {
  return {
    ...door,
    widthCm: normalizeOpeningDimensionCm(
      door.widthCm,
      DEFAULT_HOUSE_DOOR_WIDTH_CM,
      MIN_HOUSE_DOOR_WIDTH_CM,
      MAX_HOUSE_DOOR_WIDTH_CM
    ),
    heightCm: normalizeOpeningDimensionCm(
      door.heightCm,
      DEFAULT_HOUSE_DOOR_HEIGHT_CM,
      MIN_HOUSE_DOOR_HEIGHT_CM,
      MAX_HOUSE_DOOR_HEIGHT_CM
    ),
  }
}

export function normalizeHouseWindow(window: HouseWindow): HouseWindow {
  return {
    ...window,
    row: window.row === "upper" ? "upper" : "lower",
    widthCm: normalizeOpeningDimensionCm(
      window.widthCm,
      DEFAULT_HOUSE_WINDOW_WIDTH_CM,
      MIN_HOUSE_WINDOW_WIDTH_CM,
      MAX_HOUSE_WINDOW_WIDTH_CM
    ),
    heightCm: normalizeOpeningDimensionCm(
      window.heightCm,
      DEFAULT_HOUSE_WINDOW_HEIGHT_CM,
      MIN_HOUSE_WINDOW_HEIGHT_CM,
      MAX_HOUSE_WINDOW_HEIGHT_CM
    ),
  }
}

function normalizeOpeningDimensionCm(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback
  }

  return Math.min(Math.max(value, min), max)
}
