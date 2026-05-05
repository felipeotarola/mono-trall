import { PIXELS_PER_METER } from "@/lib/trall/constants"
import { normalizeElevationSettings } from "@/lib/trall/elevation"
import type { DeckFeature, SiteObjectKind } from "@/lib/trall/features"
import { polygonArea } from "@/lib/trall/geometry"
import { getHouseDoors, getHouseRoofStyle, getHouseWindows } from "@/lib/trall/house"
import type { HouseModel, Point } from "@/lib/trall/types"

type PlanSummaryInput = {
  areaM2: number
  deckPoints: Point[]
  elevationSettings: unknown
  features: DeckFeature[]
  house: HouseModel
  poolPoints: Point[] | null
  projectName: string
}

export type AIVisualizationStyle =
  | "planning_realistic"
  | "premium_sales"
  | "evening"
  | "construction_neutral"

export type AIVisualizationAssetKind =
  | "edited"
  | "expanded"
  | "expanded_source"
  | "markup_mask"
  | "markup_source"
  | "property_reference"
  | "layout_reference"
  | "generated"

export type AIVisualizationAsset = {
  contentType: string
  kind: AIVisualizationAssetKind
  name: string
  sizeBytes: number
  url: string
}

export type AIVisualizationRecord = {
  id: string
  project_id: string
  user_id: string
  brief: string
  style: AIVisualizationStyle
  plan_summary: string
  reference_images: AIVisualizationAsset[]
  generated_images: AIVisualizationAsset[]
  created_at: string
}

export const aiVisualizationStyleOptions = [
  {
    value: "planning_realistic",
    label: "Realistic planning",
    description: "Natural daylight, practical materials, believable result.",
  },
  {
    value: "premium_sales",
    label: "Premium render",
    description: "Cleaner sales image with polished materials and lighting.",
  },
  {
    value: "evening",
    label: "Evening lights",
    description: "Warm evening mood with outdoor lighting visible.",
  },
  {
    value: "construction_neutral",
    label: "Construction neutral",
    description: "Clear build preview, less styling, more geometry clarity.",
  },
] as const satisfies ReadonlyArray<{
  value: AIVisualizationStyle
  label: string
  description: string
}>

export function buildAIPlanSummary({
  areaM2,
  deckPoints,
  elevationSettings,
  features,
  house,
  poolPoints,
  projectName,
}: PlanSummaryInput) {
  const elevation = normalizeElevationSettings(elevationSettings)
  const deckAreaM2 = areaM2 || polygonArea(deckPoints) / PIXELS_PER_METER ** 2
  const poolAreaM2 = poolPoints
    ? polygonArea(poolPoints) / PIXELS_PER_METER ** 2
    : 0
  const featureSummary = summarizeFeatures(features)
  const houseDoors = getHouseDoors(house)
  const houseWindows = getHouseWindows(house)
  const roofStyle = getHouseRoofStyle(house)

  return [
    `Project: ${projectName}`,
    `House: ${house.widthM.toFixed(1)} m wide, ${house.depthM.toFixed(1)} m deep, ${roofStyle} roof, ${houseDoors.length} door(s), ${houseWindows.length} window(s).`,
    `Deck: ${deckPoints.length}-point polygon, approximately ${deckAreaM2.toFixed(1)} m2, finished height ${elevation.deck.finishedHeightCm} cm, thickness ${elevation.deck.thicknessCm} cm.`,
    poolPoints
      ? `Pool: approximately ${poolAreaM2.toFixed(1)} m2, top height ${elevation.pool.topHeightCm} cm, body height ${elevation.pool.bodyHeightCm} cm.`
      : "Pool: none in this plan.",
    `Terrain: ${elevation.terrain.mode.replace("_", " ")}, ground near house ${elevation.terrain.heightAtHouseCm} cm, far/front ground ${elevation.terrain.heightAtFarEdgeCm} cm, slope direction ${elevation.terrain.slopeDirectionDeg} degrees.`,
    `3D appearance: deck ${elevation.appearance.deckMaterial.replaceAll("_", " ")}, house wall ${elevation.appearance.houseWallMaterial.replaceAll("_", " ")}, roof ${elevation.appearance.roofMaterial.replaceAll("_", " ")}, terrain ${elevation.appearance.terrainMaterial.replaceAll("_", " ")}.`,
    `Features: ${featureSummary || "no accessories added yet"}.`,
  ].join("\n")
}

function summarizeFeatures(features: DeckFeature[]) {
  const counts = new Map<string, number>()

  for (const feature of features) {
    const key =
      feature.type === "siteObject"
        ? getSiteObjectName(feature.kind)
        : feature.type === "railing"
          ? feature.style === "glass"
            ? "glass fence"
            : feature.style === "metal"
              ? "metal fence"
              : "wood fence"
          : feature.type

    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([label, count]) => `${count} ${label}${count === 1 ? "" : "s"}`)
    .join(", ")
}

function getSiteObjectName(kind: SiteObjectKind) {
  if (kind === "outdoorLight") {
    return "outdoor light"
  }

  return String(kind)
}
