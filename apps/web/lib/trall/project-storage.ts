import { createClient } from "@/lib/supabase/client"
import type { HouseModel, Material, Point, ViewBox } from "@/lib/trall/types"

export type PlannerProjectState = {
  house: HouseModel
  deckPoints: Point[]
  viewBox: ViewBox
  materials: {
    items: Material[]
  }
}

export type TrallProject = {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

export type TrallProjectVersion = {
  id: string
  project_id: string
  user_id: string
  version_number: number
  state: PlannerProjectState
  created_at: string
}

export async function createProject(name: string, state: PlannerProjectState) {
  const supabase = createClient()
  const userId = await getCurrentUserId()

  const { data: project, error: projectError } = await supabase
    .from("trall_mono_projects")
    .insert({ name, user_id: userId })
    .select("*")
    .single<TrallProject>()

  if (projectError) {
    throw projectError
  }

  const { error: versionError } = await supabase
    .from("trall_mono_project_versions")
    .insert({
      project_id: project.id,
      user_id: userId,
      version_number: 1,
      state,
    })

  if (versionError) {
    throw versionError
  }

  return project
}

export async function saveProjectVersion(
  projectId: string,
  state: PlannerProjectState
) {
  const supabase = createClient()
  const userId = await getCurrentUserId()

  const { data: latestVersion, error: latestVersionError } = await supabase
    .from("trall_mono_project_versions")
    .select("version_number")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle<{ version_number: number }>()

  if (latestVersionError) {
    throw latestVersionError
  }

  const nextVersionNumber = (latestVersion?.version_number ?? 0) + 1

  const { data: version, error: versionError } = await supabase
    .from("trall_mono_project_versions")
    .insert({
      project_id: projectId,
      user_id: userId,
      version_number: nextVersionNumber,
      state,
    })
    .select("*")
    .single<TrallProjectVersion>()

  if (versionError) {
    throw versionError
  }

  const { error: updateError } = await supabase
    .from("trall_mono_projects")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("user_id", userId)

  if (updateError) {
    throw updateError
  }

  return version
}

export async function loadProject(projectId: string) {
  const supabase = createClient()
  const userId = await getCurrentUserId()

  const { data: project, error: projectError } = await supabase
    .from("trall_mono_projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single<TrallProject>()

  if (projectError) {
    throw projectError
  }

  const { data: version, error: versionError } = await supabase
    .from("trall_mono_project_versions")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single<TrallProjectVersion>()

  if (versionError) {
    throw versionError
  }

  return { project, version }
}

export async function listProjects() {
  const supabase = createClient()
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from("trall_mono_projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })

  if (error) {
    throw error
  }

  return data satisfies TrallProject[]
}

async function getCurrentUserId() {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  if (!user) {
    throw new Error("Not authenticated")
  }

  return user.id
}
