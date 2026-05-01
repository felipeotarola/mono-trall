"use client"

import type {
  CSSProperties,
  Dispatch,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
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

type SnapType = "none" | "grid" | "house" | "angle"

type EditableDimension = {
  edgeIndex: number
  value: string
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
const GRID_SIZE_PX = PIXELS_PER_METER / 2
const SNAP_THRESHOLD_PX = 14
const ANGLE_SNAP_DEGREES = [0, 45, 90, 135, 180, 225, 270, 315]
const ANGLE_SNAP_THRESHOLD_DEG = 6
const PARALLEL_HINT_THRESHOLD_DEG = 4
const POINT_BOUNDS = {
  minX: 80,
  maxX: 1080,
  minY: 120,
  maxY: 760,
}
const HOUSE_BOUNDS = {
  left: 238,
  right: 674,
  top: 116,
  bottom: 368,
}
const HOUSE_ATTACH_EDGE = {
  y: HOUSE_BOUNDS.bottom,
  x1: HOUSE_BOUNDS.left,
  x2: HOUSE_BOUNDS.right,
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
        <span>
          Scale 1:100 · 1 grid square = 0.5 m · Cmd/Ctrl snaps angle · Alt
          disables grid · Shift locks axis · Click a dimension to edit length
        </span>
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
  const [snapState, setSnapState] = useState<{
    pointIndex: number | null
    type: SnapType
    point: Point | null
  }>({ pointIndex: null, type: "none", point: null })
  const [angleSnapState, setAngleSnapState] = useState<{
    active: boolean
    angle: number | null
    anchor: Point | null
    point: Point | null
  }>({ active: false, angle: null, anchor: null, point: null })
  const [parallelHint, setParallelHint] = useState<{
    active: boolean
    start: Point | null
    end: Point | null
  }>({ active: false, start: null, end: null })
  const [dragStart, setDragStart] = useState<{
    pointIndex: number
    point: Point
  } | null>(null)
  const [hoveredEdgeIndex, setHoveredEdgeIndex] = useState<number | null>(null)
  const [editingDimension, setEditingDimension] =
    useState<EditableDimension | null>(null)
  const cancelDimensionEditRef = useRef(false)
  const polygonPoints = deckPoints.map((point) => `${point.x},${point.y}`).join(" ")
  const p1 = deckPoints[0] ?? initialDeckPoints[0]
  const p2 = deckPoints[1] ?? initialDeckPoints[1]
  const p3 = deckPoints[2] ?? initialDeckPoints[2]
  const previousPoint =
    deckPoints[deckPoints.length - 2] ?? initialDeckPoints[2]
  const lastPoint =
    deckPoints[deckPoints.length - 1] ?? initialDeckPoints[3]
  const selectedEdgeIndex = activePointIndex ?? 0
  const selectedEdgeStart = deckPoints[selectedEdgeIndex] ?? p1
  const selectedEdgeEnd =
    deckPoints[(selectedEdgeIndex + 1) % deckPoints.length] ?? p2
  const hoveredEdgeStart =
    hoveredEdgeIndex !== null ? deckPoints[hoveredEdgeIndex] : null
  const hoveredEdgeEnd =
    hoveredEdgeIndex !== null
      ? deckPoints[(hoveredEdgeIndex + 1) % deckPoints.length]
      : null
  const hoveredEdgeLabelPoint =
    hoveredEdgeStart && hoveredEdgeEnd
      ? {
          x: (hoveredEdgeStart.x + hoveredEdgeEnd.x) / 2,
          y: (hoveredEdgeStart.y + hoveredEdgeEnd.y) / 2,
        }
      : null
  const activePoint =
    activePointIndex !== null ? deckPoints[activePointIndex] : null
  const bottomEdgeIndex = Math.max(deckPoints.length - 2, 0)

  function handlePointerDown(
    event: ReactPointerEvent<SVGGElement>,
    index: number
  ) {
    event.preventDefault()
    setEditingDimension(null)
    svgRef.current?.focus()
    const point = deckPoints[index] ?? initialDeckPoints[0]
    setActivePointIndex(index)
    setHoveredEdgeIndex(null)
    setDragStart({ pointIndex: index, point })
    setSnapState({ pointIndex: index, type: "none", point: null })
    setAngleSnapState({ active: false, angle: null, anchor: null, point: null })
    setParallelHint({ active: false, start: null, end: null })
    svgRef.current?.setPointerCapture(event.pointerId)
  }

  function insertPointAfterEdge(edgeIndex: number, point: Point) {
    const insertedIndex = edgeIndex + 1
    setDeckPoints((points) => [
      ...points.slice(0, insertedIndex),
      point,
      ...points.slice(insertedIndex),
    ])
    setActivePointIndex(insertedIndex)
    setHoveredEdgeIndex(null)
    setSnapState({ pointIndex: insertedIndex, type: "none", point: null })
  }

  function handleEdgeDoubleClick(
    event: ReactMouseEvent<SVGLineElement>,
    edgeIndex: number
  ) {
    if (!svgRef.current) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    setEditingDimension(null)
    svgRef.current.focus()

    const point = clientPointToSvgPoint(event, svgRef.current)
    const snapped = applySnap(point, { disableGrid: event.altKey })
    insertPointAfterEdge(edgeIndex, snapped.point)
  }

  function removeActivePoint() {
    if (activePointIndex === null || deckPoints.length <= 3) {
      return
    }

    setDeckPoints((points) =>
      points.filter((_, index) => index !== activePointIndex)
    )
    setActivePointIndex(null)
    setHoveredEdgeIndex(null)
    setDragStart(null)
    setSnapState({ pointIndex: null, type: "none", point: null })
    setAngleSnapState({ active: false, angle: null, anchor: null, point: null })
    setParallelHint({ active: false, start: null, end: null })
  }

  function handleKeyDown(event: ReactKeyboardEvent<SVGSVGElement>) {
    if (editingDimension) {
      return
    }

    if (event.key !== "Backspace" && event.key !== "Delete") {
      return
    }

    if (activePointIndex === null || deckPoints.length <= 3) {
      return
    }

    event.preventDefault()
    removeActivePoint()
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (!dragStart || !svgRef.current) {
      return
    }

    let point = clientPointToSvgPoint(event, svgRef.current)

    if (event.shiftKey) {
      const dx = point.x - dragStart.point.x
      const dy = point.y - dragStart.point.y
      point =
        Math.abs(dx) > Math.abs(dy)
          ? { ...point, y: dragStart.point.y }
          : { ...point, x: dragStart.point.x }
    }

    let angleSnapType: SnapType = "none"
    let angleGuide = {
      active: false,
      angle: null as number | null,
      anchor: null as Point | null,
      point: null as Point | null,
    }

    if (event.metaKey || event.ctrlKey) {
      const anchor =
        deckPoints[
          (dragStart.pointIndex - 1 + deckPoints.length) % deckPoints.length
        ]

      if (anchor) {
        const activeDistance = distance(anchor, point)
        const rawAngle = radiansToDegrees(
          Math.atan2(point.y - anchor.y, point.x - anchor.x)
        )
        const snapAngle = closestSnapAngle(rawAngle)

        if (activeDistance > 0 && snapAngle.snapped) {
          const snappedRad = degreesToRadians(snapAngle.angle)
          point = {
            x: anchor.x + Math.cos(snappedRad) * activeDistance,
            y: anchor.y + Math.sin(snappedRad) * activeDistance,
          }
          angleSnapType = "angle"
          angleGuide = {
            active: true,
            angle: snapAngle.angle,
            anchor,
            point,
          }
        }
      }
    }

    const snapped = applySnap(point, {
      disableGrid: event.altKey,
      preferredSnapType: angleSnapType,
    })
    const referenceEdgeStart = deckPoints[0]
    const referenceEdgeEnd = deckPoints[1]
    const activeEdgeStart =
      deckPoints[
        (dragStart.pointIndex - 1 + deckPoints.length) % deckPoints.length
      ]
    const activeEdgeEnd = snapped.point
    const showParallelHint =
      dragStart.pointIndex !== 1 &&
      Boolean(referenceEdgeStart && referenceEdgeEnd && activeEdgeStart) &&
      isNearlyParallel(
        edgeAngle(referenceEdgeStart ?? initialDeckPoints[0], referenceEdgeEnd ?? initialDeckPoints[1]),
        edgeAngle(activeEdgeStart ?? initialDeckPoints[0], activeEdgeEnd),
        PARALLEL_HINT_THRESHOLD_DEG
      )

    setDeckPoints((currentPoints) =>
      currentPoints.map((currentPoint, index) =>
        index === dragStart.pointIndex ? snapped.point : currentPoint
      )
    )
    setSnapState({
      pointIndex: dragStart.pointIndex,
      type: snapped.snapType,
      point: snapped.point,
    })
    setAngleSnapState(
      angleGuide.active
        ? { ...angleGuide, point: snapped.point }
        : { active: false, angle: null, anchor: null, point: null }
    )
    setParallelHint({
      active: showParallelHint,
      start: activeEdgeStart ?? null,
      end: showParallelHint ? snapped.point : null,
    })
  }

  function stopDragging(event: ReactPointerEvent<SVGSVGElement>) {
    if (svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId)
    }
    setDragStart(null)
    setSnapState({ pointIndex: null, type: "none", point: null })
    setAngleSnapState({ active: false, angle: null, anchor: null, point: null })
    setParallelHint({ active: false, start: null, end: null })
  }

  function startEditingDimension(edgeIndex: number, valueMeters: number) {
    cancelDimensionEditRef.current = false
    setEditingDimension({
      edgeIndex,
      value: valueMeters.toFixed(1),
    })
    setHoveredEdgeIndex(null)
    setDragStart(null)
    setSnapState({ pointIndex: null, type: "none", point: null })
    setAngleSnapState({ active: false, angle: null, anchor: null, point: null })
    setParallelHint({ active: false, start: null, end: null })
  }

  function updateEditingDimension(value: string) {
    setEditingDimension((current) =>
      current ? { ...current, value } : current
    )
  }

  function cancelEditingDimension() {
    cancelDimensionEditRef.current = true
    setEditingDimension(null)
  }

  function commitEditingDimension() {
    if (cancelDimensionEditRef.current) {
      cancelDimensionEditRef.current = false
      return
    }

    if (!editingDimension) {
      return
    }

    const newLengthMeters = Number.parseFloat(
      editingDimension.value.replace(",", ".")
    )
    if (!Number.isFinite(newLengthMeters) || newLengthMeters <= 0) {
      setEditingDimension(null)
      return
    }

    const clampedMeters = clamp(newLengthMeters, 0.5, 100)
    const edgeIndex = editingDimension.edgeIndex
    const nextIndex = edgeIndex + 1
    const startPoint = deckPoints[edgeIndex]
    const endPoint = deckPoints[nextIndex]

    if (!startPoint || !endPoint) {
      setEditingDimension(null)
      return
    }

    const currentLength = distance(startPoint, endPoint)
    if (currentLength === 0) {
      setEditingDimension(null)
      return
    }

    const newLengthPx = clampedMeters * PIXELS_PER_METER
    const newPoint = {
      x: startPoint.x + ((endPoint.x - startPoint.x) / currentLength) * newLengthPx,
      y: startPoint.y + ((endPoint.y - startPoint.y) / currentLength) * newLengthPx,
    }
    const snapped = applySnap(newPoint)

    setDeckPoints((points) =>
      points.map((point, index) => (index === nextIndex ? snapped.point : point))
    )
    setActivePointIndex(nextIndex)
    setEditingDimension(null)
  }

  return (
    <svg
      ref={svgRef}
      tabIndex={0}
      viewBox="80 16 1000 744"
      className="h-full w-full touch-none select-none outline-none drop-shadow-sm"
      onKeyDown={handleKeyDown}
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
      {snapState.type === "house" ? (
        <line
          x1={HOUSE_ATTACH_EDGE.x1}
          y1={HOUSE_ATTACH_EDGE.y}
          x2={HOUSE_ATTACH_EDGE.x2}
          y2={HOUSE_ATTACH_EDGE.y}
          className="stroke-sky-500"
          strokeLinecap="round"
          strokeWidth="8"
          opacity="0.5"
        />
      ) : null}

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
      {parallelHint.active && p1 && p2 && parallelHint.start && parallelHint.end ? (
        <g className="pointer-events-none">
          <line
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            className="stroke-violet-500"
            strokeLinecap="round"
            strokeWidth="7"
            opacity="0.32"
          />
          <line
            x1={parallelHint.start.x}
            y1={parallelHint.start.y}
            x2={parallelHint.end.x}
            y2={parallelHint.end.y}
            className="stroke-violet-500"
            strokeLinecap="round"
            strokeWidth="7"
            opacity="0.45"
          />
          <ParallelHintLabel
            point={{
              x: (parallelHint.start.x + parallelHint.end.x) / 2,
              y: (parallelHint.start.y + parallelHint.end.y) / 2,
            }}
          />
        </g>
      ) : null}
      {angleSnapState.active &&
      angleSnapState.anchor &&
      angleSnapState.point &&
      angleSnapState.angle !== null ? (
        <AngleSnapGuide
          anchor={angleSnapState.anchor}
          angle={angleSnapState.angle}
          point={angleSnapState.point}
        />
      ) : null}
      {hoveredEdgeStart && hoveredEdgeEnd ? (
        <line
          x1={hoveredEdgeStart.x}
          y1={hoveredEdgeStart.y}
          x2={hoveredEdgeEnd.x}
          y2={hoveredEdgeEnd.y}
          className="pointer-events-none stroke-sky-500"
          strokeLinecap="round"
          strokeWidth="6"
          opacity="0.7"
        />
      ) : null}
      {deckPoints.map((point, index) => {
        const nextPoint = deckPoints[(index + 1) % deckPoints.length]
        if (!nextPoint) {
          return null
        }

        return (
          <line
            key={`edge-hit-${index}`}
            x1={point.x}
            y1={point.y}
            x2={nextPoint.x}
            y2={nextPoint.y}
            data-edge-index={index}
            className="cursor-copy stroke-transparent"
            strokeWidth="30"
            pointerEvents="stroke"
            onDoubleClick={(event) => handleEdgeDoubleClick(event, index)}
            onPointerEnter={() => setHoveredEdgeIndex(index)}
            onPointerLeave={() =>
              setHoveredEdgeIndex((currentIndex) =>
                currentIndex === index ? null : currentIndex
              )
            }
          />
        )
      })}
      {hoveredEdgeLabelPoint ? (
        <EdgeHoverLabel point={hoveredEdgeLabelPoint} />
      ) : null}

      <DimensionLine
        edgeIndex={0}
        x1={p1.x}
        y1={p1.y - 26}
        x2={p2.x}
        y2={p2.y - 26}
        valueMeters={distance(p1, p2) / PIXELS_PER_METER}
        labelX={(p1.x + p2.x) / 2}
        labelY={(p1.y + p2.y) / 2 - 44}
        rotate={lineAngle(p1, p2)}
        editingDimension={editingDimension}
        onCancelEdit={cancelEditingDimension}
        onCommitEdit={commitEditingDimension}
        onEditValueChange={updateEditingDimension}
        onStartEdit={startEditingDimension}
      />
      <DimensionLine
        edgeIndex={1}
        x1={p2.x + 28}
        y1={p2.y}
        x2={p3.x + 28}
        y2={p3.y}
        valueMeters={distance(p2, p3) / PIXELS_PER_METER}
        labelX={(p2.x + p3.x) / 2 + 55}
        labelY={(p2.y + p3.y) / 2}
        rotate={lineAngle(p2, p3)}
        editingDimension={editingDimension}
        onCancelEdit={cancelEditingDimension}
        onCommitEdit={commitEditingDimension}
        onEditValueChange={updateEditingDimension}
        onStartEdit={startEditingDimension}
      />
      <DimensionLine
        edgeIndex={bottomEdgeIndex}
        x1={lastPoint.x}
        y1={lastPoint.y + 28}
        x2={previousPoint.x}
        y2={previousPoint.y + 28}
        valueMeters={distance(lastPoint, previousPoint) / PIXELS_PER_METER}
        labelX={(lastPoint.x + previousPoint.x) / 2}
        labelY={(lastPoint.y + previousPoint.y) / 2 + 58}
        rotate={lineAngle(lastPoint, previousPoint)}
        editingDimension={editingDimension}
        onCancelEdit={cancelEditingDimension}
        onCommitEdit={commitEditingDimension}
        onEditValueChange={updateEditingDimension}
        onStartEdit={startEditingDimension}
      />

      {deckPoints.map((point, index) => (
        <DeckHandle
          key={index}
          x={point.x}
          y={point.y}
          label={`P${index + 1}`}
          selected={index === activePointIndex}
          dragging={dragStart?.pointIndex === index}
          snappedToHouse={
            snapState.type === "house" && snapState.pointIndex === index
          }
          onPointerDown={(event) => handlePointerDown(event, index)}
        />
      ))}
      {snapState.point ? (
        <SnapIndicator point={snapState.point} type={snapState.type} />
      ) : null}
      {activePoint && deckPoints.length > 3 ? (
        <DeletePointHint point={activePoint} />
      ) : null}
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
  snappedToHouse,
  onPointerDown,
}: {
  x: number
  y: number
  label: string
  selected?: boolean
  dragging?: boolean
  snappedToHouse?: boolean
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
          className={
            snappedToHouse
              ? "fill-sky-400/18 stroke-sky-500/55"
              : "fill-orange-400/20 stroke-orange-500/35"
          }
          strokeWidth="3"
        />
      ) : null}
      {snappedToHouse ? (
        <circle
          cx={x}
          cy={y}
          r="34"
          className="fill-transparent stroke-sky-500/30"
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
  edgeIndex,
  x1,
  y1,
  x2,
  y2,
  valueMeters,
  labelX,
  labelY,
  editingDimension,
  onCancelEdit,
  onCommitEdit,
  onEditValueChange,
  onStartEdit,
  rotate = 0,
}: {
  edgeIndex: number
  x1: number
  y1: number
  x2: number
  y2: number
  valueMeters: number
  labelX: number
  labelY: number
  editingDimension: EditableDimension | null
  onCancelEdit: () => void
  onCommitEdit: () => void
  onEditValueChange: (value: string) => void
  onStartEdit: (edgeIndex: number, valueMeters: number) => void
  rotate?: number
}) {
  const isEditing = editingDimension?.edgeIndex === edgeIndex

  return (
    <g
      className={
        isEditing
          ? "stroke-sky-700 text-[17px] font-semibold dark:stroke-sky-300"
          : editingDimension
            ? "stroke-sky-700/45 text-[17px] font-semibold opacity-55 dark:stroke-sky-300/45"
            : "stroke-sky-700 text-[17px] font-semibold dark:stroke-sky-300"
      }
    >
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="3" />
      <circle cx={x1} cy={y1} r="4" className="fill-sky-700 dark:fill-sky-300" />
      <circle cx={x2} cy={y2} r="4" className="fill-sky-700 dark:fill-sky-300" />
      {isEditing ? (
        <foreignObject
          x={labelX - 42}
          y={labelY - 20}
          width="84"
          height="34"
          transform={`rotate(${rotate} ${labelX} ${labelY})`}
        >
          <input
            autoFocus
            className="h-7 w-20 rounded-md border bg-background px-2 text-center text-sm font-semibold text-foreground shadow-sm outline-none ring-2 ring-sky-500/40"
            inputMode="decimal"
            value={editingDimension.value}
            onBlur={onCommitEdit}
            onChange={(event) => onEditValueChange(event.target.value)}
            onFocus={(event) => event.currentTarget.select()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                onCommitEdit()
              }
              if (event.key === "Escape") {
                event.preventDefault()
                onCancelEdit()
              }
            }}
          />
        </foreignObject>
      ) : (
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          transform={`rotate(${rotate} ${labelX} ${labelY})`}
          className="cursor-text fill-sky-700 stroke-transparent dark:fill-sky-300"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onStartEdit(edgeIndex, valueMeters)
          }}
        >
          {formatMeters(valueMeters)}
        </text>
      )}
    </g>
  )
}

