"use client"

import type { CSSProperties, ReactNode } from "react"
import { useState } from "react"
import {
  ClipboardListIcon,
  HandIcon,
  Maximize2Icon,
  Minimize2Icon,
  PencilRulerIcon,
  PointerIcon,
  QuoteIcon,
  RulerIcon,
  Undo2Icon,
} from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from "@workspace/ui/components/sidebar"

type Tool = {
  label: string
  icon: ReactNode
  active?: boolean
  onClick?: () => void
}

type Metric = {
  label: string
  value: string
}

type Material = {
  label: string
  value: string
  detail: string
}

const metrics: Metric[] = [
  { label: "Deck area", value: "42.8 m²" },
  { label: "Perimeter", value: "28.4 m" },
  { label: "Board run", value: "356 lm" },
  { label: "Waste factor", value: "10%" },
]

const materials: Material[] = [
  { label: "Decking boards", value: "356 lm", detail: "28 × 120 mm" },
  { label: "Joists", value: "94 lm", detail: "45 × 145 mm" },
  { label: "Post anchors", value: "12 pcs", detail: "Galvanized" },
  { label: "Deck screws", value: "1,250 pcs", detail: "A4 stainless" },
]

const deckPoints: Array<[number, number]> = [
  [184, 364],
  [704, 364],
  [766, 558],
  [148, 602],
]

export default function Page() {
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
        <Workspace />
      </SidebarInset>
    </SidebarProvider>
  )
}

function Workspace() {
  const { setOpen, setOpenMobile } = useSidebar()
  const [calculatorOpen, setCalculatorOpen] = useState(true)

  function toggleWorkspacePanels() {
    if (calculatorOpen) {
      setOpen(false)
      setOpenMobile(false)
      setCalculatorOpen(false)
      return
    }

    setOpen(true)
    setOpenMobile(false)
    setCalculatorOpen(true)
  }

  const expandTool: Tool = {
    label: calculatorOpen ? "Zoom fit" : "Restore panels",
    icon: calculatorOpen ? <Maximize2Icon /> : <Minimize2Icon />,
    onClick: toggleWorkspacePanels,
  }

  return (
    <main className="flex flex-1 flex-col overflow-x-hidden bg-stone-100/60 dark:bg-background">
      <div className="flex flex-1 flex-col gap-3 p-3 pb-24 sm:p-4 lg:pb-4 xl:p-5">
        <div
          className={
            calculatorOpen
              ? "grid flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]"
              : "grid flex-1 gap-3 lg:grid-cols-1"
          }
        >
          <section className="relative min-w-0 overflow-hidden rounded-lg border bg-stone-50 shadow-sm dark:bg-zinc-950">
            <CanvasToolbar extraTool={expandTool} />
            <PlanningSurface />
          </section>

          {calculatorOpen ? (
            <aside className="hidden min-w-0 lg:block">
              <CalculatorPanel />
            </aside>
          ) : null}
        </div>

        <section className="lg:hidden">
          <CalculatorPanel />
        </section>
      </div>

      <MobileSummary />
    </main>
  )
}

function PlanningSurface() {
  return (
    <div className="relative min-h-[calc(100svh-11rem)] overflow-hidden bg-stone-50 pt-16 dark:bg-zinc-950 md:min-h-[calc(100svh-7rem)]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.48)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.48)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.36)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.36)_1px,transparent_1px)] bg-[size:160px_160px]" />
      <div className="absolute left-0 top-16 h-px w-full bg-blue-500/20" />
      <div className="absolute left-16 top-0 h-full w-px bg-blue-500/20" />
      <div className="absolute left-16 top-16 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/50" />

      <div className="absolute left-4 top-20 hidden rounded-md border bg-background/80 px-2 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur sm:block">
        x 0, y 0
      </div>

      <p className="absolute right-4 top-20 rounded-md border bg-background/85 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur">
        Drag points to adjust deck shape
      </p>

      <div className="relative flex min-h-[calc(100svh-13.5rem)] items-center justify-center px-3 py-8 md:min-h-[calc(100svh-10rem)]">
        <div className="aspect-square w-[min(900px,98%)]">
          <PlanSvg />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 border-t bg-background/80 px-4 py-3 text-xs text-muted-foreground backdrop-blur sm:flex-row sm:items-end sm:justify-between">
        <ScaleIndicator />
        <span>Scale 1:100 · 1 grid square = 0.5 m</span>
      </div>
    </div>
  )
}

