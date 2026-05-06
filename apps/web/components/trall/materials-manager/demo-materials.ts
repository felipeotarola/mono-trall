import type {
  MaterialRecord,
  ProjectMaterialItem,
} from "@/lib/trall/materials"

export async function listDemoMaterials() {
  const response = await fetch("/api/trall/demo/materials")
  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | MaterialRecord[]
    | null

  if (!response.ok || !Array.isArray(payload)) {
    throw new Error(
      payload && !Array.isArray(payload) && payload.error
        ? payload.error
        : "Could not load demo materials."
    )
  }

  return payload
}

export function createLocalProjectMaterial({
  material,
  projectId,
  quantity,
}: {
  material: MaterialRecord
  projectId: string
  quantity: number
}): ProjectMaterialItem {
  const now = new Date().toISOString()

  return {
    project_id: projectId,
    material_id: material.id,
    quantity,
    created_at: now,
    updated_at: now,
    material,
  }
}
