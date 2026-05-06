import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import type { AuthContext } from "./types"

export async function getAuthenticatedUser() {
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

export async function assertProjectAccess(
  auth: AuthContext,
  projectId: string
) {
  const { error } = await auth.supabase
    .from("trall_mono_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", auth.userId)
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
