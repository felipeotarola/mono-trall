export type ElevationSettings = {
  groundLevelCm: number
  deckHeightCm: number
  deckThicknessCm: number
  poolTopHeightCm: number
  poolDepthCm: number
  houseFloorHeightCm: number
}

export type ElevationField = keyof ElevationSettings

export type ElevationRange = {
  min: number
  max: number
}

export type PoolDeckRelationship = {
  deltaCm: number
  label: string
  status: "above" | "below" | "flush"
}

export const defaultElevationSettings: ElevationSettings = {
  groundLevelCm: 0,
  deckHeightCm: 45,
  deckThicknessCm: 14,
  poolTopHeightCm: 60,
  poolDepthCm: 120,
  houseFloorHeightCm: 45,
}

export const elevationRanges = {
  groundLevelCm: { min: -100, max: 100 },
  deckHeightCm: { min: 0, max: 200 },
  deckThicknessCm: { min: 1, max: 60 },
  poolTopHeightCm: { min: 0, max: 200 },
  poolDepthCm: { min: 20, max: 250 },
  houseFloorHeightCm: { min: 0, max: 200 },
} satisfies Record<ElevationField, ElevationRange>

export function clampElevationValue(field: ElevationField, value: number) {
  const range = elevationRanges[field]

  return Math.min(range.max, Math.max(range.min, Math.round(value)))
}

export function updateElevationSetting(
  current: ElevationSettings,
  field: ElevationField,
  value: number
): ElevationSettings {
  return {
    ...current,
    [field]: clampElevationValue(field, value),
  }
}

export function normalizeElevationSettings(
  value: unknown
): ElevationSettings {
  if (!value || typeof value !== "object") {
    return defaultElevationSettings
  }

  const partial = value as Partial<Record<ElevationField, unknown>>

  return {
    groundLevelCm: readElevationValue(partial, "groundLevelCm"),
    deckHeightCm: readElevationValue(partial, "deckHeightCm"),
    deckThicknessCm: readElevationValue(partial, "deckThicknessCm"),
    poolTopHeightCm: readElevationValue(partial, "poolTopHeightCm"),
    poolDepthCm: readElevationValue(partial, "poolDepthCm"),
    houseFloorHeightCm: readElevationValue(partial, "houseFloorHeightCm"),
  }
}

export function getPoolDeckRelationship(
  settings: ElevationSettings
): PoolDeckRelationship {
  const deltaCm = settings.poolTopHeightCm - settings.deckHeightCm

  if (Math.abs(deltaCm) <= 1) {
    return {
      deltaCm,
      label: "Pool is flush with deck",
      status: "flush",
    }
  }

  if (deltaCm > 0) {
    return {
      deltaCm,
      label: `Pool is ${Math.abs(deltaCm)} cm above deck`,
      status: "above",
    }
  }

  return {
    deltaCm,
    label: `Pool is ${Math.abs(deltaCm)} cm below deck`,
    status: "below",
  }
}

function readElevationValue(
  partial: Partial<Record<ElevationField, unknown>>,
  field: ElevationField
) {
  const value = partial[field]

  return clampElevationValue(
    field,
    typeof value === "number" && Number.isFinite(value)
      ? value
      : defaultElevationSettings[field]
  )
}
