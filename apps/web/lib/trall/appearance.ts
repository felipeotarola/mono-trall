export type RenderMode = "construction" | "realistic"

export type DeckMaterialId = "treated_wood" | "cedar" | "grey_composite"
export type HouseWallMaterialId =
  | "light_plaster"
  | "painted_wood"
  | "timber_siding"
  | "concrete"
  | "brick"
export type RoofMaterialId = "dark_metal" | "red_tile" | "roofing_felt"
export type PoolWallMaterialId = "white_liner" | "blue_tile" | "concrete"
export type TerrainMaterialId = "soil" | "grass" | "gravel"

export type AppearanceSettings = {
  renderMode: RenderMode
  deckMaterial: DeckMaterialId
  houseWallMaterial: HouseWallMaterialId
  houseWallColor: string
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
  { value: "painted_wood", label: "Painted wood" },
  { value: "timber_siding", label: "Timber siding" },
  { value: "concrete", label: "Concrete" },
  { value: "brick", label: "Brick" },
] as const satisfies ReadonlyArray<{
  value: HouseWallMaterialId
  label: string
}>

export const houseWallColorPresets = [
  { value: "#ddd8d0", label: "Warm white" },
  { value: "#f3f0e8", label: "White" },
  { value: "#b8b6ad", label: "Concrete grey" },
  { value: "#c09668", label: "Natural wood" },
  { value: "#8f2f24", label: "Falu red" },
  { value: "#2f3437", label: "Charcoal" },
] as const satisfies ReadonlyArray<{ value: string; label: string }>

export function getDefaultHouseWallColor(
  material: HouseWallMaterialId
): string {
  return {
    light_plaster: "#ddd8d0",
    painted_wood: "#f3f0e8",
    timber_siding: "#c09668",
    concrete: "#b8b6ad",
    brick: "#ad6750",
  }[material]
}

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
    houseWallColor: getDefaultHouseWallColor("light_plaster"),
    roofMaterial: "dark_metal",
    poolWallMaterial: "white_liner",
    terrainMaterial: "soil",
  }
}

export function normalizeAppearanceSettings(
  input: unknown
): AppearanceSettings {
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
    houseWallColor: normalizeHexColor(
      candidate.houseWallColor,
      defaults.houseWallColor
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

function normalizeHexColor(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback
  }

  const trimmed = value.trim()
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : fallback
}

function getOptionValue<T extends string>(
  value: unknown,
  options: ReadonlyArray<{ value: T }>,
  fallback: T
) {
  return options.some((option) => option.value === value)
    ? (value as T)
    : fallback
}
