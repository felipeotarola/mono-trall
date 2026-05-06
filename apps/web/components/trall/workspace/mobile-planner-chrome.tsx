import type { ReactNode } from "react"
import {
  CheckCircle2Icon,
  Layers3Icon,
  LightbulbIcon,
  MenuIcon,
  MoreHorizontalIcon,
  MousePointer2Icon,
  RulerIcon,
  Share2Icon,
  SlashIcon,
  SquareIcon,
} from "lucide-react"

import type { ActiveTool, PlannerViewMode } from "@/lib/trall/types"

import type { MobilePanel, MobileToolLabel, SaveStatus } from "./types"

export function MobilePlannerChrome({
  modeLabel,
  mobileDoneVisible,
  mobilePanel,
  mobileTipsOpen,
  mobileToolLabel,
  onClosePanel,
  onDone,
  onFitView,
  onLayers,
  onMenu,
  onMore,
  onSave,
  onSelectTool,
  onToggleTips,
  onViewModeChange,
  onZoomIn,
  onZoomOut,
  projectName,
  saveStatus,
  viewMode,
  zoomPercent,
}: {
  modeLabel: string
  mobileDoneVisible: boolean
  mobilePanel: MobilePanel
  mobileTipsOpen: boolean
  mobileToolLabel: MobileToolLabel
  onClosePanel: () => void
  onDone: () => void
  onFitView: () => void
  onLayers: () => void
  onMenu: () => void
  onMore: () => void
  onSave: () => void
  onSelectTool: (tool: ActiveTool, label: MobileToolLabel) => void
  onToggleTips: () => void
  onViewModeChange: (mode: PlannerViewMode) => void
  onZoomIn: () => void
  onZoomOut: () => void
  projectName: string
  saveStatus: SaveStatus | "Demo mode"
  viewMode: PlannerViewMode
  zoomPercent: number
}) {
  const mobileTools: Array<{
    icon: ReactNode
    label: MobileToolLabel | "Mer"
    tool?: ActiveTool
    onClick?: () => void
  }> = [
    { icon: <MousePointer2Icon />, label: "Välj", tool: "select" },
    { icon: <Share2Icon />, label: "Punkt", tool: "draw" },
    { icon: <SlashIcon />, label: "Kant", tool: "draw" },
    { icon: <SquareIcon />, label: "Rätvinkel", tool: "draw" },
    { icon: <RulerIcon />, label: "Mått", tool: "measure" },
    { icon: <MoreHorizontalIcon />, label: "Mer", onClick: onMore },
  ]
  const editingControlsVisible: boolean = viewMode === "top"

  return (
    <div className="lg:hidden">
      <div className="absolute inset-x-0 top-0 z-40 h-[104px] border-b border-stone-200/70 bg-white/94 px-4 pt-3 shadow-sm backdrop-blur">
        <div className="relative flex items-center justify-center">
          <MobileIconButton label="Open menu" onClick={onMenu}>
            <MenuIcon className="size-5" />
          </MobileIconButton>
          <h1 className="max-w-[13rem] truncate text-center text-lg font-semibold tracking-tight text-zinc-950">
            {projectName}
          </h1>
          {editingControlsVisible ? (
            <MobileIconButton
              label="More"
              className="absolute right-0"
              onClick={onMore}
            >
              <MoreHorizontalIcon className="size-5" />
            </MobileIconButton>
          ) : (
            <div className="absolute right-0 size-10" />
          )}
        </div>
        <div className="mx-auto mt-3 flex h-9 max-w-[11rem] items-center rounded-full border border-stone-200 bg-white p-1 shadow-inner shadow-black/5">
          {(["top", "3d"] as const).map((mode) => (
            <button
              key={mode}
              aria-pressed={viewMode === mode}
              className={
                viewMode === mode
                  ? "h-7 flex-1 rounded-full bg-[#10213d] text-sm font-semibold text-white shadow-md"
                  : "h-7 flex-1 rounded-full text-sm font-semibold text-stone-500"
              }
              type="button"
              onClick={() => onViewModeChange(mode)}
            >
              {mode === "top" ? "Top" : "3D"}
            </button>
          ))}
        </div>
      </div>

      {editingControlsVisible ? (
        <button
          aria-label="Layers"
          className="absolute top-[134px] left-5 z-30 flex size-12 items-center justify-center rounded-xl bg-white/96 text-[#10213d] shadow-lg shadow-black/8"
          type="button"
          onClick={onLayers}
        >
          <Layers3Icon className="size-6" />
        </button>
      ) : null}

      {editingControlsVisible && mobileTipsOpen ? (
        <div className="absolute inset-x-5 bottom-[178px] z-30 rounded-2xl bg-white/94 p-3 shadow-xl shadow-black/8 backdrop-blur">
          <div className="mx-auto -mt-1 mb-2 h-1 w-10 rounded-full bg-stone-200" />
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#eaf2ff] text-[#10213d]">
              <LightbulbIcon className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-950">Tips & hjälp</p>
              <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-zinc-650">
                {getMobileTip(modeLabel)}
              </p>
            </div>
            <button
              aria-label="Stäng tips"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-xl text-zinc-950 hover:bg-stone-100"
              type="button"
              onClick={onToggleTips}
            >
              ×
            </button>
          </div>
        </div>
      ) : editingControlsVisible ? (
        <button
          aria-label="Visa tips"
          className="absolute bottom-[178px] left-5 z-50 flex size-11 items-center justify-center rounded-full bg-white/94 text-[#10213d] shadow-xl shadow-black/8 backdrop-blur"
          type="button"
          onClick={onToggleTips}
        >
          <LightbulbIcon className="size-6" />
        </button>
      ) : null}

      {editingControlsVisible ? (
        <div className="absolute inset-x-5 bottom-[88px] z-40 rounded-2xl bg-white/94 p-2 shadow-xl shadow-black/8 backdrop-blur">
          <div className="grid grid-cols-6 items-stretch gap-1">
            {mobileTools.map((tool) => {
              const active =
                tool.label !== "Mer" ? mobileToolLabel === tool.label : false
              return (
                <button
                  key={tool.label}
                  aria-pressed={active}
                  className={
                    active
                      ? "flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl bg-[#10213d] text-white shadow-md"
                      : "flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[#10213d] hover:bg-stone-100"
                  }
                  type="button"
                  onClick={() =>
                    tool.tool && tool.label !== "Mer"
                      ? onSelectTool(tool.tool, tool.label)
                      : tool.onClick?.()
                  }
                >
                  <span className="[&_svg]:size-5">{tool.icon}</span>
                  <span className="text-[11px] font-medium">{tool.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {editingControlsVisible && mobilePanel ? (
        <div className="absolute inset-x-5 bottom-[148px] z-[60] rounded-2xl bg-white/96 p-3 shadow-2xl shadow-black/12 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-zinc-950">
              {mobilePanel === "layers" ? "Lager" : "Mer"}
            </p>
            <button
              aria-label="Stäng panel"
              className="flex size-7 items-center justify-center rounded-full text-lg hover:bg-stone-100"
              type="button"
              onClick={onClosePanel}
            >
              ×
            </button>
          </div>
          {mobilePanel === "layers" ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <MobilePanelAction
                active={viewMode === "top"}
                label="Top view"
                onClick={() => onViewModeChange("top")}
              />
              <MobilePanelAction
                active={viewMode === "3d"}
                label="3D view"
                onClick={() => onViewModeChange("3d")}
              />
              <MobilePanelAction
                label={`${zoomPercent}% zoom`}
                onClick={onFitView}
              />
              <MobilePanelAction
                active={mobileTipsOpen}
                label="Tips"
                onClick={onToggleTips}
              />
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <MobilePanelAction label="Spara" onClick={onSave} />
              <MobilePanelAction label="Passa in" onClick={onFitView} />
              <MobilePanelAction
                label={mobileTipsOpen ? "Dölj tips" : "Visa tips"}
                onClick={onToggleTips}
              />
              <MobilePanelAction label={saveStatus} onClick={onClosePanel} />
            </div>
          )}
        </div>
      ) : null}

      {editingControlsVisible ? (
        <div className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-[minmax(5.25rem,1fr)_auto_minmax(5.9rem,1fr)] items-center gap-2 rounded-2xl bg-white/95 p-2.5 shadow-xl shadow-black/12 backdrop-blur">
          <div className="flex items-center gap-2 text-[#10213d]">
            <RulerIcon className="size-6 shrink-0" />
            <div>
              <p className="text-sm font-semibold leading-tight">Skala 1:100</p>
              <p className="text-[11px] leading-tight text-zinc-500">
                1 ruta = 0.5 m
              </p>
            </div>
          </div>
          <div className="flex h-10 items-center rounded-xl bg-stone-50 p-1 shadow-inner">
            <button
              aria-label="Zoom out"
              className="flex size-8 items-center justify-center rounded-lg bg-white text-lg shadow-sm"
              type="button"
              onClick={onZoomOut}
            >
              -
            </button>
            <span className="w-10 text-center text-sm font-semibold">
              {zoomPercent}%
            </span>
            <button
              aria-label="Zoom in"
              className="flex size-8 items-center justify-center rounded-lg bg-white text-lg shadow-sm"
              type="button"
              onClick={onZoomIn}
            >
              +
            </button>
          </div>
          <button
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#10213d] px-3 text-sm font-semibold text-white shadow-lg"
            type="button"
            onClick={onDone}
          >
            <CheckCircle2Icon className="size-5" />
            Klar
          </button>
        </div>
      ) : null}

      {mobileDoneVisible ? (
        <div className="fixed left-1/2 bottom-24 z-[70] -translate-x-1/2 rounded-full bg-[#10213d] px-4 py-2 text-sm font-semibold text-white shadow-lg">
          Sparat
        </div>
      ) : null}
    </div>
  )
}

function MobilePanelAction({
  active,
  label,
  onClick,
}: {
  active?: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-pressed={active}
      className={
        active
          ? "h-10 rounded-xl bg-[#10213d] px-3 text-sm font-semibold text-white"
          : "h-10 rounded-xl bg-stone-100 px-3 text-sm font-medium text-[#10213d]"
      }
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function MobileIconButton({
  children,
  className = "absolute left-0",
  label,
  onClick,
}: {
  children: ReactNode
  className?: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-label={label}
      className={`${className} flex size-10 items-center justify-center rounded-xl border border-stone-200 bg-white/95 text-zinc-950 shadow-sm`}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function getMobileTip(modeLabel: string) {
  if (modeLabel === "Mät") {
    return "Tryck och dra för att mäta avstånd i planen."
  }

  if (modeLabel === "Rita") {
    return "Tryck ut punkter för att rita formen på altanen."
  }

  return "Dra markerade punkter för att justera formen. Dubbelklicka på en kant för att lägga till en nod."
}
