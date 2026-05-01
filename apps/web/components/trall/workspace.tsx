"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
  ZOOM_STEP,
} from "@/lib/trall/constants"
import { formatCurrency } from "@/lib/trall/format"
import { polygonArea, polygonPerimeter } from "@/lib/trall/geometry"
import { getHouseBounds } from "@/lib/trall/house"
import {
  createProject,
  listProjects,
  loadProject,
  type PlannerProjectState,
  saveProjectVersion,
} from "@/lib/trall/project-storage"
import type {
  ActiveTool,
  HouseModel,
  Material,
  Metric,
  Point,
  Tool,
  ViewBox,
} from "@/lib/trall/types"
import {
  getFitViewBox,
  getPlanContentBounds,
  isContentInsideViewBox,
  zoomViewBox,
} from "@/lib/trall/view"
import { useSidebar } from "@workspace/ui/components/sidebar"

type SaveStatus = "Unsaved changes" | "Saving..." | "Saved" | "Save failed"

const CURRENT_PROJECT_STORAGE_KEY = "trallai.currentProjectId"

export function Workspace() {
  const { setOpen, setOpenMobile } = useSidebar()
  const [calculatorOpen, setCalculatorOpen] = useState(true)
  const [activeTool, setActiveTool] = useState<ActiveTool>("select")
  const [viewBox, setViewBox] = useState<ViewBox>(INITIAL_VIEW_BOX)
  const [viewAspectRatio, setViewAspectRatio] = useState(
    INITIAL_VIEW_BOX.width / INITIAL_VIEW_BOX.height
  )
  const [deckPoints, setDeckPoints] = useState<Point[]>(initialDeckPoints)
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null)
  const [house, setHouse] = useState<HouseModel>(initialHouse)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("Unsaved changes")
  const viewBoxRef = useRef(viewBox)
  const viewAspectRatioRef = useRef(viewAspectRatio)
  const hydratingProjectRef = useRef(false)

  const houseBounds = useMemo(() => getHouseBounds(house), [house])
  const zoomPercent = Math.round(
    (INITIAL_VIEW_BOX.width / viewBox.width) * 100
  )
  const fitViewBox = useCallback(() => {
    setViewBox(
      getFitViewBox(houseBounds, deckPoints, viewAspectRatioRef.current)
    )
  }, [deckPoints, houseBounds])
  const zoomIn = useCallback(() => {
    setViewBox((currentViewBox) => zoomViewBox(currentViewBox, ZOOM_STEP))
  }, [])
  const zoomOut = useCallback(() => {
    setViewBox((currentViewBox) => zoomViewBox(currentViewBox, 1 / ZOOM_STEP))
  }, [])
  function scheduleFitViewBox() {
    requestAnimationFrame(() => {
      requestAnimationFrame(fitViewBox)
    })
  }

  useEffect(() => {
    viewBoxRef.current = viewBox
  }, [viewBox])

  useEffect(() => {
    viewAspectRatioRef.current = viewAspectRatio
  }, [viewAspectRatio])

  useEffect(() => {
    const contentBounds = getPlanContentBounds(houseBounds, deckPoints)
    if (!isContentInsideViewBox(contentBounds, viewBoxRef.current)) {
      const frameId = requestAnimationFrame(() => {
        setViewBox(
          getFitViewBox(houseBounds, deckPoints, viewAspectRatioRef.current)
        )
      })

      return () => cancelAnimationFrame(frameId)
    }
  }, [deckPoints, houseBounds])

  useEffect(() => {
    let cancelled = false

    async function loadInitialProject() {
      try {
        const projects = await listProjects()
        if (cancelled || projects.length === 0) {
          return
        }

        const storedProjectId = window.localStorage.getItem(
          CURRENT_PROJECT_STORAGE_KEY
        )
        const projectToLoad =
          projects.find((project) => project.id === storedProjectId) ??
          projects[0]

        if (!projectToLoad) {
          return
        }

        const { project, version } = await loadProject(projectToLoad.id)
        if (cancelled) {
          return
        }

        hydratingProjectRef.current = true
        setCurrentProjectId(project.id)
        setHouse(version.state.house)
        setDeckPoints(version.state.deckPoints)
        setViewBox(version.state.viewBox)
        setSaveStatus("Saved")
        window.localStorage.setItem(CURRENT_PROJECT_STORAGE_KEY, project.id)
        requestAnimationFrame(() => {
          hydratingProjectRef.current = false
        })
      } catch (error) {
        console.error("Failed to load TrallAI project", error)
        if (!cancelled) {
          setSaveStatus("Unsaved changes")
        }
      }
    }

    loadInitialProject()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!currentProjectId || hydratingProjectRef.current) {
      return
    }

    const frameId = requestAnimationFrame(() => {
      setSaveStatus((currentStatus) =>
        currentStatus === "Saving..." ? currentStatus : "Unsaved changes"
      )
    })

    return () => cancelAnimationFrame(frameId)
  }, [currentProjectId, deckPoints, house, viewBox])

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

  const getPlannerState = useCallback(
    (): PlannerProjectState => ({
      house,
      deckPoints,
      viewBox,
      materials: {
        items: calculations.materials,
      },
    }),
    [calculations.materials, deckPoints, house, viewBox]
  )

  async function handleNewProject() {
    const nextHouse = initialHouse
    const nextDeckPoints = [...initialDeckPoints]
    const nextHouseBounds = getHouseBounds(nextHouse)
    const nextViewBox = getFitViewBox(
      nextHouseBounds,
      nextDeckPoints,
      viewAspectRatioRef.current
    )
    const state: PlannerProjectState = {
      house: nextHouse,
      deckPoints: nextDeckPoints,
      viewBox: nextViewBox,
      materials: {
        items: calculations.materials,
      },
    }

    setSaveStatus("Saving...")

    try {
      const project = await createProject("Untitled", state)
      hydratingProjectRef.current = true
      setCurrentProjectId(project.id)
      setHouse(nextHouse)
      setDeckPoints(nextDeckPoints)
      setViewBox(nextViewBox)
      setSaveStatus("Saved")
      window.localStorage.setItem(CURRENT_PROJECT_STORAGE_KEY, project.id)
      requestAnimationFrame(() => {
        hydratingProjectRef.current = false
      })
    } catch (error) {
      console.error("Failed to create TrallAI project", error)
      setSaveStatus("Save failed")
    }
  }

  async function handleSaveProject() {
    setSaveStatus("Saving...")

    try {
      const state = getPlannerState()

      if (!currentProjectId) {
        const project = await createProject("Untitled", state)
        hydratingProjectRef.current = true
        setCurrentProjectId(project.id)
        window.localStorage.setItem(CURRENT_PROJECT_STORAGE_KEY, project.id)
        requestAnimationFrame(() => {
          hydratingProjectRef.current = false
        })
      } else {
        await saveProjectVersion(currentProjectId, state)
      }

      setSaveStatus("Saved")
    } catch (error) {
      console.error("Failed to save TrallAI project", error)
      setSaveStatus("Save failed")
    }
  }

  function toggleWorkspacePanels() {
    if (calculatorOpen) {
      setOpen(false)
      setOpenMobile(false)
      setCalculatorOpen(false)
      scheduleFitViewBox()
      return
    }

    setOpen(true)
    setOpenMobile(false)
    setCalculatorOpen(true)
    scheduleFitViewBox()
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
              onNewProject={handleNewProject}
              onSaveProject={handleSaveProject}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onResetView={fitViewBox}
              saveStatus={saveStatus}
              setActiveTool={setActiveTool}
              zoomPercent={zoomPercent}
            />
            <PlanningSurface
              activeTool={activeTool}
              activePointIndex={activePointIndex}
              deckPoints={deckPoints}
              houseBounds={houseBounds}
              setActivePointIndex={setActivePointIndex}
              setDeckPoints={setDeckPoints}
              setViewAspectRatio={setViewAspectRatio}
              setViewBox={setViewBox}
              onResetView={fitViewBox}
              viewBox={viewBox}
              zoomPercent={zoomPercent}
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
