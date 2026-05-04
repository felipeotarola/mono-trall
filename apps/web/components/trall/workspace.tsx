"use client"

import type { ReactNode } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Maximize2Icon, Minimize2Icon, PanelRightIcon } from "lucide-react"

import { CalculatorPanel } from "@/components/trall/calculator-panel"
import { CanvasToolbar } from "@/components/trall/canvas-toolbar"
import { FeatureToolList } from "@/components/trall/features/feature-tool-list"
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
import {
  getDefaultElevationSettings,
  normalizeElevationSettings,
  type ElevationSettings,
} from "@/lib/trall/elevation"
import {
  defaultBoardDirection,
  deleteFeature,
  normalizeBoardDirection,
  normalizeDeckFeatures,
  updateFeature,
  type BoardDirectionSettings,
  type DeckFeature,
  type FeaturePlacementType,
} from "@/lib/trall/features"
import { getHouseBounds } from "@/lib/trall/house"
import {
  CURRENT_PROJECT_STORAGE_KEY,
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
  PlannerViewMode,
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

const AUTOSAVE_DELAY_MS = 1200
const FALLBACK_PROJECT_NAME = "Untitled"

export function Workspace({
  onProjectNameChange,
}: {
  onProjectNameChange?: (name: string) => void
}) {
  const { setOpen, setOpenMobile } = useSidebar()
  const searchParams = useSearchParams()
  const requestedProjectId = searchParams.get("projectId")
  const [calculatorOpen, setCalculatorOpen] = useState(true)
  const [plannerToolsCollapsed, setPlannerToolsCollapsed] = useState(true)
  const [viewMode, setViewMode] = useState<PlannerViewMode>("top")
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
  const [features, setFeatures] = useState<DeckFeature[]>([])
  const [boardDirection, setBoardDirection] = useState<BoardDirectionSettings>(
    defaultBoardDirection
  )
  const [elevationSettings, setElevationSettings] =
    useState<ElevationSettings>(getDefaultElevationSettings)
  const [placementMode, setPlacementMode] =
    useState<FeaturePlacementType | null>(null)
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(
    null
  )
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
  const [currentProjectName, setCurrentProjectName] = useState(
    FALLBACK_PROJECT_NAME
  )
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("Unsaved changes")
  const viewBoxRef = useRef(viewBox)
  const viewAspectRatioRef = useRef(viewAspectRatio)
  const hydratingProjectRef = useRef(false)
  const autosaveReadyRef = useRef(false)
  const latestSaveRequestRef = useRef(0)

  const houseBounds = useMemo(() => getHouseBounds(house), [house])
  const selectedFeature = useMemo(
    () =>
      features.find((feature) => feature.id === selectedFeatureId) ?? null,
    [features, selectedFeatureId]
  )
  const modeLabel = getModeLabel(activeTool, placementMode)
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
          setCurrentProjectName(FALLBACK_PROJECT_NAME)
          onProjectNameChange?.(FALLBACK_PROJECT_NAME)
          autosaveReadyRef.current = true
          return
        }

        const storedProjectId =
          requestedProjectId ??
          window.localStorage.getItem(CURRENT_PROJECT_STORAGE_KEY)
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
        setCurrentProjectName(project.name)
        onProjectNameChange?.(project.name)
        setHouse(version.state.house)
        setDeckPoints(version.state.deckPoints)
        setDeckEdgeConstraints(version.state.deckEdgeConstraints ?? [])
        setMeasurements(version.state.measurements ?? [])
        setFeatures(normalizeDeckFeatures(version.state.features))
        setBoardDirection(normalizeBoardDirection(version.state.boardDirection))
        setElevationSettings(
          normalizeElevationSettings(version.state.elevationSettings)
        )
        setPlacementMode(null)
        setSelectedFeatureId(null)
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
  }, [onProjectNameChange, requestedProjectId])

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
      features,
      boardDirection,
      elevationSettings,
      poolPoints,
      poolEdgeConstraints,
      viewBox,
      materials: {
        items: calculations.materials,
      },
    }),
    [
      calculations.materials,
      boardDirection,
      deckEdgeConstraints,
      deckPoints,
      elevationSettings,
      features,
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
          const project = await createProject(FALLBACK_PROJECT_NAME, state)
          hydratingProjectRef.current = true
          setCurrentProjectId(project.id)
          setCurrentProjectName(project.name)
          onProjectNameChange?.(project.name)
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
    [currentProjectId, getPlannerState, onProjectNameChange]
  )

  const ensureCurrentProject = useCallback(async () => {
    if (currentProjectId) {
      return currentProjectId
    }

    setSaveStatus("Saving...")
    const project = await createProject(
      FALLBACK_PROJECT_NAME,
      getPlannerState()
    )
    hydratingProjectRef.current = true
    setCurrentProjectId(project.id)
    setCurrentProjectName(project.name)
    onProjectNameChange?.(project.name)
    setSaveStatus("Saved")
    window.localStorage.setItem(CURRENT_PROJECT_STORAGE_KEY, project.id)
    requestAnimationFrame(() => {
      hydratingProjectRef.current = false
      autosaveReadyRef.current = true
    })

    return project.id
  }, [currentProjectId, getPlannerState, onProjectNameChange])

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
    features,
    boardDirection,
    elevationSettings,
    poolEdgeConstraints,
    poolPoints,
    savePlannerState,
    viewBox,
  ])

  async function handleSaveProject() {
    await savePlannerState({ source: "manual" })
  }

  function handleAddPool() {
    setPlacementMode(null)
    setSelectedFeatureId(null)
    setActiveTool("select")
    setPoolPoints((currentPoints) => currentPoints ?? [...initialPoolPoints])
    setActivePointIndex(null)
    setActivePoolPointIndex(0)
  }

  function handleSelectTool(tool: ActiveTool) {
    setPlacementMode(null)
    setSelectedFeatureId(null)
    setActiveTool(tool)
  }

  function handleSelectFeatureTool(featureType: FeaturePlacementType) {
    setActiveTool("select")
    setActivePointIndex(null)
    setActivePoolPointIndex(null)
    setPlacementMode((currentMode) =>
      currentMode === featureType ? null : featureType
    )
    if (featureType !== "boardDirection") {
      setSelectedFeatureId(null)
    }
  }

  function handleFeaturePlaced(featureId: string, keepPlacement = false) {
    setSelectedFeatureId(featureId)
    if (!keepPlacement) {
      setPlacementMode(null)
    }
  }

  function handleUpdateFeature(nextFeature: DeckFeature) {
    setFeatures((currentFeatures) =>
      updateFeature(currentFeatures, nextFeature.id, () => nextFeature)
    )
  }

  function handleDeleteFeature(featureId: string) {
    setFeatures((currentFeatures) => deleteFeature(currentFeatures, featureId))
    setSelectedFeatureId((currentId) =>
      currentId === featureId ? null : currentId
    )
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
    label: calculatorOpen ? "Focus canvas" : "Show panels",
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
        <div className="min-w-0 flex-1">
          <section className="relative min-w-0 flex-1 overflow-hidden rounded-lg border bg-stone-50 shadow-sm dark:bg-zinc-950">
            <CanvasToolbar
              activeTool={activeTool}
              extraTool={expandTool}
              modeLabel={modeLabel}
              onResetView={fitViewBox}
              onSaveProject={handleSaveProject}
              onViewModeChange={setViewMode}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              saveStatus={saveStatus}
              setActiveTool={handleSelectTool}
              viewMode={viewMode}
              zoomPercent={zoomPercent}
            />
            {viewMode === "top" ? (
              <FeatureToolList
                activeTool={activeTool}
                className="absolute top-36 left-3 z-30 sm:top-32 xl:top-20"
                collapsed={plannerToolsCollapsed}
                placementMode={placementMode}
                onAddPool={handleAddPool}
                onSelectFeatureTool={handleSelectFeatureTool}
                onSelectTool={handleSelectTool}
                onToggleCollapsed={() =>
                  setPlannerToolsCollapsed((currentValue) => !currentValue)
                }
              />
            ) : null}
            <PlanningSurface
              activeTool={activeTool}
              activePointIndex={activePointIndex}
              activePoolPointIndex={activePoolPointIndex}
              boardDirection={boardDirection}
              deckEdgeConstraints={deckEdgeConstraints}
              deckPoints={deckPoints}
              elevationSettings={elevationSettings}
              features={features}
              house={house}
              houseBounds={houseBounds}
              measurements={measurements}
              placementMode={placementMode}
              poolEdgeConstraints={poolEdgeConstraints}
              poolPoints={poolPoints}
              selectedFeatureId={selectedFeatureId}
              setActivePointIndex={setActivePointIndex}
              setDeckEdgeConstraints={setDeckEdgeConstraints}
              setDeckPoints={setDeckPoints}
              setActivePoolPointIndex={setActivePoolPointIndex}
              setFeatures={setFeatures}
              setHouse={setHouse}
              setMeasurements={setMeasurements}
              setPoolEdgeConstraints={setPoolEdgeConstraints}
              setPoolPoints={setPoolPoints}
              setSelectedFeatureId={setSelectedFeatureId}
              setViewAspectRatio={setViewAspectRatio}
              setViewBox={setViewBox}
              supportSegments={calculations.supportLayout.segments}
              onDeleteFeature={handleDeleteFeature}
              onFeaturePlaced={handleFeaturePlaced}
              onResetView={fitViewBox}
              viewBox={viewBox}
              viewMode={viewMode}
              zoomPercent={zoomPercent}
            />
          </section>
        </div>

        <RightCalculatorSidebar
          open={calculatorOpen}
          onToggle={() => {
            setCalculatorOpen((currentOpen) => !currentOpen)
            scheduleFitViewBox()
          }}
        >
          <CalculatorPanel
            calculations={calculations}
            boardDirection={boardDirection}
            ensureProject={ensureCurrentProject}
            elevationSettings={elevationSettings}
            placementMode={placementMode}
            selectedFeature={selectedFeature}
            house={house}
            projectId={currentProjectId}
            projectName={currentProjectName}
            setBoardDirection={setBoardDirection}
            setElevationSettings={setElevationSettings}
            setHouse={setHouse}
            onDeleteFeature={handleDeleteFeature}
            onUpdateFeature={handleUpdateFeature}
          />
        </RightCalculatorSidebar>

        <section className="lg:hidden">
          <CalculatorPanel
            calculations={calculations}
            boardDirection={boardDirection}
            ensureProject={ensureCurrentProject}
            elevationSettings={elevationSettings}
            placementMode={placementMode}
            selectedFeature={selectedFeature}
            house={house}
            projectId={currentProjectId}
            projectName={currentProjectName}
            setBoardDirection={setBoardDirection}
            setElevationSettings={setElevationSettings}
            setHouse={setHouse}
            onDeleteFeature={handleDeleteFeature}
            onUpdateFeature={handleUpdateFeature}
          />
        </section>
      </div>

      <MobileSummary
        calculations={calculations}
        boardDirection={boardDirection}
        ensureProject={ensureCurrentProject}
        elevationSettings={elevationSettings}
        placementMode={placementMode}
        selectedFeature={selectedFeature}
        house={house}
        projectId={currentProjectId}
        projectName={currentProjectName}
        setBoardDirection={setBoardDirection}
        setElevationSettings={setElevationSettings}
        setHouse={setHouse}
        onDeleteFeature={handleDeleteFeature}
        onUpdateFeature={handleUpdateFeature}
      />
    </main>
  )
}

