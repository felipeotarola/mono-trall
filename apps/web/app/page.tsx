"use client"

import type {
  CSSProperties,
  Dispatch,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  SetStateAction,
} from "react"
import { useMemo, useRef, useState } from "react"
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

type Point = {
  x: number
  y: number
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

const PIXELS_PER_METER = 40
const POINT_BOUNDS = {
  minX: 80,
  maxX: 1080,
  minY: 120,
  maxY: 760,
}

const baseMaterials: Material[] = [
  { label: "Joists", value: "94 lm", detail: "45 × 145 mm" },
  { label: "Post anchors", value: "12 pcs", detail: "Galvanized" },
  { label: "Deck screws", value: "1,250 pcs", detail: "A4 stainless" },
]

const initialDeckPoints: [Point, Point, Point, Point] = [
  { x: 184, y: 364 },
  { x: 680, y: 364 },
  { x: 742, y: 558 },
  { x: 175, y: 602 },
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
  const [deckPoints, setDeckPoints] = useState<Point[]>(initialDeckPoints)
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null)

  const calculations = useMemo(() => {
    const areaM2 = polygonArea(deckPoints) / PIXELS_PER_METER ** 2
    const perimeterM = polygonPerimeter(deckPoints) / PIXELS_PER_METER
    const boardRunLm = areaM2 / 0.12
    const materialPrice = boardRunLm * 39 * 1.1

    return {
      areaM2,
      perimeterM,
      boardRunLm,
      materialPrice,
      priceLabel: formatCurrency(materialPrice),
      metrics: [
        { label: "Deck area", value: `${areaM2.toFixed(1)} m²` },
        { label: "Perimeter", value: `${perimeterM.toFixed(1)} m` },
        { label: "Board run", value: `${Math.round(boardRunLm)} lm` },
        { label: "Waste factor", value: "10%" },
      ] satisfies Metric[],
      materials: [
        {
          label: "Decking boards",
          value: `${Math.round(boardRunLm)} lm`,
          detail: "28 × 120 mm",
        },
        ...baseMaterials,
      ] satisfies Material[],
    }
  }, [deckPoints])

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
            <PlanningSurface
              activePointIndex={activePointIndex}
              deckPoints={deckPoints}
              setActivePointIndex={setActivePointIndex}
              setDeckPoints={setDeckPoints}
            />
          </section>

          {calculatorOpen ? (
            <aside className="hidden min-w-0 lg:block">
              <CalculatorPanel calculations={calculations} />
            </aside>
          ) : null}
        </div>

        <section className="lg:hidden">
          <CalculatorPanel calculations={calculations} />
        </section>
      </div>

      <MobileSummary calculations={calculations} />
    </main>
  )
}

