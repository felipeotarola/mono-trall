import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

import type { MaterialRecord } from "@/lib/trall/materials"

const DEMO_MATERIALS_EMAIL =
  process.env.TRALL_DEMO_MATERIALS_EMAIL ?? "feot1000@gmail.com"

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Demo materials are not configured." },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  const user = await findUserByEmail(supabase, DEMO_MATERIALS_EMAIL)

  if (!user) {
    return NextResponse.json(
      { error: "Demo material owner was not found." },
      { status: 404 }
    )
  }

  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .eq("created_by", user.id)
    .eq("active", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true })
    .returns<MaterialRecord[]>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

async function findUserByEmail(
  supabase: SupabaseClient,
  email: string
) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    })

    if (error) {
      throw error
    }

    const user = data.users.find((candidate) => candidate.email === email)
    if (user) {
      return user
    }

    if (data.users.length < 1000) {
      return null
    }
  }

  return null
}
