"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArchiveIcon,
  CheckIcon,
  LibraryIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import {
  createAndAddProjectMaterial,
  createMaterial,
  deleteMaterial,
  listMaterials,
  listProjectMaterials,
  removeProjectMaterial,
  setProjectMaterialQuantity,
  updateMaterial,
  upsertProjectMaterial,
} from "@/lib/trall/materials-api"
import { formatCurrency } from "@/lib/trall/format"
import {
  getProjectMaterialLineTotal,
  getProjectMaterialTotals,
  materialUnitLabels,
  materialUnits,
  type MaterialInput,
  type MaterialRecord,
  type MaterialUnit,
  type ProjectMaterialItem,
} from "@/lib/trall/materials"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

type MaterialFormState = {
  name: string
  category: string
  unit: MaterialUnit
  cost: string
  description: string
}

const emptyForm: MaterialFormState = {
  name: "",
  category: "Decking",
  unit: "piece",
  cost: "",
  description: "",
}

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
  const [libraryForm, setLibraryForm] = useState<MaterialFormState>(emptyForm)
  const [projectForm, setProjectForm] = useState<MaterialFormState>(emptyForm)
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(
    null
  )
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
    void refreshMaterials()
  }, [])

  useEffect(() => {
    if (!projectId) {
      setProjectMaterials([])
      return
    }

    void refreshProjectMaterials(projectId)
  }, [projectId])

  async function refreshMaterials() {
    setLoading(true)
    try {
      setMaterials(await listMaterials())
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  async function refreshProjectMaterials(nextProjectId: string) {
    try {
      setProjectMaterials(await listProjectMaterials(nextProjectId))
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleSaveLibraryMaterial() {
    const input = toMaterialInput(libraryForm)
    if (!input) {
      toast.error("Enter a name, category, unit, and valid unit cost.")
      return
    }

    setSaving(true)
    try {
      if (editingMaterialId) {
        const updated = await updateMaterial(editingMaterialId, input)
        setMaterials((current) =>
          current.map((material) =>
            material.id === updated.id ? updated : material
          )
        )
        toast.success("Material updated")
      } else {
        const created = await createMaterial(input)
        setMaterials((current) => [...current, created])
        toast.success("Material added")
      }

      setLibraryForm(emptyForm)
      setEditingMaterialId(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteMaterial(material: MaterialRecord) {
    if (
      !window.confirm(
        `Remove "${material.name}" from the library? Materials already used by projects will be archived instead.`
      )
    ) {
      return
    }

    try {
      const result = await deleteMaterial(material.id)
      setMaterials((current) =>
        result.action === "deleted"
          ? current.filter((item) => item.id !== material.id)
          : current.filter((item) => item.id !== result.material.id)
      )
      toast.success(
        result.action === "deleted" ? "Material deleted" : "Material archived"
      )
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

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
      setProjectForm(emptyForm)
      setNewMaterialQuantity("1")
      toast.success("Custom material added")
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

  function startEditing(material: MaterialRecord) {
    setEditingMaterialId(material.id)
    setLibraryForm({
      name: material.name,
      category: material.category,
      unit: material.unit,
      cost: String(material.cost),
      description: material.description ?? "",
    })
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Materials</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="project" className="gap-3">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="project">Project Materials</TabsTrigger>
            <TabsTrigger value="library">Materials Library</TabsTrigger>
          </TabsList>

          <TabsContent value="project" className="space-y-3">
            <div className="grid grid-cols-[minmax(0,1fr)_88px] gap-2">
              <Select
                value={selectedMaterialId}
                onValueChange={setSelectedMaterialId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select material" />
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
                Create and add
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
                  onChange={(event) =>
                    setNewMaterialQuantity(event.target.value)
                  }
                />
                <Button disabled={saving} onClick={handleCreateAndAddMaterial}>
                  <CheckIcon />
                  Add custom
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="library" className="space-y-3">
            <div className="space-y-2 rounded-lg border p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <LibraryIcon className="size-3.5" />
                  {editingMaterialId ? "Edit material" : "New material"}
                </span>
                {editingMaterialId ? (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      setEditingMaterialId(null)
                      setLibraryForm(emptyForm)
                    }}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
              <MaterialFields form={libraryForm} onChange={setLibraryForm} />
              <Button
                className="w-full"
                disabled={saving}
                onClick={handleSaveLibraryMaterial}
              >
                <CheckIcon />
                {editingMaterialId ? "Save material" : "Add material"}
              </Button>
            </div>

            <div className="space-y-2">
              {loading ? (
                <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                  Loading materials...
                </p>
              ) : (
                materials.map((material) => (
                  <LibraryMaterialRow
                    key={material.id}
                    material={material}
                    onDelete={() => handleDeleteMaterial(material)}
                    onEdit={() => startEditing(material)}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function MaterialFields({
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

function LibraryMaterialRow({
  material,
  onDelete,
  onEdit,
}: {
  material: MaterialRecord
  onDelete: () => void
  onEdit: () => void
}) {
  const isStandard = material.created_by === null

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-lg border bg-muted/25 px-3 py-2">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium">{material.name}</span>
          {isStandard ? <Badge variant="secondary">Standard</Badge> : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {material.category} · {formatCurrency(material.cost)} /{" "}
          {materialUnitLabels[material.unit]}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          aria-label="Edit material"
          disabled={isStandard}
          size="icon-sm"
          title={isStandard ? "Standard materials are read-only" : "Edit"}
          variant="ghost"
          onClick={onEdit}
        >
          <PencilIcon />
        </Button>
        <Button
          aria-label="Delete material"
          disabled={isStandard}
          size="icon-sm"
          title={isStandard ? "Standard materials are read-only" : "Delete"}
          variant="ghost"
          onClick={onDelete}
        >
          <Trash2Icon />
        </Button>
      </div>
    </div>
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

function toMaterialInput(form: MaterialFormState): MaterialInput | null {
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

function parseQuantity(value: string) {
  const quantity = Number.parseFloat(value)

  if (!Number.isFinite(quantity) || quantity < 0) {
    return null
  }

  return quantity
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong"
}
