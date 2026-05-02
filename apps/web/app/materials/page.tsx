"use client"

import type { CSSProperties } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { MaterialLibraryManager } from "@/components/trall/material-library-manager"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"

export default function MaterialsPage() {
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
        <SiteHeader />
        <main className="flex flex-1 flex-col overflow-x-hidden bg-stone-100/60 dark:bg-background">
          <MaterialLibraryManager />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
