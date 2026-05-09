import type { ReactNode } from "react"
import {
  MoreHorizontalIcon,
  PanelRightIcon,
  PencilIcon,
  Redo2Icon,
  Undo2Icon,
} from "lucide-react"

import type { SaveStatus } from "./types"

export function DesktopWorkspaceHeader({
  canRedo,
  canUndo,
  onRedo,
  onToggleSidebar,
  onUndo,
  projectName,
  saveStatus,
}: {
  canRedo: boolean
  canUndo: boolean
  onRedo: () => void
  onToggleSidebar: () => void
  onUndo: () => void
  projectName: string
  saveStatus: SaveStatus | "Demo mode"
}) {
  return (
    <div className="hidden h-[72px] shrink-0 items-center justify-between border-b border-stone-200 bg-white px-6 lg:flex">
      <div className="flex min-w-0 items-center gap-4">
        <button
          aria-label="Toggle navigation sidebar"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-stone-900 hover:bg-stone-100"
          type="button"
          onClick={onToggleSidebar}
        >
          <PanelRightIcon className="size-5" />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-semibold tracking-tight text-stone-950">
              {projectName}
            </h1>
            <button
              aria-label="Redigera projektnamn"
              className="flex size-6 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-950"
              type="button"
            >
              <PencilIcon className="size-3.5" />
            </button>
          </div>
          <p className="mt-0.5 text-xs text-stone-500">
            {saveStatus === "Saved"
              ? "Senast sparad nyss"
              : saveStatus === "Demo mode"
                ? "Demo-läge"
                : saveStatus}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <DesktopHeaderButton
          disabled={!canUndo}
          label="Ångra"
          onClick={onUndo}
        >
          <Undo2Icon />
        </DesktopHeaderButton>
        <DesktopHeaderButton
          disabled={!canRedo}
          label="Gör om"
          onClick={onRedo}
        >
          <Redo2Icon />
        </DesktopHeaderButton>
        <DesktopHeaderButton label="Fler alternativ">
          <MoreHorizontalIcon />
        </DesktopHeaderButton>
      </div>
    </div>
  )
}

function DesktopHeaderButton({
  children,
  disabled = false,
  label,
  onClick,
}: {
  children: ReactNode
  disabled?: boolean
  label: string
  onClick?: () => void
}) {
  return (
    <button
      aria-label={label}
      className={
        disabled
          ? "flex size-8 items-center justify-center rounded-lg text-stone-300 [&_svg]:size-4"
          : "flex size-8 items-center justify-center rounded-lg text-stone-700 hover:bg-stone-100 hover:text-stone-950 [&_svg]:size-4"
      }
      disabled={disabled}
      title={label}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  )
}
