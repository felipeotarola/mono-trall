"use client"

import type { CSSProperties, ReactNode } from "react"
import { useState } from "react"
import {
  ClipboardListIcon,
  Maximize2Icon,
  Minimize2Icon,
  MinusIcon,
  PencilRulerIcon,
  PlusIcon,
  PointerIcon,
  QuoteIcon,
  RulerIcon,
  Undo2Icon,
} from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
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

const tools = [
  { label: "Select", icon: PointerIcon, active: true },
  { label: "Draw deck", icon: PencilRulerIcon },
  { label: "Measure", icon: RulerIcon },
  { label: "Undo", icon: Undo2Icon },
]

const measurements: Array<[string, string]> = [
  ["Deck area", "42.8 m2"],
  ["Perimeter", "28.4 m"],
  ["Board run", "356 lm"],
  ["Waste factor", "10%"],
]

const deckPoints: Array<[number, number]> = [
  [184, 364],
  [704, 364],
  [766, 558],
  [148, 602],
]

const materials = [
  { label: "Decking boards", detail: "28 x 120 mm", value: "356 lm" },
  { label: "Joists", detail: "45 x 145 mm", value: "94 lm" },
  { label: "Post anchors", detail: "Galvanized", value: "12 pcs" },
  { label: "Deck screws", detail: "A4 stainless", value: "1,250 pcs" },
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

  return (
    <main className="flex flex-1 flex-col bg-muted/20">
      <div className="@container/main flex flex-1 flex-col gap-4 p-3 pb-24 sm:p-4 md:p-6 lg:pb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Draft estimate</Badge>
              <span className="text-xs text-muted-foreground">Scale 1:100</span>
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
              Backyard deck extension
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {!calculatorOpen ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCalculatorOpen(true)}
              >
                <ClipboardListIcon />
                Summary
              </Button>
            ) : null}
            <Button variant="outline" size="sm">
              <MinusIcon />
              80%
            </Button>
            <Button variant="outline" size="icon-sm" aria-label="Zoom in">
              <PlusIcon />
            </Button>
          </div>
        </div>

        <div
          className={
            calculatorOpen
              ? "grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_240px] xl:grid-cols-[minmax(0,1fr)_280px]"
              : "grid flex-1 gap-4 lg:grid-cols-1"
          }
        >
          <section className="flex min-h-[calc(100svh-15rem)] flex-col overflow-hidden rounded-xl border bg-card shadow-sm md:min-h-[calc(100svh-13rem)]">
            <div className="flex flex-col gap-3 border-b bg-background/80 p-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-base font-semibold tracking-tight">
                  Planning surface
                </h1>
                <p className="text-sm text-muted-foreground">
                  Draw the deck footprint against the house outline.
                </p>
              </div>
              <div className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1">
                {tools.map((tool) => (
                  <ToolButton
                    key={tool.label}
                    label={tool.label}
                    icon={<tool.icon />}
                    active={tool.active}
                  />
                ))}
                <ToolButton
                  label={
                    calculatorOpen ? "Expand workspace" : "Restore panels"
                  }
                  icon={
                    calculatorOpen ? <Maximize2Icon /> : <Minimize2Icon />
                  }
                  onClick={toggleWorkspacePanels}
                />
              </div>
            </div>

            <div className="relative flex flex-1 flex-col items-center justify-start overflow-hidden bg-background p-4">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.55)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.55)_1px,transparent_1px)] bg-[size:28px_28px]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.35)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.35)_1px,transparent_1px)] bg-[size:140px_140px]" />

              <div className="relative aspect-square w-[min(760px,96%)]">
                <svg
                  viewBox="100 16 740 660"
                  className="h-full w-full drop-shadow-sm"
                  role="img"
                  aria-label="Deck plan with house outline, deck polygon, dimensions, and corner handles"
                >
                      <defs>
                        <pattern
                          id="deck-board-lines"
                          width="24"
                          height="24"
                          patternUnits="userSpaceOnUse"
                          patternTransform="rotate(8)"
                        >
                          <path
                            d="M 0 0 L 0 24"
                            className="stroke-amber-900/20"
                            strokeWidth="3"
                          />
                        </pattern>
                      </defs>

                      <rect
                        x="246"
                        y="116"
                        width="420"
                        height="248"
                        rx="10"
                        className="fill-slate-100 stroke-slate-500 dark:fill-slate-900 dark:stroke-slate-500"
                        strokeWidth="4"
                      />
                      <path
                        d="M246 116 L456 38 L666 116"
                        className="fill-none stroke-slate-500"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="4"
                      />
                      <rect
                        x="406"
                        y="270"
                        width="90"
                        height="94"
                        className="fill-background stroke-slate-400"
                        strokeWidth="3"
                      />
                      <text
                        x="456"
                        y="230"
                        textAnchor="middle"
                        className="fill-slate-700 text-[28px] font-semibold dark:fill-slate-200"
                      >
                        House
                      </text>

                      <polygon
                        points="184,364 704,364 766,558 148,602"
                        className="fill-amber-400/30 stroke-amber-700 dark:fill-amber-400/20 dark:stroke-amber-400"
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
                        className="stroke-amber-900/20 dark:stroke-amber-200/20"
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
                        <g key={`${x}-${y}`}>
                          <circle
                            cx={x}
                            cy={y}
                            r="15"
                            className="fill-background stroke-amber-700 dark:stroke-amber-400"
                            strokeWidth="5"
                          />
                          <circle
                            cx={x}
                            cy={y}
                            r="4"
                            className="fill-amber-700 dark:fill-amber-400"
                          />
                          <text
                            x={x + 22}
                            y={y - 14}
                            className="fill-muted-foreground text-[16px] font-medium"
                          >
                            P{index + 1}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>
              </section>

          {calculatorOpen ? (
            <aside className="hidden lg:block">
              <CalculatorPanel />
            </aside>
          ) : null}
        </div>
      </div>

      <MobileSummary />
    </main>
  )
}

