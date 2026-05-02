import { PIXELS_PER_METER } from "./constants"
import type { HouseBounds, HouseDoor, HouseModel, HouseWindow } from "./types"

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
  if (house.doors && house.doors.length > 0) {
    return house.doors
  }

  return [{ id: "door-1", offsetM: house.doorOffsetM ?? 0 }]
}

export function getHouseWindows(house: HouseModel): HouseWindow[] {
  if (house.windows) {
    return house.windows
  }

  return [
    { id: "window-1", offsetM: -house.widthM * 0.3, row: "upper" },
    { id: "window-2", offsetM: house.widthM * 0.3, row: "upper" },
    { id: "window-3", offsetM: -house.widthM * 0.3, row: "lower" },
    { id: "window-4", offsetM: house.widthM * 0.3, row: "lower" },
  ]
}
