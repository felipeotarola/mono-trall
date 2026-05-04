export const PLAN_3D_SCALE = {
  cameraNearM: 0.04,
  cameraFarMinM: 80,
  cameraFarMultiplier: 4.2,
} as const

// Mesh positions use centre anchors unless a helper explicitly says top or
// bottom. These offsets keep visible surfaces separated without changing the
// planner's construction dimensions.
export const PLAN_3D_LAYERS = {
  renderEpsilonM: 0.006,
  surfaceLiftM: 0.018,
  lineLiftM: 0.036,
  trimLiftM: 0.052,
  terrainLiftM: 0.014,
  deckAccessoryBaseLiftM: 0.018,
  supportClearanceM: 0.012,
  wallProjectionM: 0.028,
  waterBelowPoolTopM: 0.055,
  labelLiftM: 0.1,
} as const

export function centerYFromBottom(bottomY: number, heightM: number) {
  return bottomY + heightM / 2
}

export function deckAccessoryBaseY(deckTopY: number) {
  return deckTopY + PLAN_3D_LAYERS.deckAccessoryBaseLiftM
}

export function deckOverlayY(deckTopY: number) {
  return deckTopY + PLAN_3D_LAYERS.lineLiftM
}

export function terrainOverlayY(terrainY: number) {
  return terrainY + PLAN_3D_LAYERS.terrainLiftM
}
