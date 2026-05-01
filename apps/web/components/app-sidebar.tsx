"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import {
  CalculatorIcon,
  FileTextIcon,
  FolderIcon,
  LayoutDashboardIcon,
  PencilRulerIcon,
  Settings2Icon,
} from "lucide-react"

const data = {
  user: {
    name: "TrallAI",
    email: "planner@trall.ai",
    avatar: "",
  },
  navMain: [
    {
      title: "Workspace",
      url: "#",
      icon: (
        <LayoutDashboardIcon
        />
      ),
    },

    {
      title: "Projects",
      url: "#",
      icon: (
        <FolderIcon
        />
      ),
    },
    {
      title: "Deck planner",
      url: "#",
      isActive: true,
      icon: (
        <PencilRulerIcon
        />
      ),
    },
    {
      title: "Materials",
      url: "#",
      icon: (
        <CalculatorIcon
        />
      ),
    },
    {
      title: "Quotes",
      url: "#",
      icon: (
        <FileTextIcon
        />
      ),
    },
    {
      title: "Settings",
      url: "#",
      icon: (
        <Settings2Icon
        />
      ),
    },
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#">
                <PencilRulerIcon className="size-5!" />
                <span className="text-base font-semibold">TrallAI</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
