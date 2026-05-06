import type { FeaturePlacementType } from "@/lib/trall/features"
import type { ActiveTool } from "@/lib/trall/types"

export function getModeLabel(
  activeTool: ActiveTool,
  placementMode: FeaturePlacementType | null
) {
  if (placementMode === "stairs") {
    return "Placing stairs"
  }

  if (placementMode === "railing") {
    return "Placing fence"
  }

  if (placementMode === "pergola") {
    return "Placing pergola"
  }

  if (placementMode === "privacyScreen") {
    return "Placing privacy screen"
  }

  if (
    placementMode === "siteTree" ||
    placementMode === "siteBush" ||
    placementMode === "sitePlanter" ||
    placementMode === "siteLight"
  ) {
    return "Placing landscape"
  }

  if (placementMode === "boardDirection") {
    return "Board direction"
  }

  if (activeTool === "draw") {
    return "Rita"
  }

  if (activeTool === "measure") {
    return "Mät"
  }

  if (activeTool === "pan") {
    return "Panorera"
  }

  return "Välj"
}
