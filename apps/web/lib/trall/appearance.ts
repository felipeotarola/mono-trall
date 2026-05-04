export type RenderMode = "construction" | "realistic"

export type DeckMaterialId = "treated_wood" | "cedar" | "grey_composite"
export type HouseWallMaterialId = "light_plaster" | "timber_siding" | "brick"
export type RoofMaterialId = "dark_metal" | "red_tile" | "roofing_felt"
export type PoolWallMaterialId = "white_liner" | "blue_tile" | "concrete"
export type TerrainMaterialId = "soil" | "grass" | "gravel"

export type AppearanceSettings = {
  renderMode: RenderMode
  deckMaterial: DeckMaterialId
  houseWallMaterial: HouseWallMaterialId
  roofMaterial: RoofMaterialId
  poolWallMaterial: PoolWallMaterialId
  terrainMaterial: TerrainMaterialId
}

export const deckMaterialOptions = [
  { value: "treated_wood", label: "Treated wood" },
  { value: "cedar", label: "Warm cedar" },
  { value: "grey_composite", label: "Grey composite" },
] as const satisfies ReadonlyArray<{ value: DeckMaterialId; label: string }>

export const houseWallMaterialOptions = [
  { value: "light_plaster", label: "Light plaster" },
  { value: "timber_siding", label: "Timber siding" },
  { value: "brick", label: "Brick" },
] as const satisfies ReadonlyArray<{ value: HouseWallMaterialId; label: string }>

export const roofMaterialOptions = [
  { value: "dark_metal", label: "Dark metal" },
  { value: "red_tile", label: "Red tile" },
  { value: "roofing_felt", label: "Roofing felt" },
] as const satisfies ReadonlyArray<{ value: RoofMaterialId; label: string }>

export const poolWallMaterialOptions = [
  { value: "white_liner", label: "White liner" },
  { value: "blue_tile", label: "Blue tile" },
  { value: "concrete", label: "Concrete" },
] as const satisfies ReadonlyArray<{ value: PoolWallMaterialId; label: string }>

export const terrainMaterialOptions = [
  { value: "soil", label: "Soil" },
  { value: "grass", label: "Grass" },
  { value: "gravel", label: "Gravel" },
] as const satisfies ReadonlyArray<{ value: TerrainMaterialId; label: string }>

export function getDefaultAppearanceSettings(): AppearanceSettings {
  return {
    renderMode: "construction",
    deckMaterial: "treated_wood",
    houseWallMaterial: "light_plaster",
    roofMaterial: "dark_metal",
    poolWallMaterial: "white_liner",
    terrainMaterial: "soil",
  }
}

export function normalizeAppearanceSettings(input: unknown): AppearanceSettings {
  const defaults = getDefaultAppearanceSettings()
  if (!input || typeof input !== "object") {
    return defaults
  }

  const candidate = input as Partial<AppearanceSettings>

  return {
    renderMode:
      candidate.renderMode === "realistic" ||
      candidate.renderMode === "construction"
        ? candidate.renderMode
        : defaults.renderMode,
    deckMaterial: getOptionValue(
      candidate.deckMaterial,
      deckMaterialOptions,
      defaults.deckMaterial
    ),
    houseWallMaterial: getOptionValue(
      candidate.houseWallMaterial,
      houseWallMaterialOptions,
      defaults.houseWallMaterial
    ),
    roofMaterial: getOptionValue(
      candidate.roofMaterial,
      roofMaterialOptions,
      defaults.roofMaterial
    ),
    poolWallMaterial: getOptionValue(
      candidate.poolWallMaterial,
      poolWallMaterialOptions,
      defaults.poolWallMaterial
    ),
    terrainMaterial: getOptionValue(
      candidate.terrainMaterial,
      terrainMaterialOptions,
      defaults.terrainMaterial
    ),
  }
}

function getOptionValue<T extends string>(
  value: unknown,
  options: ReadonlyArray<{ value: T }>,
  fallback: T
) {
  return options.some((option) => option.value === value) ? (value as T) : fallback
}
