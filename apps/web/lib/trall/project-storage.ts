import { createClient } from "@/lib/supabase/client"
import {
  baseMaterials,
  initialDeckPoints,
  initialHouse,
  PIXELS_PER_METER,
} from "@/lib/trall/constants"
import type { EdgeConstraint } from "@/lib/trall/edge-model"
import {
  getDefaultElevationSettings,
  normalizeElevationSettings,
  type ElevationSettings,
} from "@/lib/trall/elevation"
import {
  defaultBoardDirection,
  type BoardDirectionSettings,
  type DeckFeature,
} from "@/lib/trall/features"
import { polygonArea } from "@/lib/trall/geometry"
import {
  getHouseBounds,
  getHouseDoors,
  getHouseWindows,
} from "@/lib/trall/house"
import type {
  HouseModel,
  Material,
  MeasurementLine,
  Point,
  ViewBox,
} from "@/lib/trall/types"
import { getFitViewBox } from "@/lib/trall/view"

export const CURRENT_PROJECT_STORAGE_KEY = "trallai.currentProjectId"

export type PlannerProjectState = {
  house: HouseModel
  deckPoints: Point[]
  deckEdgeConstraints?: EdgeConstraint[]
  measurements?: MeasurementLine[]
  features?: DeckFeature[]
  boardDirection?: BoardDirectionSettings
  elevationSettings?: ElevationSettings
  poolPoints?: Point[] | null
  poolEdgeConstraints?: EdgeConstraint[]
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

export async function updateProjectName(projectId: string, name: string) {
  const supabase = createClient()
  const userId = await getCurrentUserId()
  const normalizedName = name.trim()

  if (!normalizedName) {
    throw new Error("Project name is required")
  }

  const { data, error } = await supabase
    .from("trall_mono_projects")
    .update({ name: normalizedName, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("user_id", userId)
    .select("*")
    .single<TrallProject>()

  if (error) {
    throw error
  }

  return data
}

export async function deleteProject(projectId: string) {
  const supabase = createClient()
  const userId = await getCurrentUserId()

  const { error } = await supabase
    .from("trall_mono_projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId)

  if (error) {
    throw error
  }
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

  return {
    project,
    version: {
      ...version,
      state: normalizePlannerProjectState(version.state),
    },
  }
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

export function createDefaultPlannerProjectState(): PlannerProjectState {
  const deckPoints = [...initialDeckPoints]
  const areaM2 = polygonArea(deckPoints) / PIXELS_PER_METER ** 2
  const boardRunLm = areaM2 / 0.12
  const houseBounds = getHouseBounds(initialHouse)

  return {
    house: {
      ...initialHouse,
      doors: getHouseDoors(initialHouse).map((door) => ({ ...door })),
      windows: getHouseWindows(initialHouse).map((window) => ({ ...window })),
    },
    deckPoints,
    deckEdgeConstraints: [],
    measurements: [],
    features: [],
    boardDirection: defaultBoardDirection,
    elevationSettings: getDefaultElevationSettings(),
    poolPoints: null,
    poolEdgeConstraints: [],
    viewBox: getFitViewBox(houseBounds, deckPoints, []),
    materials: {
      items: [
        {
          label: "Decking boards",
          value: `${Math.round(boardRunLm)} lm`,
          detail: "28 × 120 mm",
        },
        ...baseMaterials,
      ],
    },
  }
}

export function normalizePlannerProjectState(
  state: PlannerProjectState
): PlannerProjectState {
  return {
    ...state,
    house: {
      ...state.house,
      doors: getHouseDoors(state.house),
      windows: getHouseWindows(state.house),
    },
    elevationSettings: normalizeElevationSettings(state.elevationSettings),
  }
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
