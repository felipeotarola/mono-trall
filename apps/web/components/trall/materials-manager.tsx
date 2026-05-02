"use client"

import { useEffect, useMemo, useState } from "react"
import { ArchiveIcon, CheckIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import {
  MaterialFields,
  emptyMaterialForm,
  getErrorMessage,
  parseQuantity,
  toMaterialInput,
  type MaterialFormState,
} from "@/components/trall/material-form"
import {
  createAndAddProjectMaterial,
  listMaterials,
  listProjectMaterials,
  removeProjectMaterial,
  setProjectMaterialQuantity,
  upsertProjectMaterial,
} from "@/lib/trall/materials-api"
import { formatCurrency } from "@/lib/trall/format"
import {
  getProjectMaterialLineTotal,
  getProjectMaterialTotals,
  materialUnitLabels,
  materialUnits,
  type MaterialRecord,
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
  ensureProject,
  projectId,
}: {
  ensureProject: () => Promise<string>
  projectId: string | null
}) {
  const [materials, setMaterials] = useState<MaterialRecord[]>([])
  const [projectMaterials, setProjectMaterials] = useState<
    ProjectMaterialItem[]
  >([])
  const [projectForm, setProjectForm] =
    useState<MaterialFormState>(emptyMaterialForm)
  const [selectedMaterialId, setSelectedMaterialId] = useState("")
  const [selectedQuantity, setSelectedQuantity] = useState("1")
  const [newMaterialQuantity, setNewMaterialQuantity] = useState("1")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const totals = useMemo(
    () => getProjectMaterialTotals(projectMaterials),
    [projectMaterials]
  )

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

  async function handleCreateAndAddMaterial() {
    const input = toMaterialInput(projectForm)
    const quantity = parseQuantity(newMaterialQuantity)

    if (!input || quantity === null) {
      toast.error("Enter material details and a valid quantity.")
      return
    }

    setSaving(true)
    try {
      const nextProjectId = await ensureProject()
      const item = await createAndAddProjectMaterial({
        material: input,
        projectId: nextProjectId,
        quantity,
      })
      upsertProjectItem(item)
      setMaterials((current) => [...current, item.material])
      setProjectForm(emptyMaterialForm)
      setNewMaterialQuantity("1")
      toast.success("Custom material added to project")
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
          <Button
            className="w-full"
            disabled={saving || materials.length === 0}
            onClick={handleAddSelectedMaterial}
          >
            <PlusIcon />
            Add to project
          </Button>
        </div>

        <div className="space-y-2 rounded-lg border p-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <PlusIcon className="size-3.5" />
            Create and add to project
          </div>
          <MaterialFields form={projectForm} onChange={setProjectForm} />
          <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-2">
            <Input
              aria-label="New material quantity"
              inputMode="decimal"
              min={0}
              step={0.1}
              type="number"
              value={newMaterialQuantity}
              onChange={(event) => setNewMaterialQuantity(event.target.value)}
            />
            <Button disabled={saving} onClick={handleCreateAndAddMaterial}>
              <CheckIcon />
              Add custom
            </Button>
          </div>
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
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_80px_auto] gap-2 rounded-lg border bg-muted/25 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{item.material.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {formatCurrency(item.material.cost)} /{" "}
          {materialUnitLabels[item.material.unit]} ·{" "}
          {formatCurrency(getProjectMaterialLineTotal(item))}
        </p>
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
