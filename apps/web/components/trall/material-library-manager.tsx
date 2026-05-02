"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CheckIcon,
  LibraryIcon,
  PencilIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import {
  MaterialFields,
  emptyMaterialForm,
  getErrorMessage,
  toMaterialInput,
  type MaterialFormState,
} from "@/components/trall/material-form"
import {
  createMaterial,
  deleteMaterial,
  listMaterials,
  updateMaterial,
} from "@/lib/trall/materials-api"
import { formatCurrency } from "@/lib/trall/format"
import { materialUnitLabels, type MaterialRecord } from "@/lib/trall/materials"
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

export function MaterialLibraryManager() {
  const [materials, setMaterials] = useState<MaterialRecord[]>([])
  const [form, setForm] = useState<MaterialFormState>(emptyMaterialForm)
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(
    null
  )
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const filteredMaterials = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return materials
    }

    return materials.filter((material) =>
      [
        material.name,
        material.category,
        material.description ?? "",
        materialUnitLabels[material.unit],
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    )
  }, [materials, query])

  const customCount = materials.filter(
    (material) => material.created_by !== null
  ).length
  const standardCount = materials.length - customCount

  useEffect(() => {
    void refreshMaterials()
  }, [])

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

  async function handleSaveMaterial() {
    const input = toMaterialInput(form)
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

      resetForm()
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

  function startEditing(material: MaterialRecord) {
    setEditingMaterialId(material.id)
    setForm({
      name: material.name,
      category: material.category,
      unit: material.unit,
      cost: String(material.cost),
      description: material.description ?? "",
    })
  }

  function resetForm() {
    setEditingMaterialId(null)
    setForm(emptyMaterialForm)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Materials Library
          </h1>
          <p className="text-sm text-muted-foreground">
            Maintain reusable deck-building materials for all projects.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <OverviewMetric label="Standard" value={standardCount} />
          <OverviewMetric label="Custom" value={customCount} />
        </div>
      </div>

      <div className="grid min-h-0 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>
              {editingMaterialId ? "Edit material" : "Add material"}
            </CardTitle>
            <CardDescription>
              Custom materials are available in the project calculator.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <MaterialFields form={form} onChange={setForm} />
            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={saving}
                onClick={handleSaveMaterial}
              >
                <CheckIcon />
                {editingMaterialId ? "Save changes" : "Add material"}
              </Button>
              {editingMaterialId ? (
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Library overview</CardTitle>
                <CardDescription>
                  Standard rows are shared and read-only. Custom rows can be
                  edited or archived.
                </CardDescription>
              </div>
              <div className="flex h-9 min-w-0 items-center gap-2 rounded-lg border bg-background px-2 lg:w-80">
                <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
                <Input
                  aria-label="Search materials"
                  className="border-0 px-0 shadow-none focus-visible:ring-0"
                  placeholder="Search materials"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <div className="grid grid-cols-[minmax(180px,1.5fr)_140px_90px_120px_120px] border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground max-lg:hidden">
                <span>Name</span>
                <span>Category</span>
                <span>Unit</span>
                <span>Cost</span>
                <span className="text-right">Actions</span>
              </div>
              <div className="divide-y">
                {loading ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    Loading materials...
                  </p>
                ) : filteredMaterials.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    No materials match this search.
                  </p>
                ) : (
                  filteredMaterials.map((material) => (
                    <MaterialOverviewRow
                      key={material.id}
                      material={material}
                      onDelete={() => handleDeleteMaterial(material)}
                      onEdit={() => startEditing(material)}
                    />
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function OverviewMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  )
}

function MaterialOverviewRow({
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
    <div className="grid gap-3 px-3 py-3 lg:grid-cols-[minmax(180px,1.5fr)_140px_90px_120px_120px] lg:items-center">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <LibraryIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-medium">{material.name}</span>
          {isStandard ? <Badge variant="secondary">Standard</Badge> : null}
        </div>
        {material.description ? (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {material.description}
          </p>
        ) : null}
      </div>
      <div className="text-sm text-muted-foreground">{material.category}</div>
      <div className="text-sm">{materialUnitLabels[material.unit]}</div>
      <div className="text-sm font-medium">{formatCurrency(material.cost)}</div>
      <div className="flex justify-end gap-1">
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