function RightCalculatorSidebar({
  children,
  onToggle,
  open,
}: {
  children: ReactNode
  onToggle: () => void
  open: boolean
}) {
  return (
    <>
      {!open ? (
        <CalculatorSidebarTrigger
          ariaLabel="Open calculator sidebar"
          className="fixed top-[calc((var(--header-height)-var(--spacing)*7)/2)] right-3 z-30 hidden lg:inline-flex xl:right-5"
          title="Open calculator sidebar"
          onClick={onToggle}
        />
      ) : null}
      <aside
        aria-hidden={!open}
        className={
          open
            ? "fixed inset-y-0 right-0 z-20 hidden w-[320px] translate-x-0 border-s bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:flex xl:w-[360px]"
            : "pointer-events-none fixed inset-y-0 right-0 z-20 hidden w-[320px] translate-x-full border-s bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:flex xl:w-[360px]"
        }
      >
        <div className="flex h-full min-h-0 w-full flex-col">
          <div className="flex h-(--header-height) shrink-0 items-center gap-3 border-b px-4 lg:px-6">
            <CalculatorSidebarTrigger
              ariaLabel="Close calculator sidebar"
              className="-ms-1"
              title="Close calculator sidebar"
              onClick={onToggle}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                Project calculator
              </p>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
        </div>
      </aside>
    </>
  )
}

