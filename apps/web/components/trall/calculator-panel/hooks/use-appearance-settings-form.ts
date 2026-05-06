import type { Dispatch, SetStateAction } from "react"

import {
  normalizeElevationSettings,
  type ElevationSettings,
} from "@/lib/trall/elevation"
import {
  getDefaultHouseWallColor,
  type AppearanceSettings,
} from "@/lib/trall/appearance"

export function useAppearanceSettingsForm({
  elevationSettings,
  setElevationSettings,
}: {
  elevationSettings: ElevationSettings
  setElevationSettings: Dispatch<SetStateAction<ElevationSettings>>
}) {
  const normalizedElevationSettings =
    normalizeElevationSettings(elevationSettings)
  const appearance = normalizedElevationSettings.appearance

  function updateAppearance<Key extends keyof AppearanceSettings>(
    key: Key,
    value: AppearanceSettings[Key]
  ) {
    setElevationSettings((current) => {
      const normalized = normalizeElevationSettings(current)

      return {
        ...normalized,
        appearance: {
          ...normalized.appearance,
          [key]: value,
        },
      }
    })
  }

  function updateHouseWallMaterial(
    value: AppearanceSettings["houseWallMaterial"]
  ) {
    setElevationSettings((current) => {
      const normalized = normalizeElevationSettings(current)

      return {
        ...normalized,
        appearance: {
          ...normalized.appearance,
          houseWallMaterial: value,
          houseWallColor: getDefaultHouseWallColor(value),
        },
      }
    })
  }

  return {
    appearance,
    updateAppearance,
    updateHouseWallMaterial,
  }
}