function EdgeHoverLabel({ point }: { point: Point }) {
  return (
    <g className="pointer-events-none">
      <rect
        x={point.x + 16}
        y={point.y - 46}
        width="166"
        height="28"
        rx="7"
        className="fill-background/95 stroke-border"
      />
      <text
        x={point.x + 28}
        y={point.y - 27}
        className="fill-muted-foreground text-[13px] font-medium"
      >
        Double-click to add point
      </text>
    </g>
  )
}

function AngleSnapGuide({
  anchor,
  angle,
  point,
}: {
  anchor: Point
  angle: number
  point: Point
}) {
  const guideLength = Math.max(distance(anchor, point) + 140, 260)
  const angleRad = degreesToRadians(angle)
  const guideEnd = {
    x: anchor.x + Math.cos(angleRad) * guideLength,
    y: anchor.y + Math.sin(angleRad) * guideLength,
  }

  return (
    <g className="pointer-events-none">
      <line
        x1={anchor.x}
        y1={anchor.y}
        x2={guideEnd.x}
        y2={guideEnd.y}
        className="stroke-sky-500"
        strokeDasharray="10 8"
        strokeLinecap="round"
        strokeWidth="3"
        opacity="0.65"
      />
      <rect
        x={point.x + 18}
        y={point.y + 18}
        width="48"
        height="28"
        rx="7"
        className="fill-background/95 stroke-sky-500/40"
      />
      <text
        x={point.x + 31}
        y={point.y + 37}
        className="fill-sky-700 text-[14px] font-semibold dark:fill-sky-300"
      >
        {Math.round(angle)}°
      </text>
    </g>
  )
}

