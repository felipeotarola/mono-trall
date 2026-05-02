import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import {
  parseProjectMaterialQuantity,
  type ProjectMaterialItem,
} from "@/lib/trall/materials"

type RouteContext = {
  params: Promise<{ projectId: string; materialId: string }>
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

export async function PATCH(request: Request, context: RouteContext) {
  const { projectId, materialId } = await context.params
  const auth = await getAuthenticatedUser()
  if ("response" in auth) {
    return auth.response
  }

  const allowed = await assertProjectAccess(projectId, auth.userId)
  if ("response" in allowed) {
    return allowed.response
  }

  const body = (await request.json().catch(() => null)) as {
    quantity?: unknown
  } | null
  const quantity = parseProjectMaterialQuantity(body?.quantity)
  if (quantity === null) {
    return NextResponse.json(
      { error: "Quantity must be zero or greater" },
      { status: 400 }
    )
  }

  const { data, error } = await auth.supabase
    .from("project_materials")
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("material_id", materialId)
    .select(projectMaterialSelect)
    .single<ProjectMaterialItem>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { projectId, materialId } = await context.params
  const auth = await getAuthenticatedUser()
  if ("response" in auth) {
    return auth.response
  }

  const allowed = await assertProjectAccess(projectId, auth.userId)
  if ("response" in allowed) {
    return allowed.response
  }

  const { error } = await auth.supabase
    .from("project_materials")
    .delete()
    .eq("project_id", projectId)
    .eq("material_id", materialId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
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
