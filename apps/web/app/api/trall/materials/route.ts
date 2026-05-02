import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import {
  parseMaterialInputBody,
  type MaterialRecord,
} from "@/lib/trall/materials"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .or(`created_by.is.null,created_by.eq.${user.id}`)
    .eq("active", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true })
    .returns<MaterialRecord[]>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const parsed = parseMaterialInputBody(await request.json().catch(() => null))
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("materials")
    .insert({ ...parsed.input, created_by: user.id })
    .select("*")
    .single<MaterialRecord>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
