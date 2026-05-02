"use client"

import type { ReactNode } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Maximize2Icon,
  Minimize2Icon,
} from "lucide-react"

import { CalculatorPanel } from "@/components/trall/calculator-panel"
import { CanvasToolbar } from "@/components/trall/canvas-toolbar"
import { MobileSummary } from "@/components/trall/mobile-summary"
import { PlanningSurface } from "@/components/trall/planning-surface"
import {
  baseMaterials,
  INITIAL_VIEW_BOX,
  initialDeckPoints,
  initialHouse,
  initialPoolPoints,
  PIXELS_PER_METER,
  ZOOM_STEP,
} from "@/lib/trall/constants"
import { formatCurrency } from "@/lib/trall/format"
import { polygonArea, polygonPerimeter } from "@/lib/trall/geometry"
import type { EdgeConstraint } from "@/lib/trall/edge-model"
import { getHouseBounds } from "@/lib/trall/house"
import {
  createProject,
  listProjects,
  loadProject,
  type PlannerProjectState,
  saveProjectVersion,
} from "@/lib/trall/project-storage"
import { getSupportLayout } from "@/lib/trall/supports"
import type {
  ActiveTool,
  HouseModel,
  Material,
  MeasurementLine,
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
import { Button } from "@workspace/ui/components/button"
import { useSidebar } from "@workspace/ui/components/sidebar"

type SaveStatus = "Unsaved changes" | "Saving..." | "Saved" | "Save failed"

const CURRENT_PROJECT_STORAGE_KEY = "trallai.currentProjectId"
const AUTOSAVE_DELAY_MS = 1200

export function Workspace() {
  const { setOpen, setOpenMobile } = useSidebar()
  const [calculatorOpen, setCalculatorOpen] = useState(true)
  const [activeTool, setActiveTool] = useState<ActiveTool>("select")
  const [viewBox, setViewBox] = useState<ViewBox>(INITIAL_VIEW_BOX)
  const [viewAspectRatio, setViewAspectRatio] = useState(
    INITIAL_VIEW_BOX.width / INITIAL_VIEW_BOX.height
  )
  const [deckPoints, setDeckPoints] = useState<Point[]>(initialDeckPoints)
  const [deckEdgeConstraints, setDeckEdgeConstraints] = useState<
    EdgeConstraint[]
  >([])
  const [measurements, setMeasurements] = useState<MeasurementLine[]>([])
  const [poolPoints, setPoolPoints] = useState<Point[] | null>(null)
  const [poolEdgeConstraints, setPoolEdgeConstraints] = useState<
    EdgeConstraint[]
  >([])
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null)
  const [activePoolPointIndex, setActivePoolPointIndex] = useState<
    number | null
  >(null)
  const [house, setHouse] = useState<HouseModel>(initialHouse)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("Unsaved changes")
  const viewBoxRef = useRef(viewBox)
  const viewAspectRatioRef = useRef(viewAspectRatio)
  const hydratingProjectRef = useRef(false)
  const autosaveReadyRef = useRef(false)
  const latestSaveRequestRef = useRef(0)

  const houseBounds = useMemo(() => getHouseBounds(house), [house])
  const zoomPercent = Math.round((INITIAL_VIEW_BOX.width / viewBox.width) * 100)
  const fitViewBox = useCallback(() => {
    setViewBox(
      getFitViewBox(
        houseBounds,
        deckPoints,
        poolPoints ?? [],
        viewAspectRatioRef.current
      )
    )
  }, [deckPoints, houseBounds, poolPoints])
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
    const contentBounds = getPlanContentBounds(
      houseBounds,
      deckPoints,
      poolPoints ?? []
    )
    if (!isContentInsideViewBox(contentBounds, viewBoxRef.current)) {
      const frameId = requestAnimationFrame(() => {
        setViewBox(
          getFitViewBox(
            houseBounds,
            deckPoints,
            poolPoints ?? [],
            viewAspectRatioRef.current
          )
        )
      })

      return () => cancelAnimationFrame(frameId)
    }
  }, [deckPoints, houseBounds, poolPoints])

  useEffect(() => {
    let cancelled = false

    async function loadInitialProject() {
      try {
        const projects = await listProjects()
        if (cancelled) {
          return
        }

        if (projects.length === 0) {
          autosaveReadyRef.current = true
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
        setDeckEdgeConstraints(version.state.deckEdgeConstraints ?? [])
        setMeasurements(version.state.measurements ?? [])
        setPoolPoints(version.state.poolPoints ?? null)
        setPoolEdgeConstraints(version.state.poolEdgeConstraints ?? [])
        setViewBox(version.state.viewBox)
        setSaveStatus("Saved")
        window.localStorage.setItem(CURRENT_PROJECT_STORAGE_KEY, project.id)
        requestAnimationFrame(() => {
          hydratingProjectRef.current = false
          autosaveReadyRef.current = true
        })
      } catch (error) {
        console.error("Failed to load TrallAI project", error)
        if (!cancelled) {
          setSaveStatus("Unsaved changes")
          autosaveReadyRef.current = true
        }
      }
    }

    loadInitialProject()

    return () => {
      cancelled = true
    }
  }, [])

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
      supportLayout: getSupportLayout({
        points: deckPoints,
        spacingM: 0.6,
      }),
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
      deckEdgeConstraints,
      measurements,
      poolPoints,
      poolEdgeConstraints,
      viewBox,
      materials: {
        items: calculations.materials,
      },
    }),
    [
      calculations.materials,
      deckEdgeConstraints,
      deckPoints,
      house,
      measurements,
      poolEdgeConstraints,
      poolPoints,
      viewBox,
    ]
  )

  const savePlannerState = useCallback(
    async ({ source }: { source: "manual" | "autosave" }) => {
      const saveRequestId = latestSaveRequestRef.current + 1
      latestSaveRequestRef.current = saveRequestId
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

        if (latestSaveRequestRef.current === saveRequestId) {
          setSaveStatus("Saved")
        }
      } catch (error) {
        console.error(`Failed to ${source} TrallAI project`, error)
        if (latestSaveRequestRef.current === saveRequestId) {
          setSaveStatus("Save failed")
        }
      }
    },
    [currentProjectId, getPlannerState]
  )

  const ensureCurrentProject = useCallback(async () => {
    if (currentProjectId) {
      return currentProjectId
    }

    setSaveStatus("Saving...")
    const project = await createProject("Untitled", getPlannerState())
    hydratingProjectRef.current = true
    setCurrentProjectId(project.id)
    setSaveStatus("Saved")
    window.localStorage.setItem(CURRENT_PROJECT_STORAGE_KEY, project.id)
    requestAnimationFrame(() => {
      hydratingProjectRef.current = false
      autosaveReadyRef.current = true
    })

    return project.id
  }, [currentProjectId, getPlannerState])

  useEffect(() => {
    if (!autosaveReadyRef.current || hydratingProjectRef.current) {
      return
    }

    const frameId = requestAnimationFrame(() => {
      setSaveStatus((currentStatus) =>
        currentStatus === "Saving..." ? currentStatus : "Unsaved changes"
      )
    })
    const timeoutId = window.setTimeout(() => {
      void savePlannerState({ source: "autosave" })
    }, AUTOSAVE_DELAY_MS)

    return () => {
      cancelAnimationFrame(frameId)
      window.clearTimeout(timeoutId)
    }
  }, [
    deckEdgeConstraints,
    deckPoints,
    house,
    measurements,
    poolEdgeConstraints,
    poolPoints,
    savePlannerState,
    viewBox,
  ])

  async function handleNewProject() {
    const nextHouse = initialHouse
    const nextDeckPoints = [...initialDeckPoints]
    const nextDeckEdgeConstraints: EdgeConstraint[] = []
    const nextMeasurements: MeasurementLine[] = []
    const nextPoolPoints = null
    const nextPoolEdgeConstraints: EdgeConstraint[] = []
    const nextHouseBounds = getHouseBounds(nextHouse)
    const nextViewBox = getFitViewBox(
      nextHouseBounds,
      nextDeckPoints,
      [],
      viewAspectRatioRef.current
    )
    const state: PlannerProjectState = {
      house: nextHouse,
      deckPoints: nextDeckPoints,
      deckEdgeConstraints: nextDeckEdgeConstraints,
      measurements: nextMeasurements,
      poolPoints: nextPoolPoints,
      poolEdgeConstraints: nextPoolEdgeConstraints,
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
      setDeckEdgeConstraints(nextDeckEdgeConstraints)
      setMeasurements(nextMeasurements)
      setPoolPoints(nextPoolPoints)
      setPoolEdgeConstraints(nextPoolEdgeConstraints)
      setActivePointIndex(null)
      setActivePoolPointIndex(null)
      setViewBox(nextViewBox)
      setSaveStatus("Saved")
      window.localStorage.setItem(CURRENT_PROJECT_STORAGE_KEY, project.id)
      requestAnimationFrame(() => {
        hydratingProjectRef.current = false
        autosaveReadyRef.current = true
      })
    } catch (error) {
      console.error("Failed to create TrallAI project", error)
      setSaveStatus("Save failed")
    }
  }

  async function handleSaveProject() {
    await savePlannerState({ source: "manual" })
  }

  function handleAddPool() {
    setPoolPoints((currentPoints) => currentPoints ?? [...initialPoolPoints])
    setActivePointIndex(null)
    setActivePoolPointIndex(0)
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
      <div
        className={
          calculatorOpen
            ? "flex flex-1 flex-col gap-3 p-3 pb-24 transition-[padding] duration-200 sm:p-4 lg:pr-[348px] lg:pb-4 xl:p-5 xl:pr-[388px]"
            : "flex flex-1 flex-col gap-3 p-3 pb-24 transition-[padding] duration-200 sm:p-4 lg:pb-4 xl:p-5"
        }
      >
        <section className="relative min-w-0 flex-1 overflow-hidden rounded-lg border bg-stone-50 shadow-sm dark:bg-zinc-950">
          <CanvasToolbar
            activeTool={activeTool}
            extraTool={expandTool}
            onAddPool={handleAddPool}
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
            activePoolPointIndex={activePoolPointIndex}
            deckEdgeConstraints={deckEdgeConstraints}
            deckPoints={deckPoints}
            house={house}
            houseBounds={houseBounds}
            measurements={measurements}
            poolEdgeConstraints={poolEdgeConstraints}
            poolPoints={poolPoints}
            setActivePointIndex={setActivePointIndex}
            setDeckEdgeConstraints={setDeckEdgeConstraints}
            setDeckPoints={setDeckPoints}
            setActivePoolPointIndex={setActivePoolPointIndex}
            setHouse={setHouse}
            setMeasurements={setMeasurements}
            setPoolEdgeConstraints={setPoolEdgeConstraints}
            setPoolPoints={setPoolPoints}
            setViewAspectRatio={setViewAspectRatio}
            setViewBox={setViewBox}
            supportSegments={calculations.supportLayout.segments}
            onResetView={fitViewBox}
            viewBox={viewBox}
            zoomPercent={zoomPercent}
          />
        </section>

        <RightCalculatorSidebar
          open={calculatorOpen}
          onClose={() => {
            setCalculatorOpen(false)
            scheduleFitViewBox()
          }}
        >
          <CalculatorPanel
            calculations={calculations}
            ensureProject={ensureCurrentProject}
            house={house}
            projectId={currentProjectId}
            setHouse={setHouse}
          />
        </RightCalculatorSidebar>
        <CalculatorSidebarToggle
          open={calculatorOpen}
          onToggle={() => {
            setCalculatorOpen((currentOpen) => !currentOpen)
            scheduleFitViewBox()
          }}
        />

        <section className="lg:hidden">
          <CalculatorPanel
            calculations={calculations}
            ensureProject={ensureCurrentProject}
            house={house}
            projectId={currentProjectId}
            setHouse={setHouse}
          />
        </section>
      </div>

      <MobileSummary
        calculations={calculations}
        ensureProject={ensureCurrentProject}
        house={house}
        projectId={currentProjectId}
        setHouse={setHouse}
      />
    </main>
  )
}