function PlanningSurface({
  activePointIndex,
  deckPoints,
  setActivePointIndex,
  setDeckPoints,
}: {
  activePointIndex: number | null
  deckPoints: Point[]
  setActivePointIndex: (index: number | null) => void
  setDeckPoints: Dispatch<SetStateAction<Point[]>>
}) {
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
          <PlanSvg
            activePointIndex={activePointIndex}
            deckPoints={deckPoints}
            setActivePointIndex={setActivePointIndex}
            setDeckPoints={setDeckPoints}
          />
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

function PlanSvg({
  activePointIndex,
  deckPoints,
  setActivePointIndex,
  setDeckPoints,
}: {
  activePointIndex: number | null
  deckPoints: Point[]
  setActivePointIndex: (index: number | null) => void
  setDeckPoints: Dispatch<SetStateAction<Point[]>>
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const polygonPoints = deckPoints.map((point) => `${point.x},${point.y}`).join(" ")
  const p1 = deckPoints[0] ?? initialDeckPoints[0]
  const p2 = deckPoints[1] ?? initialDeckPoints[1]
  const p3 = deckPoints[2] ?? initialDeckPoints[2]
  const p4 = deckPoints[3] ?? initialDeckPoints[3]
  const selectedEdgeIndex = activePointIndex ?? 0
  const selectedEdgeStart = deckPoints[selectedEdgeIndex] ?? p1
  const selectedEdgeEnd =
    deckPoints[(selectedEdgeIndex + 1) % deckPoints.length] ?? p2

  function handlePointerDown(
    event: ReactPointerEvent<SVGGElement>,
    index: number
  ) {
    event.preventDefault()
    setActivePointIndex(index)
    svgRef.current?.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (activePointIndex === null || !svgRef.current) {
      return
    }

    const point = clientPointToSvgPoint(event, svgRef.current)
    const clampedPoint = {
      x: clamp(point.x, POINT_BOUNDS.minX, POINT_BOUNDS.maxX),
      y: clamp(point.y, POINT_BOUNDS.minY, POINT_BOUNDS.maxY),
    }

    setDeckPoints((currentPoints) =>
      currentPoints.map((currentPoint, index) =>
        index === activePointIndex ? clampedPoint : currentPoint
      )
    )
  }

  function stopDragging(event: ReactPointerEvent<SVGSVGElement>) {
    if (svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId)
    }
    setActivePointIndex(null)
  }

  return (
    <svg
      ref={svgRef}
      viewBox="80 16 1000 744"
      className="h-full w-full touch-none select-none drop-shadow-sm"
      onPointerCancel={stopDragging}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      role="img"
      aria-label="Deck plan with house outline, deck polygon, dimensions, and draggable corner handles"
    >
      <defs>
        <clipPath id="deck-clip">
          <polygon points={polygonPoints} />
        </clipPath>
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
        points={polygonPoints}
        className="fill-amber-300/42 stroke-amber-800 dark:fill-amber-400/24 dark:stroke-amber-300"
        strokeLinejoin="round"
        strokeWidth="5"
      />
      <polygon
        points={polygonPoints}
        fill="url(#deck-board-lines)"
        className="stroke-transparent"
      />
      <g clipPath="url(#deck-clip)">
        <path
          d="M120 396 H980 M120 438 H980 M120 482 H980 M120 526 H980 M120 570 H980 M120 614 H980 M120 658 H980 M120 702 H980"
          className="stroke-amber-900/20 dark:stroke-amber-100/20"
          strokeWidth="3"
        />
      </g>
      <path
        d={`M${selectedEdgeStart.x} ${selectedEdgeStart.y} L${selectedEdgeEnd.x} ${selectedEdgeEnd.y}`}
        className="stroke-orange-500"
        strokeLinecap="round"
        strokeWidth="9"
      />
      <path
        d={`M${selectedEdgeStart.x} ${selectedEdgeStart.y} L${selectedEdgeEnd.x} ${selectedEdgeEnd.y}`}
        className="stroke-orange-950 dark:stroke-orange-100"
        strokeLinecap="round"
        strokeWidth="3"
      />

      <DimensionLine
        x1={p1.x}
        y1={p1.y - 26}
        x2={p2.x}
        y2={p2.y - 26}
        label={formatMeters(distance(p1, p2) / PIXELS_PER_METER)}
        labelX={(p1.x + p2.x) / 2}
        labelY={(p1.y + p2.y) / 2 - 44}
        rotate={lineAngle(p1, p2)}
      />
      <DimensionLine
        x1={p2.x + 28}
        y1={p2.y}
        x2={p3.x + 28}
        y2={p3.y}
        label={formatMeters(distance(p2, p3) / PIXELS_PER_METER)}
        labelX={(p2.x + p3.x) / 2 + 55}
        labelY={(p2.y + p3.y) / 2}
        rotate={lineAngle(p2, p3)}
      />
      <DimensionLine
        x1={p4.x}
        y1={p4.y + 28}
        x2={p3.x}
        y2={p3.y + 28}
        label={formatMeters(distance(p4, p3) / PIXELS_PER_METER)}
        labelX={(p4.x + p3.x) / 2}
        labelY={(p4.y + p3.y) / 2 + 58}
        rotate={lineAngle(p4, p3)}
      />

      {deckPoints.map((point, index) => (
        <DeckHandle
          key={index}
          x={point.x}
          y={point.y}
          label={`P${index + 1}`}
          selected={index === activePointIndex}
          dragging={index === activePointIndex}
          onPointerDown={(event) => handlePointerDown(event, index)}
        />
      ))}
    </svg>
  )
}

function CalculatorPanel({
  calculations,
}: {
  calculations: {
    priceLabel: string
    metrics: Metric[]
    materials: Material[]
  }
}) {
  return (
    <div className="space-y-3">
      <Card size="sm" className="bg-zinc-950 text-white dark:bg-primary">
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-white/70">Estimated material price</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              {calculations.priceLabel}
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
          {calculations.metrics.map((metric) => (
            <MetricRow key={metric.label} {...metric} />
          ))}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Materials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {calculations.materials.map((material) => (
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

function MobileSummary({
  calculations,
}: {
  calculations: {
    areaM2: number
    boardRunLm: number
    priceLabel: string
    metrics: Metric[]
    materials: Material[]
  }
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 shadow-lg backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {calculations.priceLabel}
          </p>
          <p className="text-xs text-muted-foreground">
            {calculations.areaM2.toFixed(1)} m² deck ·{" "}
            {Math.round(calculations.boardRunLm)} lm boards
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
              <CalculatorPanel calculations={calculations} />
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
  dragging,
  onPointerDown,
}: {
  x: number
  y: number
  label: string
  selected?: boolean
  dragging?: boolean
  onPointerDown: (event: ReactPointerEvent<SVGGElement>) => void
}) {
  return (
    <g
      className="group/handle cursor-grab touch-none active:cursor-grabbing"
      data-point-index={label}
      onPointerDown={onPointerDown}
    >
      <circle cx={x} cy={y} r="28" className="fill-transparent" />
      {selected ? (
        <circle
          cx={x}
          cy={y}
          r={dragging ? "28" : "24"}
          className="fill-orange-400/20 stroke-orange-500/35"
          strokeWidth="3"
        />
      ) : null}
      <circle
        cx={x}
        cy={y}
        r={dragging ? "17" : "14"}
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
        className={
          selected
            ? "pointer-events-none fill-orange-700 text-[16px] font-semibold dark:fill-orange-300"
            : "pointer-events-none fill-muted-foreground text-[15px] font-medium"
        }
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

function clientPointToSvgPoint(
  event: PointerEvent | ReactPointerEvent,
  svg: SVGSVGElement
): Point {
  const point = svg.createSVGPoint()
  point.x = event.clientX
  point.y = event.clientY

  const screenCtm = svg.getScreenCTM()
  if (!screenCtm) {
    return { x: point.x, y: point.y }
  }

  const svgPoint = point.matrixTransform(screenCtm.inverse())
  return { x: svgPoint.x, y: svgPoint.y }
}

function polygonArea(points: Point[]): number {
  if (points.length < 3) {
    return 0
  }

  const signedArea = points.reduce((sum, point, index) => {
    const nextPoint = points[(index + 1) % points.length]
    if (!nextPoint) {
      return sum
    }

    return sum + point.x * nextPoint.y - nextPoint.x * point.y
  }, 0)

  return Math.abs(signedArea) / 2
}

function polygonPerimeter(points: Point[]): number {
  return points.reduce((sum, point, index) => {
    const nextPoint = points[(index + 1) % points.length]
    return nextPoint ? sum + distance(point, nextPoint) : sum
  }, 0)
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function lineAngle(a: Point, b: Point): number {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
}

function formatMeters(value: number): string {
  return `${value.toFixed(1)} m`
}

function formatCurrency(value: number): string {
  return `${Math.round(value).toLocaleString("sv-SE")} kr`
}
