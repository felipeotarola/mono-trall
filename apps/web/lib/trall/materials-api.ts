"use client"

import type {
  MaterialInput,
  MaterialRecord,
  ProjectMaterialItem,
} from "@/lib/trall/materials"

export type DeleteMaterialResult = {
  material: MaterialRecord
  action: "deleted" | "archived"
}

export async function listMaterials() {
  return fetchJson<MaterialRecord[]>("/api/trall/materials")
}

export async function createMaterial(input: MaterialInput) {
  return fetchJson<MaterialRecord>("/api/trall/materials", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function updateMaterial(id: string, input: MaterialInput) {
  return fetchJson<MaterialRecord>(`/api/trall/materials/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

export async function deleteMaterial(id: string) {
  return fetchJson<DeleteMaterialResult>(`/api/trall/materials/${id}`, {
    method: "DELETE",
  })
}

export async function listProjectMaterials(projectId: string) {
  return fetchJson<ProjectMaterialItem[]>(
    `/api/trall/projects/${projectId}/materials`
  )
}

export async function upsertProjectMaterial({
  materialId,
  projectId,
  quantity,
}: {
  materialId: string
  projectId: string
  quantity: number
}) {
  return fetchJson<ProjectMaterialItem>(
    `/api/trall/projects/${projectId}/materials`,
    {
      method: "POST",
      body: JSON.stringify({ materialId, quantity }),
    }
  )
}

export async function createAndAddProjectMaterial({
  material,
  projectId,
  quantity,
}: {
  material: MaterialInput
  projectId: string
  quantity: number
}) {
  return fetchJson<ProjectMaterialItem>(
    `/api/trall/projects/${projectId}/materials`,
    {
      method: "POST",
      body: JSON.stringify({ material, quantity }),
    }
  )
}

export async function setProjectMaterialQuantity({
  materialId,
  projectId,
  quantity,
}: {
  materialId: string
  projectId: string
  quantity: number
}) {
  return fetchJson<ProjectMaterialItem>(
    `/api/trall/projects/${projectId}/materials/${materialId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    }
  )
}

export async function removeProjectMaterial({
  materialId,
  projectId,
}: {
  materialId: string
  projectId: string
}) {
  await fetchJson<{ ok: true }>(
    `/api/trall/projects/${projectId}/materials/${materialId}`,
    { method: "DELETE" }
  )
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as {
      error?: string
    } | null
    throw new Error(errorBody?.error ?? `Request failed: ${response.status}`)
  }

  return (await response.json()) as T
}
