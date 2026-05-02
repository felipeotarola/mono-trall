import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import {
  parseMaterialInputBody,
  parseProjectMaterialQuantity,
  type MaterialRecord,
  type ProjectMaterialItem,
} from "@/lib/trall/materials"

type RouteContext = {
  params: Promise<{ projectId: string }>
}

const projectMaterialSelect = `
  project_id,
  material_id,
  quantity,
  created_at,
  updated_at,
  material:materials (
    id,
    name,
    category,
    unit,
    cost,
    description,
    created_by,
    active,
    created_at,
    updated_at
  )
`

export async function GET(_request: Request, context: RouteContext) {
  const { projectId } = await context.params
  const auth = await getAuthenticatedUser()
  if ("response" in auth) {
    return auth.response
  }

  const allowed = await assertProjectAccess(projectId, auth.userId)
  if ("response" in allowed) {
    return allowed.response
  }

  const { data, error } = await auth.supabase
    .from("project_materials")
    .select(projectMaterialSelect)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
    .returns<ProjectMaterialItem[]>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request, context: RouteContext) {
  const { projectId } = await context.params
  const auth = await getAuthenticatedUser()
  if ("response" in auth) {
    return auth.response
  }

  const allowed = await assertProjectAccess(projectId, auth.userId)
  if ("response" in allowed) {
    return allowed.response
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null
  const quantity = parseProjectMaterialQuantity(body?.quantity)
  if (quantity === null) {
    return NextResponse.json(
      { error: "Quantity must be zero or greater" },
      { status: 400 }
    )
  }

  let materialId =
    typeof body?.materialId === "string" ? body.materialId.trim() : ""

  if (!materialId && body?.material) {
    const parsed = parseMaterialInputBody(body.material)
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const { data: material, error: materialError } = await auth.supabase
      .from("materials")
      .insert({ ...parsed.input, created_by: auth.userId })
      .select("*")
      .single<MaterialRecord>()

    if (materialError) {
      return NextResponse.json(
        { error: materialError.message },
        { status: 500 }
      )
    }

    materialId = material.id
  }

  if (!materialId) {
    return NextResponse.json({ error: "Material is required" }, { status: 400 })
  }

  const visible = await assertMaterialVisible(materialId, auth.userId)
  if ("response" in visible) {
    return visible.response
  }

  const { error } = await auth.supabase.from("project_materials").upsert(
    {
      project_id: projectId,
      material_id: materialId,
      quantity,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "project_id,material_id" }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return fetchProjectMaterialResponse(projectId, materialId)
}

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      response: NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      ),
    }
  }

  return { supabase, userId: user.id }
}

async function assertProjectAccess(projectId: string, userId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("trall_mono_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single<{ id: string }>()

  if (error) {
    return {
      response: NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      ),
    }
  }

  return { ok: true }
}

async function assertMaterialVisible(materialId: string, userId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("materials")
    .select("id")
    .eq("id", materialId)
    .eq("active", true)
    .or(`created_by.is.null,created_by.eq.${userId}`)
    .single<{ id: string }>()

  if (error) {
    return {
      response: NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      ),
    }
  }

  return { ok: true }
}

async function fetchProjectMaterialResponse(
  projectId: string,
  materialId: string
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("project_materials")
    .select(projectMaterialSelect)
    .eq("project_id", projectId)
    .eq("material_id", materialId)
    .single<ProjectMaterialItem>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