function CanvasToolbar({ extraTool }: { extraTool: Tool }) {
  const tools: Tool[][] = [
    [
      { label: "Select", icon: <PointerIcon />, active: true },
      { label: "Draw deck", icon: <PencilRulerIcon /> },
      { label: "Measure", icon: <RulerIcon /> },
      { label: "Pan", icon: <HandIcon /> },
    ],
    [{ label: "Undo", icon: <Undo2Icon /> }],
    [extraTool],
  ]

  return (
    <div className="absolute left-3 right-3 top-3 z-20 flex items-center gap-2 overflow-x-auto rounded-lg border bg-background/90 p-1.5 shadow-sm backdrop-blur">
      {tools.map((group, groupIndex) => (
        <div key={groupIndex} className="flex items-center gap-1">
          {groupIndex > 0 ? (
            <Separator orientation="vertical" className="mx-1 h-6" />
          ) : null}
          {group.map((tool) => (
            <ToolButton key={tool.label} {...tool} />
          ))}
        </div>
      ))}
    </div>
  )
}

function PlanSvg() {
  return (
    <svg
      viewBox="100 16 740 660"
      className="h-full w-full drop-shadow-sm"
      role="img"
      aria-label="Deck plan with house outline, deck polygon, dimensions, and draggable corner handles"
    >
      <defs>
        <pattern
          id="deck-board-lines"
          width="26"
          height="26"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(8)"
        >
          <path
            d="M 0 0 L 0 26"
            className="stroke-amber-950/18 dark:stroke-amber-100/18"
            strokeWidth="3"
          />
        </pattern>
      </defs>

      <rect
        x="238"
        y="116"
        width="436"
        height="252"
        rx="6"
        className="fill-slate-100 stroke-slate-700 dark:fill-slate-900 dark:stroke-slate-300"
        strokeWidth="5"
      />
      <path
        d="M238 116 L456 38 L674 116"
        className="fill-none stroke-slate-700 dark:stroke-slate-300"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
      <rect
        x="404"
        y="270"
        width="96"
        height="98"
        className="fill-background stroke-slate-500 dark:stroke-slate-400"
        strokeWidth="3"
      />
      <path
        d="M258 178 H326 M584 178 H652 M258 254 H326 M584 254 H652"
        className="stroke-slate-400 dark:stroke-slate-500"
        strokeLinecap="round"
        strokeWidth="5"
      />
      <text
        x="456"
        y="232"
        textAnchor="middle"
        className="fill-slate-700 text-[22px] font-medium dark:fill-slate-200"
      >
        House
      </text>

      <polygon
        points="184,364 704,364 766,558 148,602"
        className="fill-amber-300/42 stroke-amber-800 dark:fill-amber-400/24 dark:stroke-amber-300"
        strokeLinejoin="round"
        strokeWidth="5"
      />
      <polygon
        points="184,364 704,364 766,558 148,602"
        fill="url(#deck-board-lines)"
        className="stroke-transparent"
      />
      <path
        d="M238 396 L710 396 M210 438 L724 438 M182 482 L740 482 M162 526 L754 526 M150 570 L762 570"
        className="stroke-amber-900/20 dark:stroke-amber-100/20"
        strokeWidth="3"
      />
      <path
        d="M184 364 L704 364"
        className="stroke-orange-500"
        strokeLinecap="round"
        strokeWidth="9"
      />
      <path
        d="M184 364 L704 364"
        className="stroke-orange-950 dark:stroke-orange-100"
        strokeLinecap="round"
        strokeWidth="3"
      />

      <DimensionLine
        x1={184}
        y1={338}
        x2={704}
        y2={338}
        label="12.4 m"
        labelX={444}
        labelY={320}
      />
      <DimensionLine
        x1={792}
        y1={558}
        x2={730}
        y2={364}
        label="5.1 m"
        labelX={790}
        labelY={462}
        rotate={72}
      />
      <DimensionLine
        x1={148}
        y1={628}
        x2={766}
        y2={584}
        label="14.2 m"
        labelX={460}
        labelY={656}
      />

      {deckPoints.map(([x, y], index) => (
        <DeckHandle
          key={`${x}-${y}`}
          x={x}
          y={y}
          label={`P${index + 1}`}
          selected={index === 0}
        />
      ))}
    </svg>
  )
}

