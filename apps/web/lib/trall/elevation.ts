export type ElevationSettings = {
  reference: {
    label: "house_threshold"
    heightCm: number
  }
  deck: {
    finishedHeightCm: number
    thicknessCm: number
  }
  pool: {
    topHeightCm: number
    bodyHeightCm: number
  }
  terrain: {
    mode: "flat" | "single_slope"
    heightAtHouseCm: number
    heightAtFarEdgeCm: number
    slopeDirectionDeg: number
  }
  supports: {
    showPosts: boolean
    maxPostSpacingM: number
  }
  visualization: {
    showHeightMarkers: boolean
    showPoolExcavation: boolean
  }
}

export type TerrainBounds = {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export type TerrainPoint = {
  x: number
  z: number
}

export function cmToM(cm: number) {
  return cm / 100
}

export function mToCm(m: number) {
  return m * 100
}

export function getDefaultElevationSettings(): ElevationSettings {
  return {
    reference: {
      label: "house_threshold",
      heightCm: 0,
    },
    deck: {
      finishedHeightCm: 0,
      thicknessCm: 18,
    },
    pool: {
      topHeightCm: -40,
      bodyHeightCm: 120,
    },
    terrain: {
      mode: "single_slope",
      heightAtHouseCm: -40,
      heightAtFarEdgeCm: -120,
      slopeDirectionDeg: 90,
    },
    supports: {
      showPosts: true,
      maxPostSpacingM: 2,
    },
    visualization: {
      showHeightMarkers: true,
      showPoolExcavation: true,
    },
  }
}

export function normalizeElevationSettings(input: unknown): ElevationSettings {
  const defaults = getDefaultElevationSettings()
  if (!input || typeof input !== "object") {
    return defaults
  }

  const candidate = input as Partial<ElevationSettings>

  return {
    reference: {
      label: "house_threshold",
      heightCm: readNumber(
        candidate.reference?.heightCm,
        defaults.reference.heightCm
      ),
    },
    deck: {
      finishedHeightCm: readNumber(
        candidate.deck?.finishedHeightCm,
        defaults.deck.finishedHeightCm
      ),
      thicknessCm: clamp(
        readNumber(candidate.deck?.thicknessCm, defaults.deck.thicknessCm),
        8,
        60
      ),
    },
    pool: {
      topHeightCm: readNumber(
        candidate.pool?.topHeightCm,
        defaults.pool.topHeightCm
      ),
      bodyHeightCm: clamp(
        readNumber(candidate.pool?.bodyHeightCm, defaults.pool.bodyHeightCm),
        20,
        250
      ),
    },
    terrain: {
      mode:
        candidate.terrain?.mode === "flat" ||
        candidate.terrain?.mode === "single_slope"
          ? candidate.terrain.mode
          : defaults.terrain.mode,
      heightAtHouseCm: readNumber(
        candidate.terrain?.heightAtHouseCm,
        defaults.terrain.heightAtHouseCm
      ),
      heightAtFarEdgeCm: readNumber(
        candidate.terrain?.heightAtFarEdgeCm,
        defaults.terrain.heightAtFarEdgeCm
      ),
      slopeDirectionDeg: normalizeAngle(
        readNumber(
          candidate.terrain?.slopeDirectionDeg,
          defaults.terrain.slopeDirectionDeg
        )
      ),
    },
    supports: {
      showPosts:
        typeof candidate.supports?.showPosts === "boolean"
          ? candidate.supports.showPosts
          : defaults.supports.showPosts,
      maxPostSpacingM: clamp(
        readNumber(
          candidate.supports?.maxPostSpacingM,
          defaults.supports.maxPostSpacingM
        ),
        0.8,
        5
      ),
    },
    visualization: {
      showHeightMarkers:
        typeof candidate.visualization?.showHeightMarkers === "boolean"
          ? candidate.visualization.showHeightMarkers
          : defaults.visualization.showHeightMarkers,
      showPoolExcavation:
        typeof candidate.visualization?.showPoolExcavation === "boolean"
          ? candidate.visualization.showPoolExcavation
          : defaults.visualization.showPoolExcavation,
    },
  }
}

export function getTerrainHeightAt(
  point: TerrainPoint,
  terrain: ElevationSettings["terrain"],
  bounds: TerrainBounds
) {
  if (terrain.mode === "flat") {
    return cmToM(terrain.heightAtHouseCm)
  }

  const directionRad = (terrain.slopeDirectionDeg * Math.PI) / 180
  const axis = {
    x: Math.cos(directionRad),
    z: Math.sin(directionRad),
  }
  const corners = [
    { x: bounds.minX, z: bounds.minZ },
    { x: bounds.maxX, z: bounds.minZ },
    { x: bounds.maxX, z: bounds.maxZ },
    { x: bounds.minX, z: bounds.maxZ },
  ]
  const projections = corners.map((corner) => corner.x * axis.x + corner.z * axis.z)
  const minProjection = Math.min(...projections)
  const maxProjection = Math.max(...projections)
  const range = maxProjection - minProjection || 1
  const pointProjection = point.x * axis.x + point.z * axis.z
  const t = clamp((pointProjection - minProjection) / range, 0, 1)

  return cmToM(
    terrain.heightAtHouseCm +
      (terrain.heightAtFarEdgeCm - terrain.heightAtHouseCm) * t
  )
}

function readNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function normalizeAngle(deg: number) {
  return ((deg % 360) + 360) % 360
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
