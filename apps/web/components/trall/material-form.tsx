"use client"

import {
  materialUnitLabels,
  materialUnits,
  type MaterialInput,
  type MaterialUnit,
} from "@/lib/trall/materials"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

export type MaterialFormState = {
  name: string
  category: string
  unit: MaterialUnit
  cost: string
  thickness_mm: string
  width_mm: string
  length_mm: string
  image_url: string
  description: string
}

export const emptyMaterialForm: MaterialFormState = {
  name: "",
  category: "Decking",
  unit: "linear_metre",
  cost: "",
  thickness_mm: "",
  width_mm: "",
  length_mm: "",
  image_url: "",
  description: "",
}

export function MaterialFields({
  form,
  onChange,
}: {
  form: MaterialFormState
  onChange: (form: MaterialFormState) => void
}) {
  return (
    <div className="grid gap-2">
      <Label className="grid gap-1">
        <span className="text-xs text-muted-foreground">Name</span>
        <Input
          value={form.name}
          onChange={(event) => onChange({ ...form, name: event.target.value })}
        />
      </Label>
      <div className="grid grid-cols-2 gap-2">
        <Label className="grid gap-1">
          <span className="text-xs text-muted-foreground">Category</span>
          <Input
            value={form.category}
            onChange={(event) =>
              onChange({ ...form, category: event.target.value })
            }
          />
        </Label>
        <Label className="grid gap-1">
          <span className="text-xs text-muted-foreground">Unit</span>
          <Select
            value={form.unit}
            onValueChange={(unit: MaterialUnit) => onChange({ ...form, unit })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {materialUnits.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {materialUnitLabels[unit]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Label>
      </div>
      <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-2">
        <Label className="grid gap-1">
          <span className="text-xs text-muted-foreground">Cost</span>
          <Input
            inputMode="decimal"
            min={0}
            step={0.01}
            type="number"
            value={form.cost}
            onChange={(event) =>
              onChange({ ...form, cost: event.target.value })
            }
          />
        </Label>
        <Label className="grid gap-1">
          <span className="text-xs text-muted-foreground">Description</span>
          <Input
            value={form.description}
            onChange={(event) =>
              onChange({ ...form, description: event.target.value })
            }
          />
        </Label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Label className="grid gap-1">
          <span className="text-xs text-muted-foreground">Thickness mm</span>
          <Input
            inputMode="decimal"
            min={0}
            step={1}
            type="number"
            value={form.thickness_mm}
            onChange={(event) =>
              onChange({ ...form, thickness_mm: event.target.value })
            }
          />
        </Label>
        <Label className="grid gap-1">
          <span className="text-xs text-muted-foreground">Width mm</span>
          <Input
            inputMode="decimal"
            min={0}
            step={1}
            type="number"
            value={form.width_mm}
            onChange={(event) =>
              onChange({ ...form, width_mm: event.target.value })
            }
          />
        </Label>
        <Label className="grid gap-1">
          <span className="text-xs text-muted-foreground">Length mm</span>
          <Input
            inputMode="decimal"
            min={0}
            step={1}
            type="number"
            value={form.length_mm}
            onChange={(event) =>
              onChange({ ...form, length_mm: event.target.value })
            }
          />
        </Label>
      </div>
      <Label className="grid gap-1">
        <span className="text-xs text-muted-foreground">Image URL</span>
        <Input
          inputMode="url"
          placeholder="https://..."
          type="url"
          value={form.image_url}
          onChange={(event) =>
            onChange({ ...form, image_url: event.target.value })
          }
        />
      </Label>
    </div>
  )
}

export function toMaterialInput(form: MaterialFormState): MaterialInput | null {
  const cost = Number.parseFloat(form.cost)

  if (
    !form.name.trim() ||
    !form.category.trim() ||
    !Number.isFinite(cost) ||
    cost < 0
  ) {
    return null
  }

  return {
    name: form.name,
    category: form.category,
    unit: form.unit,
    cost,
    thickness_mm: parseOptionalDimension(form.thickness_mm),
    width_mm: parseOptionalDimension(form.width_mm),
    length_mm: parseOptionalDimension(form.length_mm),
    image_url: form.image_url,
    description: form.description,
  }
}

export function parseQuantity(value: string) {
  const quantity = Number.parseFloat(value)

  if (!Number.isFinite(quantity) || quantity < 0) {
    return null
  }

  return quantity
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong"
}

function parseOptionalDimension(value: string) {
  if (!value.trim()) {
    return null
  }

  const dimension = Number.parseFloat(value)

  if (!Number.isFinite(dimension) || dimension <= 0) {
    return null
  }

  return dimension
}
