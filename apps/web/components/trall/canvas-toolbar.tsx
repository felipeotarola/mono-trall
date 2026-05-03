"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  CheckIcon,
  ChevronDownIcon,
  HandIcon,
  MoreHorizontalIcon,
  PencilRulerIcon,
  PointerIcon,
  RulerIcon,
  SaveIcon,
  Undo2Icon,
  WavesIcon,
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
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"
import type { ActiveTool, Tool } from "@/lib/trall/types"

export function CanvasToolbar({
  activeTool,
  extraTool,
  onAddPool,
  onSaveProject,
  saveStatus,
  setActiveTool,
}: {
  activeTool: ActiveTool
  extraTool: Tool
  onAddPool: () => void
  onSaveProject: () => void
  saveStatus: string
  setActiveTool: (tool: ActiveTool) => void
}) {
  const [toolbarRef, compact] = useCompactToolbar()
  const editingTools: Tool[] = [
    {
      label: "Select",
      icon: <PointerIcon />,
      active: activeTool === "select",
      onClick: () => setActiveTool("select"),
    },
    {
      label: "Draw deck",
      icon: <PencilRulerIcon />,
      active: activeTool === "draw",
      onClick: () => setActiveTool("draw"),
    },
    {
      label: "Add pool",
      icon: <WavesIcon />,
      onClick: onAddPool,
    },
    {
      label: "Measure",
      icon: <RulerIcon />,
      active: activeTool === "measure",
      onClick: () => setActiveTool("measure"),
    },
    {
      label: "Pan",
      icon: <HandIcon />,
      active: activeTool === "pan",
      onClick: () => setActiveTool("pan"),
    },
  ]

  return (
    <div
      ref={toolbarRef}
      className={cn(
        "absolute top-3 left-3 z-20 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-white/92 p-2 shadow-sm backdrop-blur",
        compact ? "right-auto" : "right-3"
      )}
    >
      {compact ? (
        <CompactToolMenu editingTools={editingTools} />
      ) : (
        <ToolbarGroup label="Edit">
          {editingTools.map((tool) => (
            <ToolButton key={tool.label} {...tool} />
          ))}
        </ToolbarGroup>
      )}

      {compact ? (
        <CompactProjectActions
          extraTool={extraTool}
          onSaveProject={onSaveProject}
          saveStatus={saveStatus}
        />
      ) : (
        <ToolbarGroup label="Project">
          <ToolButton
            icon={<SaveIcon />}
            label="Save"
            onClick={onSaveProject}
          />
          <ToolButton
            disabled
            icon={<Undo2Icon />}
            label="Undo"
            title="Undo is not available yet"
          />
          <ToolButton {...extraTool} />
          <ToolbarStatus>{saveStatus}</ToolbarStatus>
        </ToolbarGroup>
      )}
    </div>
  )
}

function useCompactToolbar() {
  const ref = useRef<HTMLDivElement>(null)
  const [compact, setCompact] = useState(true)

  useEffect(() => {
    const toolbar = ref.current
    const parent = toolbar?.parentElement

    if (!parent) {
      return
    }

    const updateCompact = (width: number) => {
      setCompact(width < 1120)
    }

    updateCompact(parent.getBoundingClientRect().width)

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        updateCompact(entry.contentRect.width)
      }
    })

    observer.observe(parent)

    return () => {
      observer.disconnect()
    }
  }, [])

  return [ref, compact] as const
}

function ToolbarGroup({
  children,
  compact = false,
  label,
}: {
  children: ReactNode
  compact?: boolean
  label: string
}) {
  return (
    <div
      className={cn(
        "flex min-h-10 items-center gap-1 rounded-lg border border-stone-200 bg-white/70 px-1.5 py-1",
        compact && "border-transparent bg-transparent p-0"
      )}
    >
      <span className="hidden px-1 text-[10px] font-semibold tracking-[0.12em] text-stone-500 uppercase lg:inline">
        {label}
      </span>
      <Separator orientation="vertical" className="mx-1 hidden h-6 lg:block" />
      <div className="flex flex-wrap items-center gap-1">{children}</div>
    </div>
  )
}

function CompactToolMenu({ editingTools }: { editingTools: Tool[] }) {
  const activeTool = editingTools.find((tool) => tool.active) ?? editingTools[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Choose editing tool"
          className="h-10 min-w-10 gap-2 px-2.5"
          size="lg"
          variant="outline"
        >
          {activeTool?.icon}
          <span className="hidden sm:inline">{activeTool?.label ?? "Tools"}</span>
          <span className="sm:hidden">Tools</span>
          <ChevronDownIcon className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel>Editing tools</DropdownMenuLabel>
        {editingTools.map((tool) => (
          <DropdownMenuItem
            key={tool.label}
            className="h-9 gap-2"
            onSelect={() => tool.onClick?.()}
          >
            {tool.icon}
            <span className="flex-1">{tool.label}</span>
            {tool.active ? <CheckIcon className="size-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CompactProjectActions({
  extraTool,
  onSaveProject,
  saveStatus,
}: {
  extraTool: Tool
  onSaveProject: () => void
  saveStatus: string
}) {
  return (
    <div className="ml-auto flex min-h-10 items-center gap-1 rounded-lg border border-stone-200 bg-white/70 px-1.5 py-1">
      <Button
        aria-label="Save project"
        className="h-10 min-w-10 px-2.5"
        size="lg"
        title="Save"
        variant="ghost"
        onClick={onSaveProject}
      >
        <SaveIcon />
        <span className="hidden sm:inline">Save</span>
      </Button>
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
          <DropdownMenuItem disabled className="h-9 gap-2">
            <Undo2Icon />
            Undo
          </DropdownMenuItem>
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

function ToolbarStatus({
  children,
  minWidthClassName = "min-w-24",
}: {
  children: ReactNode
  minWidthClassName?: string
}) {
  return (
    <div
      className={`flex h-8 ${minWidthClassName} items-center justify-center rounded-md px-2 text-xs font-medium text-muted-foreground`}
    >
      {children}
    </div>
  )
}

function ToolButton({
  active,
  disabled,
  icon,
  label,
  onClick,
  title,
}: Tool & { disabled?: boolean; title?: string }) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="lg"
      className="h-10 min-w-10 gap-1.5 px-2.5"
      aria-pressed={active}
      disabled={disabled}
      title={title ?? label}
      onClick={onClick}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}
