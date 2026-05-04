"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { createClient } from "@/lib/supabase/client"
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
  LayoutDashboardIcon,
  PencilRulerIcon,
} from "lucide-react"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Deck planner",
      url: "/",
      icon: <PencilRulerIcon />,
    },
    {
      title: "Materials",
      url: "/materials",
      icon: <CalculatorIcon />,
    },
  ],
}

type SidebarUser = {
  avatar: string
  email: string
  name: string
}

const fallbackUser: SidebarUser = {
  name: "TrallAI",
  email: "",
  avatar: "",
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [user, setUser] = React.useState<SidebarUser>(fallbackUser)
  const items = data.navMain.map((item) => ({
    ...item,
    isActive:
      item.url === "/"
        ? pathname === "/"
        : item.url !== "#" && pathname.startsWith(item.url),
  }))

  React.useEffect(() => {
    const supabase = createClient()

    async function loadUser() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        setUser(fallbackUser)
        return
      }

      setUser(getSidebarUser(authUser))
    }

    void loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? getSidebarUser(session.user) : fallbackUser)
    })

    return () => subscription.unsubscribe()
  }, [])

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
        <NavMain items={items} />
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}

function getSidebarUser(authUser: {
  email?: string
  user_metadata?: Record<string, unknown>
}): SidebarUser {
  const metadata = authUser.user_metadata ?? {}
  const email = authUser.email ?? ""
  const name =
    getStringMetadata(metadata, "full_name") ??
    getStringMetadata(metadata, "name") ??
    getStringMetadata(metadata, "display_name") ??
    getNameFromEmail(email) ??
    fallbackUser.name

  return {
    name,
    email,
    avatar:
      getStringMetadata(metadata, "avatar_url") ??
      getStringMetadata(metadata, "picture") ??
      "",
  }
}

function getNameFromEmail(email: string) {
  const [localPart] = email.split("@")

  return localPart || null
}

function getStringMetadata(
  metadata: Record<string, unknown>,
  key: string
): string | null {
  const value = metadata[key]

  return typeof value === "string" && value.trim() ? value : null
}
