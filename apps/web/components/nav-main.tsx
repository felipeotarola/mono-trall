"use client"

import type { FormEvent, ReactNode } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  createDefaultPlannerProjectState,
  createProject,
  CURRENT_PROJECT_STORAGE_KEY,
} from "@/lib/trall/project-storage"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import { CirclePlusIcon, Loader2Icon } from "lucide-react"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: ReactNode
    isActive?: boolean
  }[]
}) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [projectName, setProjectName] = useState("")

  async function handleQuickCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedName = projectName.trim()
    if (!normalizedName) {
      toast.error("Project name is required")
      return
    }

    setCreating(true)
    try {
      const project = await createProject(
        normalizedName,
        createDefaultPlannerProjectState()
      )
      window.localStorage.setItem(CURRENT_PROJECT_STORAGE_KEY, project.id)
      setCreateDialogOpen(false)
      setProjectName("")
      router.push(`/?projectId=${project.id}`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create project"
      )
    } finally {
      setCreating(false)
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <SidebarMenuButton
                  title="Skapa projekt"
                  disabled={creating}
                  className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                >
                  {creating ? (
                    <Loader2Icon className="animate-spin" />
                  ) : (
                    <CirclePlusIcon />
                  )}
                  <span>Skapa projekt</span>
                </SidebarMenuButton>
              </DialogTrigger>
              <DialogContent>
                <form className="grid gap-4" onSubmit={handleQuickCreate}>
                  <DialogHeader>
                    <DialogTitle>Create project</DialogTitle>
                    <DialogDescription>
                      Name the project before opening a new planner workspace.
                    </DialogDescription>
                  </DialogHeader>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Project name</span>
                    <Input
                      autoFocus
                      disabled={creating}
                      placeholder="Backyard deck extension"
                      value={projectName}
                      onChange={(event) => setProjectName(event.target.value)}
                    />
                  </label>
                  <DialogFooter>
                    <Button
                      disabled={creating}
                      type="button"
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button disabled={creating} type="submit">
                      {creating ? (
                        <Loader2Icon className="animate-spin" />
                      ) : (
                        <CirclePlusIcon />
                      )}
                      Create project
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild={item.url !== "#"}
                tooltip={item.title}
                isActive={item.isActive}
              >
                {item.url === "#" ? (
                  <>
                    {item.icon}
                    <span>{item.title}</span>
                  </>
                ) : (
                  <a href={item.url}>
                    {item.icon}
                    <span>{item.title}</span>
                  </a>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
