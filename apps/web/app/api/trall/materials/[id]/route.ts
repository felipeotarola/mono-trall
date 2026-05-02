import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import {
  parseMaterialInputBody,
  type MaterialRecord,
} from "@/lib/trall/materials"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const existing = await getEditableMaterial(id, user.id)
  if ("response" in existing) {
    return existing.response
  }

  const parsed = parseMaterialInputBody(await request.json().catch(() => null))
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("materials")
    .update({
      ...parsed.input,
      active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("created_by", user.id)
    .select("*")
    .single<MaterialRecord>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const existing = await getEditableMaterial(id, user.id)
  if ("response" in existing) {
    return existing.response
  }

  const { count, error: referenceError } = await supabase
    .from("project_materials")
    .select("material_id", { count: "exact", head: true })
    .eq("material_id", id)

  if (referenceError) {
    return NextResponse.json({ error: referenceError.message }, { status: 500 })
  }

  if ((count ?? 0) > 0) {
    const { data, error } = await supabase
      .from("materials")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("created_by", user.id)
      .select("*")
      .single<MaterialRecord>()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ material: data, action: "archived" })
  }

  const { error: deleteError } = await supabase
    .from("materials")
    .delete()
    .eq("id", id)
    .eq("created_by", user.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ material: existing.material, action: "deleted" })
}

async function getEditableMaterial(id: string, userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .eq("id", id)
    .single<MaterialRecord>()

  if (error) {
    return {
      response: NextResponse.json({ error: error.message }, { status: 404 }),
    }
  }

  if (data.created_by !== userId) {
    return {
      response: NextResponse.json(
        { error: "Only user materials can be changed" },
        { status: 403 }
      ),
    }
  }

  return { material: data }
}
