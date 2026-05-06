import { ArchiveIcon } from "lucide-react"

import { formatCurrency } from "@/lib/trall/format"
import {
  getMaterialDimensionsLabel,
  getProjectMaterialLineTotal,
  materialUnitLabels,
  type CalculatedMaterialRule,
  type ProjectMaterialItem,
} from "@/lib/trall/materials"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

export function ProjectMaterialRow({
  calculationRule,
  item,
  onQuantityChange,
  onQuantityCommit,
  onRemove,
}: {
  calculationRule: CalculatedMaterialRule | null
  item: ProjectMaterialItem
  onQuantityChange: (quantity: number) => void
  onQuantityCommit: () => void
  onRemove: () => void
}) {
  const dimensions = getMaterialDimensionsLabel(item.material)
  const calculationLabel =
    calculationRule === "decking_area"
      ? "Calculated from deck edges"
      : calculationRule === "support_cc600"
        ? "Calculated from c/c 600 support runs"
        : null

  return (
    <div className="space-y-2 rounded-lg border bg-muted/25 px-3 py-2">
      <div className="grid grid-cols-[minmax(0,1fr)_80px_32px] gap-2">
        <div className="grid min-w-0 grid-cols-[40px_minmax(0,1fr)] gap-2">
          <MaterialThumbnail material={item.material} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{item.material.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {formatCurrency(item.material.cost)} /{" "}
              {materialUnitLabels[item.material.unit]} ·{" "}
              {formatCurrency(getProjectMaterialLineTotal(item))}
            </p>
            {dimensions ? (
              <p className="truncate text-xs text-muted-foreground">
                {dimensions}
              </p>
            ) : null}
            {calculationLabel ? (
              <p className="truncate text-xs text-muted-foreground">
                {calculationLabel}
              </p>
            ) : null}
          </div>
        </div>
        <Input
          aria-label={`${item.material.name} quantity`}
          disabled={calculationRule !== null}
          inputMode="decimal"
          min={0}
          step={0.1}
          type="number"
          value={item.quantity}
          onBlur={onQuantityCommit}
          onChange={(event) =>
            onQuantityChange(Math.max(0, Number(event.target.value) || 0))
          }
        />
        <div className="flex items-center justify-end gap-1">
          <Button
            aria-label="Remove material from project"
            size="icon-sm"
            title="Remove"
            variant="ghost"
            onClick={onRemove}
          >
            <ArchiveIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}

function MaterialThumbnail({
  material,
}: {
  material: ProjectMaterialItem["material"]
}) {
  if (!material.image_url) {
    return <div className="size-10 rounded-md border bg-muted" />
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={material.name}
      className="size-10 rounded-md border object-cover"
      src={material.image_url}
    />
  )
}