function ParallelHintLabel({ point }: { point: Point }) {
  return (
    <g className="pointer-events-none">
      <rect
        x={point.x + 16}
        y={point.y - 46}
        width="142"
        height="28"
        rx="7"
        className="fill-background/95 stroke-violet-500/35"
      />
      <text
        x={point.x + 28}
        y={point.y - 27}
        className="fill-violet-700 text-[13px] font-medium dark:fill-violet-300"
      >
        Parallel to top edge
      </text>
    </g>
  )
}

function DeletePointHint({ point }: { point: Point }) {
  return (
    <g className="pointer-events-none">
      <rect
        x={point.x + 18}
        y={point.y + 24}
        width="220"
        height="30"
        rx="7"
        className="fill-background/95 stroke-border"
      />
      <text
        x={point.x + 30}
        y={point.y + 44}
        className="fill-muted-foreground text-[13px] font-medium"
      >
        Delete / Backspace removes selected point
      </text>
    </g>
  )
}

function SnapIndicator({ point, type }: { point: Point; type: SnapType }) {
  if (type === "none" || type === "angle") {
    return null
  }

  return (
    <g className="pointer-events-none">
      <rect
        x={point.x + 18}
        y={point.y - 58}
        width={type === "house" ? 178 : 166}
        height="30"
        rx="7"
        className="fill-background/95 stroke-border"
      />
      <text
        x={point.x + 31}
        y={point.y - 38}
        className={
          type === "house"
            ? "fill-sky-700 text-[14px] font-medium dark:fill-sky-300"
            : "fill-muted-foreground text-[14px] font-medium"
        }
      >
        {type === "house"
          ? "Snapped to house wall"
          : "Snapped to 0.5 m grid"}
      </text>
    </g>
  )
}

