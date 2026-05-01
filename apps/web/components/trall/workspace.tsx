"use client"

import { useMemo, useState } from "react"
import { Maximize2Icon, Minimize2Icon } from "lucide-react"

import { CalculatorPanel } from "@/components/trall/calculator-panel"
import { CanvasToolbar } from "@/components/trall/canvas-toolbar"
import { MobileSummary } from "@/components/trall/mobile-summary"
import { PlanningSurface } from "@/components/trall/planning-surface"
import {
  baseMaterials,
  INITIAL_VIEW_BOX,
  initialDeckPoints,
  initialHouse,
  PIXELS_PER_METER,
} from "@/lib/trall/constants"
import { formatCurrency } from "@/lib/trall/format"
import { polygonArea, polygonPerimeter } from "@/lib/trall/geometry"
import { getHouseBounds } from "@/lib/trall/house"
import type {
  ActiveTool,
  HouseModel,
  Material,
  Metric,
  Point,
  Tool,
  ViewBox,
} from "@/lib/trall/types"
import { useSidebar } from "@workspace/ui/components/sidebar"

export function Workspace() {
  const { setOpen, setOpenMobile } = useSidebar()
  const [calculatorOpen, setCalculatorOpen] = useState(true)
  const [activeTool, setActiveTool] = useState<ActiveTool>("select")
  const [viewBox, setViewBox] = useState<ViewBox>(INITIAL_VIEW_BOX)
  const [deckPoints, setDeckPoints] = useState<Point[]>(initialDeckPoints)
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null)
  const [house, setHouse] = useState<HouseModel>(initialHouse)

  const houseBounds = useMemo(() => getHouseBounds(house), [house])

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
            <CanvasToolbar
              activeTool={activeTool}
              extraTool={expandTool}
              onResetView={() => setViewBox(INITIAL_VIEW_BOX)}
              setActiveTool={setActiveTool}
            />
            <PlanningSurface
              activeTool={activeTool}
              activePointIndex={activePointIndex}
              deckPoints={deckPoints}
              houseBounds={houseBounds}
              setActivePointIndex={setActivePointIndex}
              setDeckPoints={setDeckPoints}
              setViewBox={setViewBox}
              viewBox={viewBox}
            />
          </section>

          {calculatorOpen ? (
            <aside className="hidden min-w-0 lg:block">
              <CalculatorPanel
                calculations={calculations}
                house={house}
                setHouse={setHouse}
              />
            </aside>
          ) : null}
        </div>

        <section className="lg:hidden">
          <CalculatorPanel
            calculations={calculations}
            house={house}
            setHouse={setHouse}
          />
        </section>
      </div>

      <MobileSummary
        calculations={calculations}
        house={house}
        setHouse={setHouse}
      />
    </main>
  )
}
