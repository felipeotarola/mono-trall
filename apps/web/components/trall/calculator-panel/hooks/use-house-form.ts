import type { Dispatch, SetStateAction } from "react"

import { clamp } from "@/lib/trall/geometry"
import {
  MAX_HOUSE_DOOR_HEIGHT_CM,
  MAX_HOUSE_DOOR_WIDTH_CM,
  MAX_HOUSE_WINDOW_HEIGHT_CM,
  MAX_HOUSE_WINDOW_WIDTH_CM,
  MIN_HOUSE_DOOR_HEIGHT_CM,
  MIN_HOUSE_DOOR_WIDTH_CM,
  MIN_HOUSE_WINDOW_HEIGHT_CM,
  MIN_HOUSE_WINDOW_WIDTH_CM,
  createDefaultHouseDoor,
  createDefaultHouseWindow,
  getHouseDoors,
  getHouseRoofStyle,
  getHouseWindows,
} from "@/lib/trall/house"
import type {
  HouseDoor,
  HouseModel,
  HouseRoofStyle,
  HouseWindow,
} from "@/lib/trall/types"

export function useHouseForm({
  house,
  setHouse,
}: {
  house: HouseModel
  setHouse: Dispatch<SetStateAction<HouseModel>>
}) {
  const doors = getHouseDoors(house)
  const roofStyle = getHouseRoofStyle(house)
  const windows = getHouseWindows(house)
  const openingWidthM =
    doors.reduce((total, door) => total + (door.widthCm ?? 90) / 100, 0) +
    windows.reduce((total, window) => total + (window.widthCm ?? 120) / 100, 0)

  function updateHouseDimension(key: "widthM" | "depthM", value: string) {
    const numericValue = Number.parseFloat(value)
    if (!Number.isFinite(numericValue)) {
      return
    }

    const bounds = key === "widthM" ? { min: 2, max: 30 } : { min: 2, max: 20 }

    setHouse((current) => ({
      ...current,
      [key]: clamp(numericValue, bounds.min, bounds.max),
    }))
  }

  function updateRoofStyle(value: HouseRoofStyle) {
    setHouse((current) => ({
      ...current,
      roofStyle: value,
    }))
  }

  function addDoor() {
    setHouse((current) => {
      const currentDoors = getHouseDoors(current)
      const nextIndex = currentDoors.length + 1
      const offsetStepM = Math.min(1.2, current.widthM / 6)
      const rawOffsetM = (nextIndex % 2 === 0 ? 1 : -1) * offsetStepM
      const maxOffsetM = Math.max(0, current.widthM / 2 - 0.45)

      return {
        ...current,
        doors: [
          ...currentDoors,
          createDefaultHouseDoor(
            `door-${Date.now()}`,
            clamp(rawOffsetM, -maxOffsetM, maxOffsetM)
          ),
        ],
      }
    })
  }

  function updateDoor(doorId: string, updater: (door: HouseDoor) => HouseDoor) {
    setHouse((current) => ({
      ...current,
      doors: getHouseDoors(current).map((door) =>
        door.id === doorId ? updater(door) : door
      ),
    }))
  }

  function updateDoorDimension(
    doorId: string,
    key: "widthCm" | "heightCm",
    value: string
  ) {
    const numericValue = Number.parseFloat(value)
    if (!Number.isFinite(numericValue)) {
      return
    }

    const bounds =
      key === "widthCm"
        ? { min: MIN_HOUSE_DOOR_WIDTH_CM, max: MAX_HOUSE_DOOR_WIDTH_CM }
        : { min: MIN_HOUSE_DOOR_HEIGHT_CM, max: MAX_HOUSE_DOOR_HEIGHT_CM }

    updateDoor(doorId, (door) => ({
      ...door,
      [key]: clamp(numericValue, bounds.min, bounds.max),
    }))
  }

  function addWindow() {
    setHouse((current) => {
      const currentWindows = getHouseWindows(current)
      const nextIndex = currentWindows.length + 1
      const offsetStepM = Math.min(1.2, current.widthM / 6)
      const rawOffsetM = (nextIndex % 2 === 0 ? 1 : -1) * offsetStepM
      const maxOffsetM = Math.max(0, current.widthM / 2 - 0.9)

      return {
        ...current,
        windows: [
          ...currentWindows,
          createDefaultHouseWindow(
            `window-${Date.now()}`,
            clamp(rawOffsetM, -maxOffsetM, maxOffsetM),
            nextIndex % 2 === 0 ? "upper" : "lower"
          ),
        ],
      }
    })
  }

  function updateWindow(
    windowId: string,
    updater: (window: HouseWindow) => HouseWindow
  ) {
    setHouse((current) => ({
      ...current,
      windows: getHouseWindows(current).map((window) =>
        window.id === windowId ? updater(window) : window
      ),
    }))
  }

  function updateWindowDimension(
    windowId: string,
    key: "widthCm" | "heightCm",
    value: string
  ) {
    const numericValue = Number.parseFloat(value)
    if (!Number.isFinite(numericValue)) {
      return
    }

    const bounds =
      key === "widthCm"
        ? { min: MIN_HOUSE_WINDOW_WIDTH_CM, max: MAX_HOUSE_WINDOW_WIDTH_CM }
        : { min: MIN_HOUSE_WINDOW_HEIGHT_CM, max: MAX_HOUSE_WINDOW_HEIGHT_CM }

    updateWindow(windowId, (window) => ({
      ...window,
      [key]: clamp(numericValue, bounds.min, bounds.max),
    }))
  }

  function updateWindowRow(windowId: string, row: HouseWindow["row"]) {
    updateWindow(windowId, (window) => ({ ...window, row }))
  }

  function removeWindow(windowId: string) {
    setHouse((current) => ({
      ...current,
      windows: getHouseWindows(current).filter(
        (window) => window.id !== windowId
      ),
    }))
  }

  function removeDoor(doorId: string) {
    setHouse((current) => ({
      ...current,
      doors: getHouseDoors(current).filter((door) => door.id !== doorId),
    }))
  }

  return {
    addDoor,
    addWindow,
    doors,
    openingWidthM,
    removeDoor,
    removeWindow,
    roofStyle,
    updateDoorDimension,
    updateHouseDimension,
    updateRoofStyle,
    updateWindowDimension,
    updateWindowRow,
    windows,
  }
}
