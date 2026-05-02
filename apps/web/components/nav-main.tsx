"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  createDefaultPlannerProjectState,
  createProject,
  CURRENT_PROJECT_STORAGE_KEY,
} from "@/lib/trall/project-storage"
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
    icon?: React.ReactNode
    isActive?: boolean
  }[]
}) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  async function handleQuickCreate() {
    const projectName = window.prompt("Project name")
    const normalizedName = projectName?.trim()

    if (projectName === null) {
      return
    }

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
            <SidebarMenuButton
              tooltip="Quick Create"
              disabled={creating}
              className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              onClick={handleQuickCreate}
            >
              {creating ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <CirclePlusIcon />
              )}
              <span>Quick Create</span>
            </SidebarMenuButton>
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