function clientPointToSvgPoint(
  event: PointerEvent | ReactPointerEvent | MouseEvent | ReactMouseEvent,
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

function radiansToDegrees(rad: number): number {
  return (rad * 180) / Math.PI
}

function degreesToRadians(deg: number): number {
  return (deg * Math.PI) / 180
}

function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360
}

function closestSnapAngle(angleDeg: number): {
  angle: number
  delta: number
  snapped: boolean
} {
  const normalizedAngle = normalizeAngle(angleDeg)
  const closest = ANGLE_SNAP_DEGREES.reduce(
    (best, angle) => {
      const delta = Math.abs(normalizeAngle(normalizedAngle - angle))
      const shortestDelta = Math.min(delta, 360 - delta)

      return shortestDelta < best.delta ? { angle, delta: shortestDelta } : best
    },
    { angle: ANGLE_SNAP_DEGREES[0] ?? 0, delta: 360 }
  )

  return {
    ...closest,
    snapped: closest.delta <= ANGLE_SNAP_THRESHOLD_DEG,
  }
}

function edgeAngle(start: Point, end: Point): number {
  return normalizeAngle(radiansToDegrees(Math.atan2(end.y - start.y, end.x - start.x)))
}

function isNearlyParallel(
  angleA: number,
  angleB: number,
  thresholdDeg: number
): boolean {
  const delta = Math.abs(normalizeAngle(angleA - angleB))
  const parallelDelta = Math.min(delta, 360 - delta, Math.abs(delta - 180))
  return parallelDelta <= thresholdDeg
}

