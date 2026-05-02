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
  description: string
}

export const emptyMaterialForm: MaterialFormState = {
  name: "",
  category: "Decking",
  unit: "piece",
  cost: "",
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
