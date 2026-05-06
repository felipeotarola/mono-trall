import type { Dispatch, SetStateAction } from "react"

import {
  normalizeElevationSettings,
  type ElevationSettings,
} from "@/lib/trall/elevation"

export type ElevationNumberPath =
  | "deck.finishedHeightCm"
  | "deck.thicknessCm"
  | "pool.topHeightCm"
  | "pool.bodyHeightCm"
  | "terrain.heightAtHouseCm"
  | "terrain.heightAtFarEdgeCm"
  | "terrain.slopeDirectionDeg"
  | "supports.maxPostSpacingM"

export function useElevationSettingsForm({
  elevationSettings,
  setElevationSettings,
}: {
  elevationSettings: ElevationSettings
  setElevationSettings: Dispatch<SetStateAction<ElevationSettings>>
}) {
  const normalizedElevationSettings =
    normalizeElevationSettings(elevationSettings)

  function updateNumber(path: ElevationNumberPath, value: string) {
    const numericValue = Number.parseFloat(value)
    if (!Number.isFinite(numericValue)) {
      return
    }

    setElevationSettings((current) =>
      setElevationNumber(current, path, numericValue)
    )
  }

  function updateTerrainMode(value: string) {
    setElevationSettings((current) => {
      const normalized = normalizeElevationSettings(current)

      return {
        ...normalized,
        terrain: {
          ...normalized.terrain,
          mode: value === "flat" ? "flat" : "single_slope",
        },
      }
    })
  }

  function updateShowPosts(checked: boolean) {
    setElevationSettings((current) => {
      const normalized = normalizeElevationSettings(current)

      return {
        ...normalized,
        supports: {
          ...normalized.supports,
          showPosts: checked,
        },
      }
    })
  }

  function updateShowHeightMarkers(checked: boolean) {
    setElevationSettings((current) => {
      const normalized = normalizeElevationSettings(current)

      return {
        ...normalized,
        visualization: {
          ...normalized.visualization,
          showHeightMarkers: checked,
        },
      }
    })
  }

  function updateShowPoolExcavation(checked: boolean) {
    setElevationSettings((current) => {
      const normalized = normalizeElevationSettings(current)

      return {
        ...normalized,
        visualization: {
          ...normalized.visualization,
          showPoolExcavation: checked,
        },
      }
    })
  }

  return {
    normalizedElevationSettings,
    updateNumber,
    updateShowHeightMarkers,
    updateShowPoolExcavation,
    updateShowPosts,
    updateTerrainMode,
  }
}

function setElevationNumber(
  current: ElevationSettings,
  path: ElevationNumberPath,
  value: number
): ElevationSettings {
  const normalized = normalizeElevationSettings(current)

  if (path === "deck.finishedHeightCm") {
    return {
      ...normalized,
      deck: { ...normalized.deck, finishedHeightCm: value },
    }
  }
  if (path === "deck.thicknessCm") {
    return { ...normalized, deck: { ...normalized.deck, thicknessCm: value } }
  }
  if (path === "pool.topHeightCm") {
    return { ...normalized, pool: { ...normalized.pool, topHeightCm: value } }
  }
  if (path === "pool.bodyHeightCm") {
    return { ...normalized, pool: { ...normalized.pool, bodyHeightCm: value } }
  }
  if (path === "terrain.heightAtHouseCm") {
    return {
      ...normalized,
      terrain: { ...normalized.terrain, heightAtHouseCm: value },
    }
  }
  if (path === "terrain.heightAtFarEdgeCm") {
    return {
      ...normalized,
      terrain: { ...normalized.terrain, heightAtFarEdgeCm: value },
    }
  }
  if (path === "terrain.slopeDirectionDeg") {
    return {
      ...normalized,
      terrain: { ...normalized.terrain, slopeDirectionDeg: value },
    }
  }

  return {
    ...normalized,
    supports: { ...normalized.supports, maxPostSpacingM: value },
  }
}
