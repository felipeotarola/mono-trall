import { getTerrainHeightAt } from "@/lib/trall/elevation"
import type { Plan3DModel } from "@/lib/trall/plan-3d"
import { PLAN_3D_LAYERS } from "@/lib/trall/plan-3d-layers"

export function validatePlan3DPlacement(model: Plan3DModel) {
  if (
    typeof window === "undefined" ||
    !["localhost", "127.0.0.1"].includes(window.location.hostname)
  ) {
    return
  }

  const deckTopY = model.elevation.deckFinishedY
  const deckBottomY = deckTopY - model.elevation.deckThicknessM
  const warnings: string[] = []

  for (const post of model.supportPosts) {
    if (post.terrainY >= post.deckBottomY - PLAN_3D_LAYERS.renderEpsilonM) {
      warnings.push(`support ${post.id} has no clearance below deck`)
    }
  }

  for (const stairs of model.stairs) {
    if (stairs.totalHeightM <= PLAN_3D_LAYERS.surfaceLiftM) {
      warnings.push(`stairs ${stairs.id} has near-zero height`)
    }
  }

  for (const point of model.deckPoints) {
    const terrainY = getTerrainHeightAt(
      point,
      model.elevation.settings.terrain,
      model.elevation.terrainBounds
    )
    if (terrainY > deckBottomY - PLAN_3D_LAYERS.surfaceLiftM) {
      warnings.push("terrain is close to or above deck underside")
      break
    }
  }

  if (warnings.length > 0) {
    console.warn("[Plan3D placement]", [...new Set(warnings)])
  }
}