function CalculatorPanel() {
  return (
    <div className="space-y-3">
      <Card size="sm" className="bg-zinc-950 text-white dark:bg-primary">
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-white/70">Estimated material price</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              18,940 kr
            </p>
            <p className="mt-1 text-xs text-white/60">
              Includes 10% waste factor
            </p>
          </div>
          <Button className="w-full bg-white text-zinc-950 hover:bg-white/90">
            <QuoteIcon />
            Create quote
          </Button>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Measurements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {metrics.map((metric) => (
            <MetricRow key={metric.label} {...metric} />
          ))}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Materials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {materials.map((material) => (
            <MaterialRow key={material.label} {...material} />
          ))}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Project summary</CardTitle>
          <CardDescription>Backyard deck extension</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <MetricRow label="House template" value="Single family house" />
          <MetricRow label="Deck type" value="Attached angled edge" />
          <MetricRow label="Last saved" value="Mock draft · 2 min ago" />
        </CardContent>
      </Card>
    </div>
  )
}

function MobileSummary() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 shadow-lg backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">18,940 kr</p>
          <p className="text-xs text-muted-foreground">
            42.8 m² deck · 356 lm boards
          </p>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button>
              <ClipboardListIcon />
              Summary
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="max-h-[88svh] overflow-y-auto rounded-t-xl"
          >
            <SheetHeader>
              <SheetTitle>Calculation panel</SheetTitle>
              <SheetDescription>
                Project quantities, materials, and quote estimate.
              </SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-4">
              <CalculatorPanel />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

function ToolButton({ label, icon, active, onClick }: Tool) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="sm"
      className="h-8 min-w-fit gap-1.5 px-2"
      aria-pressed={active}
      title={label}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </Button>
  )
}

function MetricRow({ label, value }: Metric) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/25 px-3 py-2">
      <span className="min-w-0 truncate text-sm text-muted-foreground">
        {label}
      </span>
      <span className="shrink-0 text-sm font-semibold">{value}</span>
    </div>
  )
}

function MaterialRow({ label, value, detail }: Material) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 rounded-lg border bg-muted/25 px-3 py-2">
      <span className="min-w-0 truncate text-sm font-medium">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
      <span className="min-w-0 truncate text-xs text-muted-foreground">
        {detail}
      </span>
    </div>
  )
}

function ScaleIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="mb-1 h-3 w-24 border-x border-b border-foreground/70" />
      <span className="font-medium text-foreground">2 m</span>
    </div>
  )
}

function DeckHandle({
  x,
  y,
  label,
  selected,
}: {
  x: number
  y: number
  label: string
  selected?: boolean
}) {
  return (
    <g className="group/handle cursor-grab active:cursor-grabbing">
      {selected ? (
        <circle
          cx={x}
          cy={y}
          r="25"
          className="fill-orange-400/20 stroke-orange-500/35"
          strokeWidth="3"
        />
      ) : null}
      <circle
        cx={x}
        cy={y}
        r="16"
        className="fill-background stroke-orange-700 transition group-hover/handle:stroke-orange-500 dark:stroke-orange-300"
        strokeWidth="5"
      />
      <circle
        cx={x}
        cy={y}
        r="5"
        className="fill-orange-700 transition group-hover/handle:fill-orange-500 dark:fill-orange-300"
      />
      <text
        x={x + 22}
        y={y - 13}
        className="pointer-events-none fill-muted-foreground text-[15px] font-medium"
      >
        {label}
      </text>
    </g>
  )
}

function DimensionLine({
  x1,
  y1,
  x2,
  y2,
  label,
  labelX,
  labelY,
  rotate = 0,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  label: string
  labelX: number
  labelY: number
  rotate?: number
}) {
  return (
    <g className="stroke-sky-700 text-[17px] font-semibold dark:stroke-sky-300">
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="3" />
      <circle cx={x1} cy={y1} r="4" className="fill-sky-700 dark:fill-sky-300" />
      <circle cx={x2} cy={y2} r="4" className="fill-sky-700 dark:fill-sky-300" />
      <text
        x={labelX}
        y={labelY}
        textAnchor="middle"
        transform={`rotate(${rotate} ${labelX} ${labelY})`}
        className="fill-sky-700 stroke-transparent dark:fill-sky-300"
      >
        {label}
      </text>
    </g>
  )
}