function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize
}

function snapPointToGrid(point: Point): Point {
  return {
    x: snapToGrid(point.x, GRID_SIZE_PX),
    y: snapToGrid(point.y, GRID_SIZE_PX),
  }
}

function snapPointToHouseAttachEdge(point: Point): {
  point: Point
  snapped: boolean
} {
  const isNearAttachY =
    Math.abs(point.y - HOUSE_ATTACH_EDGE.y) <= SNAP_THRESHOLD_PX

  if (!isNearAttachY) {
    return { point, snapped: false }
  }

  return {
    point: {
      ...point,
      y: HOUSE_ATTACH_EDGE.y,
    },
    snapped: true,
  }
}

function applySnap(
  point: Point,
  options: { disableGrid?: boolean; preferredSnapType?: SnapType } = {}
): {
  point: Point
  snapType: SnapType
} {
  const clampedPoint = {
    x: clamp(point.x, POINT_BOUNDS.minX, POINT_BOUNDS.maxX),
    y: clamp(point.y, POINT_BOUNDS.minY, POINT_BOUNDS.maxY),
  }
  const gridPoint = options.disableGrid
    ? clampedPoint
    : snapPointToGrid(clampedPoint)
  const houseSnap = snapPointToHouseAttachEdge(gridPoint)
  const finalPoint = {
    x: clamp(houseSnap.point.x, POINT_BOUNDS.minX, POINT_BOUNDS.maxX),
    y: clamp(houseSnap.point.y, POINT_BOUNDS.minY, POINT_BOUNDS.maxY),
  }

  return {
    point: finalPoint,
    snapType: houseSnap.snapped
      ? "house"
      : options.preferredSnapType && options.preferredSnapType !== "none"
        ? options.preferredSnapType
      : options.disableGrid
        ? "none"
        : "grid",
  }
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
