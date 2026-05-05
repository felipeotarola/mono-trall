"use client"

import { Suspense, useState } from "react"
import type { CSSProperties } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { Workspace } from "@/components/trall/workspace"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"

export default function DemoPage() {
  const [projectTitle, setProjectTitle] = useState("Demo project")

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 58)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <Suspense fallback={null}>
          <Workspace demoMode onProjectNameChange={setProjectTitle} />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  )
}
