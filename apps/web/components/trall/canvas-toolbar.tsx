"use client"

import {
  MoreHorizontalIcon,
  SaveIcon,
  Undo2Icon,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import type { Tool } from "@/lib/trall/types"

export function CanvasToolbar({
  extraTool,
  modeLabel,
  onSaveProject,
  saveStatus,
}: {
  extraTool: Tool
  modeLabel: string
  onSaveProject: () => void
  saveStatus: string
}) {
  return (
    <div className="absolute top-3 left-3 z-20 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-white/92 p-2 shadow-sm backdrop-blur">
      <div className="flex min-h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white/70 px-3 py-1">
        <span className="hidden text-[10px] font-semibold tracking-[0.12em] text-stone-500 uppercase sm:inline">
          Mode
        </span>
        <span className="rounded-md bg-stone-950 px-2.5 py-1 text-xs font-semibold text-white">
          {modeLabel}
        </span>
      </div>

      <Button
        aria-label="Save project"
        className="h-10 min-w-10 gap-1.5 px-2.5"
        size="lg"
        title="Save project"
        variant="outline"
        onClick={onSaveProject}
      >
        <SaveIcon />
        <span className="hidden sm:inline">Save</span>
      </Button>

      <span className="hidden h-10 min-w-24 items-center justify-center rounded-lg px-2 text-xs font-medium text-muted-foreground md:flex">
        {saveStatus}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="More project actions"
            className="size-10"
            size="icon-lg"
            variant="ghost"
          >
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Project actions</DropdownMenuLabel>
          <ProjectAction
            disabled
            icon={Undo2Icon}
            label="Undo"
            title="Undo is not available yet"
          />
          <DropdownMenuItem
            className="h-9 gap-2"
            onSelect={() => extraTool.onClick?.()}
          >
            {extraTool.icon}
            {extraTool.label}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="font-normal text-muted-foreground">
            Status: {saveStatus}
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function ProjectAction({
  disabled,
  icon: Icon,
  label,
  title,
}: {
  disabled?: boolean
  icon: LucideIcon
  label: string
  title?: string
}) {
  return (
    <DropdownMenuItem disabled={disabled} className="h-9 gap-2" title={title}>
      <Icon />
      {label}
    </DropdownMenuItem>
  )
}
