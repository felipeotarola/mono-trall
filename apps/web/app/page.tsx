"use client"

import { Suspense } from "react"
import { useState } from "react"
import type { CSSProperties } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Workspace } from "@/components/trall/workspace"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"

export default function Page() {
  const [projectTitle, setProjectTitle] = useState("Deck planner")

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title={projectTitle} />
        <Suspense fallback={null}>
          <Workspace onProjectNameChange={setProjectTitle} />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  )
}
