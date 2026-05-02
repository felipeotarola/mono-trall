export const materialUnits = [
  "metre",
  "linear_metre",
  "square_metre",
  "piece",
  "box",
  "pack",
] as const

export type MaterialUnit = (typeof materialUnits)[number]

export type MaterialRecord = {
  id: string
  name: string
  category: string
  unit: MaterialUnit
  cost: number
  thickness_mm: number | null
  width_mm: number | null
  length_mm: number | null
  image_url: string | null
  description: string | null
  created_by: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export type MaterialInput = {
  name: string
  category: string
  unit: MaterialUnit
  cost: number
  thickness_mm?: number | null
  width_mm?: number | null
  length_mm?: number | null
  image_url?: string | null
  description?: string | null
}

export type ProjectMaterialRecord = {
  project_id: string
  material_id: string
  quantity: number
  created_at: string
  updated_at: string
}

export type ProjectMaterialItem = ProjectMaterialRecord & {
  material: MaterialRecord
}

export type MaterialTotals = {
  totalCost: number
  totalQuantity: number
  quantityByUnit: Record<MaterialUnit, number>
}

export const emptyMaterialTotals: MaterialTotals = {
  totalCost: 0,
  totalQuantity: 0,
  quantityByUnit: {
    metre: 0,
    linear_metre: 0,
    square_metre: 0,
    piece: 0,
    box: 0,
    pack: 0,
  },
}

export const materialUnitLabels: Record<MaterialUnit, string> = {
  metre: "m",
  linear_metre: "lpm",
  square_metre: "m2",
  piece: "pcs",
  box: "boxes",
  pack: "packs",
}

export function isMaterialUnit(value: string): value is MaterialUnit {
  return materialUnits.includes(value as MaterialUnit)
}

export function normalizeMaterialInput(input: MaterialInput): MaterialInput {
  return {
    name: input.name.trim(),
    category: input.category.trim(),
    unit: input.unit,
    cost: roundCurrency(Math.max(0, input.cost)),
    thickness_mm: normalizePositiveDimension(input.thickness_mm),
    width_mm: normalizePositiveDimension(input.width_mm),
    length_mm: normalizePositiveDimension(input.length_mm),
    image_url: normalizeOptionalUrl(input.image_url),
    description: input.description?.trim() || null,
  }
}

export function parseMaterialInputBody(
  body: unknown
): { input: MaterialInput } | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Material payload is required" }
  }

  const record = body as Record<string, unknown>
  const name = typeof record.name === "string" ? record.name : ""
  const category = typeof record.category === "string" ? record.category : ""
  const unit = typeof record.unit === "string" ? record.unit : ""
  const cost =
    typeof record.cost === "number"
      ? record.cost
      : Number.parseFloat(String(record.cost ?? ""))
  const description =
    typeof record.description === "string" ? record.description : null
  const thicknessMm = parseOptionalDimension(record.thickness_mm)
  const widthMm = parseOptionalDimension(record.width_mm)
  const lengthMm = parseOptionalDimension(record.length_mm)
  const imageUrl =
    typeof record.image_url === "string" ? record.image_url.trim() : null

  if (!name.trim()) {
    return { error: "Material name is required" }
  }

  if (!category.trim()) {
    return { error: "Material category is required" }
  }

  if (!isMaterialUnit(unit)) {
    return { error: "Material unit is invalid" }
  }

  if (!Number.isFinite(cost) || cost < 0) {
    return { error: "Material cost must be a positive number" }
  }

  if (thicknessMm === false || widthMm === false || lengthMm === false) {
    return { error: "Material dimensions must be positive numbers" }
  }

  return {
    input: normalizeMaterialInput({
      name,
      category,
      unit,
      cost,
      thickness_mm: thicknessMm,
      width_mm: widthMm,
      length_mm: lengthMm,
      image_url: imageUrl,
      description,
    }),
  }
}

export function parseProjectMaterialQuantity(value: unknown) {
  const quantity =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? ""))

  if (!Number.isFinite(quantity) || quantity < 0) {
    return null
  }

  return quantity
}

export function getProjectMaterialLineTotal(item: ProjectMaterialItem) {
  return roundCurrency(item.quantity * item.material.cost)
}

export function getDeckingLinearMetres({
  areaM2,
  wasteFactor = 0.1,
  widthMm,
}: {
  areaM2: number
  wasteFactor?: number
  widthMm: number | null | undefined
}) {
  if (!widthMm || widthMm <= 0 || areaM2 <= 0) {
    return null
  }

  return roundQuantity((areaM2 / (widthMm / 1000)) * (1 + wasteFactor))
}

export function getPiecesForLinearMetres({
  lengthMm,
  linearMetres,
}: {
  lengthMm: number | null | undefined
  linearMetres: number
}) {
  if (!lengthMm || lengthMm <= 0 || linearMetres <= 0) {
    return null
  }

  return Math.ceil(linearMetres / (lengthMm / 1000))
}

export function getMaterialDimensionsLabel(material: {
  thickness_mm?: number | null
  width_mm?: number | null
  length_mm?: number | null
}) {
  const dimensions = [
    material.thickness_mm,
    material.width_mm,
    material.length_mm,
  ].filter((dimension): dimension is number => typeof dimension === "number")

  if (dimensions.length === 0) {
    return null
  }

  return `${dimensions.map(formatDimension).join(" x ")} mm`
}

export function getProjectMaterialTotals(
  items: ProjectMaterialItem[]
): MaterialTotals {
  return items.reduce<MaterialTotals>(
    (totals, item) => {
      const quantity = Math.max(0, item.quantity)

      return {
        totalCost: roundCurrency(
          totals.totalCost + quantity * item.material.cost
        ),
        totalQuantity: totals.totalQuantity + quantity,
        quantityByUnit: {
          ...totals.quantityByUnit,
          [item.material.unit]:
            totals.quantityByUnit[item.material.unit] + quantity,
        },
      }
    },
    {
      totalCost: 0,
      totalQuantity: 0,
      quantityByUnit: { ...emptyMaterialTotals.quantityByUnit },
    }
  )
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function roundQuantity(value: number) {
  return Math.round((value + Number.EPSILON) * 10) / 10
}

function formatDimension(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function normalizePositiveDimension(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null
  }

  return value > 0 ? Math.round(value * 10) / 10 : null
}

function normalizeOptionalUrl(value: string | null | undefined) {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return null
  }

  return trimmedValue
}

function parseOptionalDimension(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const dimension =
    typeof value === "number" ? value : Number.parseFloat(String(value))

  if (!Number.isFinite(dimension) || dimension <= 0) {
    return false
  }

  return dimension
}