function CalculatorPanel() {
  return (
    <div className="space-y-3">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Project summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="rounded-lg border bg-muted/30 p-2.5">
            <p className="text-sm font-medium">Backyard deck extension</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Attached deck with angled outer edge and stair allowance.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Area" value="42.8 m2" />
            <StatCard label="Perimeter" value="28.4 m" />
          </div>
        </CardContent>
      </Card>

      <Card size="sm" className="bg-primary text-primary-foreground">
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-primary-foreground/75">
              Estimated material price
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              18,940 kr
            </p>
          </div>
          <Separator className="bg-primary-foreground/20" />
          <Button className="w-full bg-background text-foreground hover:bg-background/90">
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
          {measurements.map(([label, value]) => (
            <MaterialRow key={label} label={label} value={value} />
          ))}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Materials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {materials.map((material) => (
            <MaterialRow
              key={material.label}
              label={material.label}
              detail={material.detail}
              value={material.value}
            />
          ))}
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
          <p className="truncate text-sm font-medium">42.8 m2 deck plan</p>
          <p className="text-xs text-muted-foreground">
            356 lm boards - 18,940 kr
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

function ToolButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon: ReactNode
  active?: boolean
  onClick?: () => void
}) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="sm"
      className="min-w-fit"
      aria-pressed={active}
      title={label}
      onClick={onClick}
    >
      {icon}
      <span className="hidden 2xl:inline">{label}</span>
    </Button>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold tracking-tight">{value}</p>
    </div>
  )
}

function MaterialRow({
  label,
  detail,
  value,
}: {
  label: string
  detail?: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/25 px-2.5 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{label}</p>
        {detail ? (
          <p className="truncate text-xs text-muted-foreground">{detail}</p>
        ) : null}
      </div>
      <span className="shrink-0 text-sm font-semibold">{value}</span>
    </div>
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
    <g className="stroke-sky-700 text-[18px] font-semibold dark:stroke-sky-300">
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
