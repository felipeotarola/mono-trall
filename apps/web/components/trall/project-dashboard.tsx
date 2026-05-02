"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarClockIcon,
  FolderOpenIcon,
  Loader2Icon,
  PencilIcon,
  RulerIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  CURRENT_PROJECT_STORAGE_KEY,
  listProjects,
  updateProjectName,
  type TrallProject,
} from "@/lib/trall/project-storage"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export function ProjectDashboard() {
  const router = useRouter()
  const [projects, setProjects] = useState<TrallProject[]>([])
  const [loading, setLoading] = useState(true)
  const [openingProjectId, setOpeningProjectId] = useState<string | null>(null)
  const projectCount = projects.length
  const latestProject = projects[0]
  const lastUpdatedLabel = useMemo(
    () =>
      latestProject ? formatDateTime(latestProject.updated_at) : "No projects",
    [latestProject]
  )

  useEffect(() => {
    let cancelled = false

    async function loadProjects() {
      setLoading(true)
      try {
        const nextProjects = await listProjects()
        if (!cancelled) {
          setProjects(nextProjects)
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(getErrorMessage(error))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadProjects()

    return () => {
      cancelled = true
    }
  }, [])

  function openProject(project: TrallProject) {
    setOpeningProjectId(project.id)
    window.localStorage.setItem(CURRENT_PROJECT_STORAGE_KEY, project.id)
    router.push(`/?projectId=${project.id}`)
  }

  async function renameProject(project: TrallProject) {
    const nextName = window.prompt("Project name", project.name)
    const normalizedName = nextName?.trim()

    if (nextName === null) {
      return
    }

    if (!normalizedName) {
      toast.error("Project name is required")
      return
    }

    try {
      const updatedProject = await updateProjectName(project.id, normalizedName)
      setProjects((currentProjects) =>
        currentProjects
          .map((currentProject) =>
            currentProject.id === updatedProject.id
              ? updatedProject
              : currentProject
          )
          .sort(
            (a, b) =>
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime()
          )
      )
      toast.success("Project renamed")
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Choose an ongoing deck project to continue planning.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <DashboardMetric label="Ongoing" value={String(projectCount)} />
          <DashboardMetric label="Last updated" value={lastUpdatedLabel} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ongoing projects</CardTitle>
          <CardDescription>
            Opening a project makes it the active planner workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-lg border bg-muted/20 px-4 py-8">
              <p className="text-sm font-medium">No ongoing projects yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Start in the deck planner and your saved projects will appear
                here.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  opening={openingProjectId === project.id}
                  project={project}
                  onOpen={() => openProject(project)}
                  onRename={() => renameProject(project)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  )
}

function ProjectCard({
  onOpen,
  onRename,
  opening,
  project,
}: {
  onOpen: () => void
  onRename: () => void
  opening: boolean
  project: TrallProject
}) {
  return (
    <div className="flex min-h-44 flex-col rounded-lg border bg-background p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted/40">
          <RulerIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold">{project.name}</h2>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClockIcon className="size-3.5" />
            Updated {formatDateTime(project.updated_at)}
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-1 text-xs text-muted-foreground">
        <p>Created {formatDate(project.created_at)}</p>
        <p className="truncate">Project ID {project.id}</p>
      </div>
      <div className="mt-auto flex gap-2">
        <Button
          className="flex-1"
          disabled={opening}
          variant="secondary"
          onClick={onOpen}
        >
          {opening ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <FolderOpenIcon />
          )}
          Open project
        </Button>
        <Button
          aria-label={`Rename ${project.name}`}
          size="icon"
          title="Rename project"
          variant="outline"
          onClick={onRename}
        >
          <PencilIcon />
        </Button>
      </div>
    </div>
  )
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value))
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to load projects"
}
