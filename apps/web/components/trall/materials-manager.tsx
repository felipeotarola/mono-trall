"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import {
  ArchiveIcon,
  CheckIcon,
  PencilIcon,
  PlusIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  MaterialFields,
  getErrorMessage,
  parseQuantity,
  toMaterialInput,
  type MaterialFormState,
} from "@/components/trall/material-form"
import {
  createMaterial,
  listMaterials,
  listProjectMaterials,
  removeProjectMaterial,
  setProjectMaterialQuantity,
  updateMaterial,
  upsertProjectMaterial,
} from "@/lib/trall/materials-api"
import { formatCurrency } from "@/lib/trall/format"
import {
  getCalculatedMaterialRule,
  getCalculatedProjectMaterialQuantity,
  getDeckingLinearMetres,
  getMaterialDimensionsLabel,
  getPiecesForLinearMetres,
  getProjectMaterialLineTotal,
  getProjectMaterialTotals,
  materialUnitLabels,
  materialUnits,
  type CalculatedMaterialRule,
  type MaterialRecord,
  type ProjectMaterialSummary,
  type ProjectMaterialItem,
} from "@/lib/trall/materials"
import type { SupportLayout } from "@/lib/trall/supports"
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
  supportLayout,
}: {
  deckAreaM2: number
  ensureProject: () => Promise<string>
  onSummaryChange: (summary: ProjectMaterialSummary) => void
  projectId: string | null
  supportLayout: SupportLayout
}) {
  const [materials, setMaterials] = useState<MaterialRecord[]>([])
  const [projectMaterials, setProjectMaterials] = useState<
    ProjectMaterialItem[]
  >([])
  const [selectedMaterialId, setSelectedMaterialId] = useState("")
  const [selectedQuantity, setSelectedQuantity] = useState("1")
  const [boardGapMm, setBoardGapMm] = useState(5)
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(
    null
  )
  const [editingForm, setEditingForm] = useState<MaterialFormState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const calculatedProjectMaterials = useMemo(
    () =>
      projectMaterials.map((item) => {
        const quantity = getCalculatedProjectMaterialQuantity({
          areaM2: deckAreaM2,
          boardGapMm,
          material: item.material,
          supportLinearMetres: supportLayout.totalLengthM,
        })

        return quantity === null ? item : { ...item, quantity }
      }),
    [boardGapMm, deckAreaM2, projectMaterials, supportLayout.totalLengthM]
  )
  const totals = useMemo(
    () => getProjectMaterialTotals(calculatedProjectMaterials),
    [calculatedProjectMaterials]
  )
  const selectedMaterial = materials.find(
    (material) => material.id === selectedMaterialId
  )
  const selectedCalculatedQuantity = selectedMaterial
    ? getCalculatedProjectMaterialQuantity({
        areaM2: deckAreaM2,
        boardGapMm,
        material: selectedMaterial,
        supportLinearMetres: supportLayout.totalLengthM,
      })
    : null
  const supportMaterial =
    materials.find(
      (material) =>
        material.unit === "linear_metre" &&
        material.description?.includes("882204514554")
    ) ??
    materials.find(
      (material) =>
        material.unit === "linear_metre" &&
        material.name.toLowerCase().includes("45 x 145")
    )
  const projectHasSupportMaterial =
    supportMaterial !== undefined &&
    projectMaterials.some(
      (projectMaterial) => projectMaterial.material_id === supportMaterial.id
    )
  const supportCost =
    supportMaterial && supportLayout.totalLengthM > 0
      ? supportLayout.totalLengthM * supportMaterial.cost
      : null
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
      itemCount: calculatedProjectMaterials.length,
    })
  }, [calculatedProjectMaterials.length, onSummaryChange, totals])

  useEffect(() => {
    if (!projectId) {
      return
    }

    const updates = projectMaterials
      .map((item) => ({
        item,
        quantity: getCalculatedProjectMaterialQuantity({
          areaM2: deckAreaM2,
          boardGapMm,
          material: item.material,
          supportLinearMetres: supportLayout.totalLengthM,
        }),
      }))
      .filter(
        (
          update
        ): update is {
          item: ProjectMaterialItem
          quantity: number
        } =>
          update.quantity !== null &&
          Math.abs(update.item.quantity - update.quantity) >= 0.05
      )

    if (updates.length === 0) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void Promise.all(
        updates.map(({ item, quantity }) =>
          setProjectMaterialQuantity({
            materialId: item.material_id,
            projectId,
            quantity,
          })
        )
      )
        .then((updatedItems) => {
          setProjectMaterials((current) =>
            current.map((currentItem) => {
              const updated = updatedItems.find(
                (item) => item.material_id === currentItem.material_id
              )

              return updated ?? currentItem
            })
          )
        })
        .catch((error) => toast.error(getErrorMessage(error)))
    }, 650)

    return () => window.clearTimeout(timeoutId)
  }, [
    boardGapMm,
    deckAreaM2,
    projectId,
    projectMaterials,
    supportLayout.totalLengthM,
  ])

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

    const quantity =
      selectedCalculatedQuantity ?? parseQuantity(selectedQuantity)
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
      toast.success(
        selectedCalculatedQuantity === null
          ? "Material added to project"
          : "Calculated material added to project"
      )
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function handleAddSupportMaterial() {
    if (!supportMaterial) {
      toast.error("No 45 x 145 support material found in the library.")
      return
    }

    if (supportLayout.totalLengthM <= 0) {
      toast.error("Draw a deck before adding support material.")
      return
    }

    setSaving(true)
    try {
      const nextProjectId = await ensureProject()
      const item = await upsertProjectMaterial({
        materialId: supportMaterial.id,
        projectId: nextProjectId,
        quantity: supportLayout.totalLengthM,
      })
      upsertProjectItem(item)
      toast.success("Support material updated")
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

  async function handleSaveEditedMaterial(item: ProjectMaterialItem) {
    if (!projectId || !editingForm) {
      return
    }

    const input = toMaterialInput(editingForm)
    if (!input) {
      toast.error("Enter a name, category, unit, and valid unit cost.")
      return
    }

    setSaving(true)
    try {
      if (item.material.created_by === null) {
        const material = await createMaterial(input)
        const replacement = await upsertProjectMaterial({
          materialId: material.id,
          projectId,
          quantity: item.quantity,
        })
        await removeProjectMaterial({
          materialId: item.material_id,
          projectId,
        })

        setMaterials((current) => [...current, material])
        setProjectMaterials((current) => [
          ...current.filter(
            (projectMaterial) =>
              projectMaterial.material_id !== item.material_id
          ),
          replacement,
        ])
        toast.success("Editable material copy created")
      } else {
        const material = await updateMaterial(item.material_id, input)
        setMaterials((current) =>
          current.map((currentMaterial) =>
            currentMaterial.id === material.id ? material : currentMaterial
          )
        )
        setProjectMaterials((current) =>
          current.map((projectMaterial) =>
            projectMaterial.material_id === material.id
              ? { ...projectMaterial, material }
              : projectMaterial
          )
        )
        toast.success("Material updated")
      }

      cancelEditing()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  function startEditingMaterial(item: ProjectMaterialItem) {
    setEditingMaterialId(item.material_id)
    setEditingForm({
      name: item.material.name,
      category: item.material.category,
      unit: item.material.unit,
      cost: String(item.material.cost),
      thickness_mm: item.material.thickness_mm
        ? String(item.material.thickness_mm)
        : "",
      width_mm: item.material.width_mm ? String(item.material.width_mm) : "",
      length_mm: item.material.length_mm ? String(item.material.length_mm) : "",
      image_url: item.material.image_url ?? "",
      description: item.material.description ?? "",
    })
  }

  function cancelEditing() {
    setEditingMaterialId(null)
    setEditingForm(null)
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
          {calculatedProjectMaterials.length === 0 ? (
            <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
              No materials assigned to this project yet.
            </p>
          ) : (
            calculatedProjectMaterials.map((item) => {
              const calculationRule = getCalculatedMaterialRule(item.material)

              return (
                <ProjectMaterialRow
                  key={item.material_id}
                  calculationRule={calculationRule}
                  editingForm={
                    editingMaterialId === item.material_id ? editingForm : null
                  }
                  item={item}
                  saving={saving}
                  onCancelEdit={cancelEditing}
                  onEdit={() => startEditingMaterial(item)}
                  onEditFormChange={setEditingForm}
                  onQuantityChange={(quantity) => {
                    if (calculationRule) {
                      return
                    }

                    setProjectMaterials((current) =>
                      current.map((projectMaterial) =>
                        projectMaterial.material_id === item.material_id
                          ? { ...projectMaterial, quantity }
                          : projectMaterial
                      )
                    )
                  }}
                  onQuantityCommit={() => {
                    if (!calculationRule) {
                      handleQuantityCommit(item)
                    }
                  }}
                  onRemove={() => handleRemoveProjectMaterial(item)}
                  onSaveEdit={() => handleSaveEditedMaterial(item)}
                />
              )
            })
          )}
        </div>

        <div className="space-y-2 rounded-lg border p-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Bärlina c/c 600
              </p>
              <p className="text-sm font-semibold">
                {supportLayout.totalLengthM.toFixed(1)} lpm
              </p>
            </div>
            <Badge variant="outline">
              {supportLayout.segments.length} runs
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            45 x 145 mm support runs at 600 mm centres.
          </p>
          {supportMaterial ? (
            <div className="rounded-lg bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground">
              {supportMaterial.name} · {formatCurrency(supportMaterial.cost)} /
              lpm
              {supportCost !== null ? ` · ${formatCurrency(supportCost)}` : ""}
            </div>
          ) : null}
          <Button
            className="w-full"
            disabled={
              saving || !supportMaterial || supportLayout.totalLengthM <= 0
            }
            variant={projectHasSupportMaterial ? "secondary" : "outline"}
            onClick={handleAddSupportMaterial}
          >
            <PlusIcon />
            {projectHasSupportMaterial
              ? "Update support material"
              : "Add support material"}
          </Button>
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
              disabled={selectedCalculatedQuantity !== null}
              inputMode="decimal"
              min={0}
              step={0.1}
              type="number"
              value={selectedCalculatedQuantity ?? selectedQuantity}
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
  calculationRule,
  editingForm,
  item,
  saving,
  onCancelEdit,
  onEdit,
  onEditFormChange,
  onQuantityChange,
  onQuantityCommit,
  onRemove,
  onSaveEdit,
}: {
  calculationRule: CalculatedMaterialRule | null
  editingForm: MaterialFormState | null
  item: ProjectMaterialItem
  saving: boolean
  onCancelEdit: () => void
  onEdit: () => void
  onEditFormChange: (form: MaterialFormState | null) => void
  onQuantityChange: (quantity: number) => void
  onQuantityCommit: () => void
  onRemove: () => void
  onSaveEdit: () => void
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
      <div className="grid grid-cols-[minmax(0,1fr)_80px_auto] gap-2">
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
            aria-label="Edit material"
            size="icon-sm"
            title={
              item.material.created_by === null
                ? "Edit as custom copy"
                : "Edit material"
            }
            variant="ghost"
            onClick={onEdit}
          >
            <PencilIcon />
          </Button>
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
      {editingForm ? (
        <div className="space-y-2 border-t pt-2">
          {item.material.created_by === null ? (
            <p className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
              Standard materials are saved as a custom copy when edited.
            </p>
          ) : null}
          <MaterialFields form={editingForm} onChange={onEditFormChange} />
          <div className="grid grid-cols-2 gap-2">
            <Button disabled={saving} onClick={onSaveEdit}>
              <CheckIcon />
              Save
            </Button>
            <Button variant="outline" onClick={onCancelEdit}>
              <XIcon />
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
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
