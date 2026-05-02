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
  linear_metre: "lm",
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

  return {
    input: normalizeMaterialInput({
      name,
      category,
      unit,
      cost,
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