function RightCalculatorSidebar({
  children,
  onClose,
  open,
}: {
  children: ReactNode
  onClose: () => void
  open: boolean
}) {
  return (
    <aside
      aria-hidden={!open}
      className={
        open
          ? "fixed top-[calc(var(--header-height)+var(--spacing)*5)] right-3 bottom-3 z-20 hidden w-[320px] translate-x-0 overflow-hidden rounded-lg border bg-sidebar text-sidebar-foreground shadow-sm transition-transform duration-200 lg:block xl:top-[calc(var(--header-height)+var(--spacing)*6)] xl:right-5 xl:bottom-5 xl:w-[360px]"
          : "fixed top-[calc(var(--header-height)+var(--spacing)*5)] right-3 bottom-3 z-20 hidden w-[320px] translate-x-[calc(100%+var(--spacing)*6)] overflow-hidden rounded-lg border bg-sidebar text-sidebar-foreground shadow-sm transition-transform duration-200 lg:block xl:top-[calc(var(--header-height)+var(--spacing)*6)] xl:right-5 xl:bottom-5 xl:w-[360px]"
      }
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start gap-3 border-b px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Project calculator</p>
            <p className="text-xs text-muted-foreground">
              Measurements, materials, and quote estimate.
            </p>
          </div>
          <Button
            aria-label="Close calculator sidebar"
            className="-me-1 size-8 shrink-0"
            size="icon"
            title="Close calculator"
            variant="ghost"
            onClick={onClose}
          >
            <ChevronRightIcon />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
      </div>
    </aside>
  )
}

function CalculatorSidebarToggle({
  onToggle,
  open,
}: {
  onToggle: () => void
  open: boolean
}) {
  if (open) {
    return null
  }

  return (
    <Button
      aria-label="Open calculator sidebar"
      className="fixed top-[calc(var(--header-height)+var(--spacing)*6)] right-3 z-30 hidden h-10 rounded-full border bg-background/95 px-3 shadow-sm backdrop-blur lg:inline-flex xl:right-5"
      size="sm"
      title="Open calculator"
      variant="secondary"
      onClick={onToggle}
    >
      <ChevronLeftIcon />
      Calculator
    </Button>
  )
}