function CalculatorSidebarTrigger({
  ariaLabel,
  className,
  onClick,
  title,
}: {
  ariaLabel: string
  className?: string
  onClick: () => void
  title: string
}) {
  return (
    <Button
      aria-label={ariaLabel}
      className={className}
      size="icon-sm"
      title={title}
      variant="ghost"
      onClick={onClick}
    >
      <PanelRightIcon />
      <span className="sr-only">{ariaLabel}</span>
    </Button>
  )
}

function getModeLabel(
  activeTool: ActiveTool,
  placementMode: FeaturePlacementType | null
) {
  if (placementMode === "stairs") {
    return "Placing stairs"
  }

  if (placementMode === "railing") {
    return "Placing fence"
  }

  if (placementMode === "pergola") {
    return "Placing pergola"
  }

  if (placementMode === "privacyScreen") {
    return "Placing privacy screen"
  }

  if (
    placementMode === "siteTree" ||
    placementMode === "siteBush" ||
    placementMode === "sitePlanter" ||
    placementMode === "siteLight"
  ) {
    return "Placing landscape"
  }

  if (placementMode === "boardDirection") {
    return "Board direction"
  }

  if (activeTool === "draw") {
    return "Draw deck"
  }

  if (activeTool === "measure") {
    return "Measure"
  }

  if (activeTool === "pan") {
    return "Pan"
  }

  return "Select"
}
