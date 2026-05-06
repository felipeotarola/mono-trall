import type { ReactNode } from "react"
import {
  BoxIcon,
  HomeIcon,
  ImageIcon,
  PackageIcon,
} from "lucide-react"

export type InspectorTab = "overview" | "materials" | "3d" | "ai" | "house"

export const inspectorTabs: Array<{
  id: InspectorTab
  icon: typeof HomeIcon
  label: string
}> = [
  { id: "overview", icon: HomeIcon, label: "Översikt" },
  { id: "materials", icon: PackageIcon, label: "Material" },
  { id: "3d", icon: BoxIcon, label: "3D" },
  { id: "ai", icon: ImageIcon, label: "AI-bild" },
  { id: "house", icon: HomeIcon, label: "Hus" },
]

export function InspectorTabPanel({
  active,
  children,
}: {
  active: boolean
  children: ReactNode
}) {
  return (
    <div
      className={active ? "space-y-3 py-3" : "hidden"}
      role="tabpanel"
      aria-hidden={!active}
    >
      {children}
    </div>
  )
}
