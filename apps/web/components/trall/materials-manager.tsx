"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { ArchiveIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import {
  getErrorMessage,
  parseQuantity,
} from "@/components/trall/material-form"
import {
  listMaterials,
  listProjectMaterials,
  removeProjectMaterial,
  setProjectMaterialQuantity,
  upsertProjectMaterial,
} from "@/lib/trall/materials-api"
import { formatCurrency } from "@/lib/trall/format"
import {
  getDeckingLinearMetres,
  getMaterialDimensionsLabel,
  getPiecesForLinearMetres,
  getProjectMaterialLineTotal,
  getProjectMaterialTotals,
  materialUnitLabels,
  materialUnits,
  type MaterialRecord,
  type ProjectMaterialSummary,
  type ProjectMaterialItem,
} from "@/lib/trall/materials"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

export function MaterialsManager({
  deckAreaM2,
  ensureProject,
  onSummaryChange,
  projectId,
}: {
  deckAreaM2: number
  ensureProject: () => Promise<string>
  onSummaryChange: (summary: ProjectMaterialSummary) => void
  projectId: string | null
}) {
  const [materials, setMaterials] = useState<MaterialRecord[]>([])
  const [projectMaterials, setProjectMaterials] = useState<
    ProjectMaterialItem[]
  >([])
  const [selectedMaterialId, setSelectedMaterialId] = useState("")
  const [selectedQuantity, setSelectedQuantity] = useState("1")
  const [boardGapMm, setBoardGapMm] = useState(5)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const totals = useMemo(
    () => getProjectMaterialTotals(projectMaterials),
    [projectMaterials]
  )
  const selectedMaterial = materials.find(
    (material) => material.id === selectedMaterialId
  )
  const suggestedLinearMetres =
    selectedMaterial?.unit === "linear_metre"
      ? getDeckingLinearMetres({
          areaM2: deckAreaM2,
          gapMm: boardGapMm,
          widthMm: selectedMaterial.width_mm,
        })
      : null
  const suggestedPieces =
    suggestedLinearMetres && selectedMaterial
      ? getPiecesForLinearMetres({
          lengthMm: selectedMaterial.length_mm,
          linearMetres: suggestedLinearMetres,
        })
      : null

  useEffect(() => {
    onSummaryChange({
      ...totals,
      itemCount: projectMaterials.length,
    })
  }, [onSummaryChange, projectMaterials.length, totals])

  useEffect(() => {
    let cancelled = false

    async function loadMaterials() {
      setLoading(true)
      try {
        const nextMaterials = await listMaterials()
        if (!cancelled) {
          setMaterials(nextMaterials)
        }
      } catch (error) {
        toast.error(getErrorMessage(error))
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadMaterials()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadProjectMaterials(nextProjectId: string) {
      try {
        const items = await listProjectMaterials(nextProjectId)
        if (!cancelled) {
          setProjectMaterials(items)
        }
      } catch (error) {
        toast.error(getErrorMessage(error))
      }
    }

    if (!projectId) {
      setProjectMaterials([])
      return
    }

    void loadProjectMaterials(projectId)

    return () => {
      cancelled = true
    }
  }, [projectId])

  async function handleAddSelectedMaterial() {
    if (!selectedMaterialId) {
      toast.error("Choose a material to add.")
      return
    }

    const quantity = parseQuantity(selectedQuantity)
    if (quantity === null) {
      toast.error("Enter a valid quantity.")
      return
    }

    setSaving(true)
    try {
      const nextProjectId = await ensureProject()
      const item = await upsertProjectMaterial({
        materialId: selectedMaterialId,
        projectId: nextProjectId,
        quantity,
      })
      upsertProjectItem(item)
      setSelectedQuantity("1")
      toast.success("Material added to project")
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function handleQuantityCommit(item: ProjectMaterialItem) {
    if (!projectId) {
      return
    }

    try {
      const updated = await setProjectMaterialQuantity({
        materialId: item.material_id,
        projectId,
        quantity: item.quantity,
      })
      upsertProjectItem(updated)
      toast.success("Quantity updated")
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleRemoveProjectMaterial(item: ProjectMaterialItem) {
    if (!projectId) {
      return
    }

    if (!window.confirm(`Remove "${item.material.name}" from this project?`)) {
      return
    }

    try {
      await removeProjectMaterial({
        materialId: item.material_id,
        projectId,
      })
      setProjectMaterials((current) =>
        current.filter((material) => material.material_id !== item.material_id)
      )
      toast.success("Material removed from project")
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  function upsertProjectItem(item: ProjectMaterialItem) {
    setProjectMaterials((current) => {
      const existing = current.some(
        (projectMaterial) => projectMaterial.material_id === item.material_id
      )

      if (!existing) {
        return [...current, item]
      }

      return current.map((projectMaterial) =>
        projectMaterial.material_id === item.material_id
          ? item
          : projectMaterial
      )
    })
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Project materials</CardTitle>
        <CardDescription>Only materials assigned to this deck.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border bg-muted/25 p-2">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-muted-foreground">
              Project total
            </span>
            <span className="text-sm font-semibold">
              {formatCurrency(totals.totalCost)}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {materialUnits.map((unit) =>
              totals.quantityByUnit[unit] > 0 ? (
                <Badge key={unit} variant="outline">
                  {totals.quantityByUnit[unit].toFixed(1)}{" "}
                  {materialUnitLabels[unit]}
                </Badge>
              ) : null
            )}
          </div>
        </div>

        <div className="space-y-2">
          {projectMaterials.length === 0 ? (
            <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
              No materials assigned to this project yet.
            </p>
          ) : (
            projectMaterials.map((item) => (
              <ProjectMaterialRow
                key={item.material_id}
                item={item}
                onQuantityChange={(quantity) =>
                  setProjectMaterials((current) =>
                    current.map((projectMaterial) =>
                      projectMaterial.material_id === item.material_id
                        ? { ...projectMaterial, quantity }
                        : projectMaterial
                    )
                  )
                }
                onQuantityCommit={() => handleQuantityCommit(item)}
                onRemove={() => handleRemoveProjectMaterial(item)}
              />
            ))
          )}
        </div>

        <div className="space-y-2 rounded-lg border p-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <PlusIcon className="size-3.5" />
            Add from library
          </div>
          <label className="grid gap-1">
            <span className="text-xs text-muted-foreground">Board spacing</span>
            <div className="flex items-center gap-1 rounded-lg border bg-background px-2">
              <Input
                className="border-0 px-0 shadow-none focus-visible:ring-0"
                inputMode="decimal"
                max={12}
                min={0}
                step={0.5}
                type="number"
                value={boardGapMm}
                onChange={(event) => {
                  const nextGap = Number.parseFloat(event.target.value)
                  if (Number.isFinite(nextGap)) {
                    setBoardGapMm(Math.min(12, Math.max(0, nextGap)))
                  }
                }}
              />
              <span className="text-xs text-muted-foreground">mm</span>
            </div>
          </label>
          <div className="grid grid-cols-[minmax(0,1fr)_88px] gap-2">
            <Select
              value={selectedMaterialId}
              onValueChange={setSelectedMaterialId}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={loading ? "Loading..." : "Select material"}
                />
              </SelectTrigger>
              <SelectContent>
                {materials.map((material) => (
                  <SelectItem key={material.id} value={material.id}>
                    {material.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              aria-label="Quantity"
              inputMode="decimal"
              min={0}
              step={0.1}
              type="number"
              value={selectedQuantity}
              onChange={(event) => setSelectedQuantity(event.target.value)}
            />
          </div>
          {selectedMaterial ? (
            <MaterialSelectionHint
              material={selectedMaterial}
              boardGapMm={boardGapMm}
              suggestedLinearMetres={suggestedLinearMetres}
              suggestedPieces={suggestedPieces}
              onUseSuggested={() =>
                suggestedLinearMetres
                  ? setSelectedQuantity(String(suggestedLinearMetres))
                  : undefined
              }
            />
          ) : null}
          <Button
            className="w-full"
            disabled={saving || materials.length === 0}
            onClick={handleAddSelectedMaterial}
          >
            <PlusIcon />
            Add to project
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ProjectMaterialRow({
  item,
  onQuantityChange,
  onQuantityCommit,
  onRemove,
}: {
  item: ProjectMaterialItem
  onQuantityChange: (quantity: number) => void
  onQuantityCommit: () => void
  onRemove: () => void
}) {
  const dimensions = getMaterialDimensionsLabel(item.material)

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_80px_auto] gap-2 rounded-lg border bg-muted/25 px-3 py-2">
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
        </div>
      </div>
      <Input
        aria-label={`${item.material.name} quantity`}
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
  )
}

function MaterialThumbnail({ material }: { material: MaterialRecord }) {
  if (!material.image_url) {
    return <div className="size-10 rounded-md border bg-muted" />
  }

  return (
    <Image
      alt={material.name}
      className="size-10 rounded-md border object-cover"
      height={40}
      src={material.image_url}
      width={40}
    />
  )
}

function MaterialSelectionHint({
  boardGapMm,
  material,
  onUseSuggested,
  suggestedLinearMetres,
  suggestedPieces,
}: {
  boardGapMm: number
  material: MaterialRecord
  onUseSuggested: () => void
  suggestedLinearMetres: number | null
  suggestedPieces: number | null
}) {
  const dimensions = getMaterialDimensionsLabel(material)

  if (!dimensions && !suggestedLinearMetres) {
    return null
  }

  return (
    <div className="rounded-lg bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate">
          {dimensions ? `${dimensions}` : "No dimensions"}
          {suggestedLinearMetres
            ? ` · ${boardGapMm} mm gap · suggested ${suggestedLinearMetres} lpm`
            : ""}
          {suggestedPieces ? ` · ${suggestedPieces} boards` : ""}
        </span>
        {suggestedLinearMetres ? (
          <Button size="xs" variant="outline" onClick={onUseSuggested}>
            Use
          </Button>
        ) : null}
      </div>
    </div>
  )
}
