"use client"

import type { ReactNode } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  CheckCircle2Icon,
  Layers3Icon,
  LightbulbIcon,
  Maximize2Icon,
  MenuIcon,
  Minimize2Icon,
  MoreHorizontalIcon,
  MousePointer2Icon,
  PanelRightIcon,
  PencilIcon,
  RulerIcon,
  Redo2Icon,
  Share2Icon,
  SlashIcon,
  SquareIcon,
  Undo2Icon,
} from "lucide-react"

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
type MobilePanel = "layers" | "more" | null
type MobileToolLabel = "Välj" | "Punkt" | "Kant" | "Rätvinkel" | "Mått"

const AUTOSAVE_DELAY_MS = 1200
const FALLBACK_PROJECT_NAME = "Untitled"
const DESKTOP_FIT_ZOOM = 1.14

export function Workspace({
  demoMode = false,
  onProjectNameChange,
}: {
  demoMode?: boolean
  onProjectNameChange?: (name: string) => void
}) {
  const { setOpen, setOpenMobile, toggleSidebar } = useSidebar()
  const searchParams = useSearchParams()
  const requestedProjectId = searchParams.get("projectId")
  const [calculatorOpen, setCalculatorOpen] = useState(true)
  const [plannerToolsCollapsed, setPlannerToolsCollapsed] = useState(true)
  const [mobileTipsOpen, setMobileTipsOpen] = useState(true)
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null)
  const [mobileToolLabel, setMobileToolLabel] =
    useState<MobileToolLabel>("Välj")
  const [mobileDoneVisible, setMobileDoneVisible] = useState(false)
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
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(
    demoMode ? "demo" : null
  )
  const [currentProjectName, setCurrentProjectName] = useState(
    demoMode ? "Demo project" : FALLBACK_PROJECT_NAME
  )
  const [saveStatus, setSaveStatus] = useState<SaveStatus | "Demo mode">(
    demoMode ? "Demo mode" : "Unsaved changes"
  )
  const [demoOpenAIKey, setDemoOpenAIKey] = useState("")
  const viewBoxRef = useRef(viewBox)
  const viewAspectRatioRef = useRef(viewAspectRatio)
  const fitStateRef = useRef<{
    deckPoints: Point[]
    houseBounds: ReturnType<typeof getHouseBounds>
    poolPoints: Point[] | null
  } | null>(null)
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
    const nextViewBox =
      getFitViewBox(
        houseBounds,
        deckPoints,
        poolPoints ?? [],
        viewAspectRatioRef.current
      )
    setViewBox(getDesktopEnhancedFitViewBox(nextViewBox))
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
    fitStateRef.current = {
      deckPoints,
      houseBounds,
      poolPoints,
    }
  }, [deckPoints, houseBounds, poolPoints])

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !window.matchMedia("(min-width: 1024px)").matches
    ) {
      return
    }

    const frameId = requestAnimationFrame(() => {
      const fitState = fitStateRef.current
      if (!fitState) {
        return
      }

      setViewBox(
        getDesktopEnhancedFitViewBox(
          getFitViewBox(
            fitState.houseBounds,
            fitState.deckPoints,
            fitState.poolPoints ?? [],
            viewAspectRatioRef.current
          )
        )
      )
    })

    return () => cancelAnimationFrame(frameId)
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
          getDesktopEnhancedFitViewBox(
            getFitViewBox(
              houseBounds,
              deckPoints,
              poolPoints ?? [],
              viewAspectRatioRef.current
            )
          )
        )
      })

      return () => cancelAnimationFrame(frameId)
    }
  }, [deckPoints, houseBounds, poolPoints])

  useEffect(() => {
    if (demoMode) {
      autosaveReadyRef.current = true
      const frameId = requestAnimationFrame(() => {
        onProjectNameChange?.("Demo project")
      })

      return () => cancelAnimationFrame(frameId)
    }

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
        setViewBox(
          getDesktopEnhancedFitViewBox(
            getFitViewBox(
              getHouseBounds(version.state.house),
              version.state.deckPoints,
              version.state.poolPoints ?? [],
              viewAspectRatioRef.current
            )
          )
        )
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
  }, [demoMode, onProjectNameChange, requestedProjectId])

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
      if (demoMode) {
        setSaveStatus("Demo mode")
        return
      }

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
    [currentProjectId, demoMode, getPlannerState, onProjectNameChange]
  )

  const ensureCurrentProject = useCallback(async () => {
    if (demoMode) {
      setSaveStatus("Demo mode")
      return "demo"
    }

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
  }, [currentProjectId, demoMode, getPlannerState, onProjectNameChange])

  useEffect(() => {
    if (demoMode) {
      return
    }

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
    demoMode,
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

  function handleSelectMobileTool(tool: ActiveTool, label: MobileToolLabel) {
    setMobileToolLabel(label)
    handleSelectTool(tool)
  }

  async function handleMobileDone() {
    await handleSaveProject()
    setMobileDoneVisible(true)
    window.setTimeout(() => setMobileDoneVisible(false), 1400)
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
    <main className="flex h-svh flex-1 flex-col overflow-hidden bg-[#f7f4ee] dark:bg-background lg:!h-[calc(100vh-1rem)] lg:!max-h-[calc(100vh-1rem)] lg:min-h-0 lg:bg-[#f6f5f1]">
      <div
        className={
          calculatorOpen
            ? "flex min-h-0 flex-1 flex-col gap-0 p-0 transition-[padding] duration-200 lg:gap-0 lg:p-0 lg:pr-[336px] xl:pr-[376px]"
            : "flex min-h-0 flex-1 flex-col gap-0 p-0 transition-[padding] duration-200 lg:gap-0 lg:p-0"
        }
      >
        <div className="min-h-0 min-w-0 flex-1 lg:flex lg:flex-col">
          <section className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-stone-50 dark:bg-zinc-950 lg:flex lg:flex-col lg:bg-white">
            {demoMode ? (
              <div className="absolute top-3 right-3 z-30 rounded-lg border border-amber-200 bg-amber-50/95 px-3 py-1.5 text-xs font-medium text-amber-900 shadow-sm backdrop-blur">
                Demo mode · changes are not saved
              </div>
            ) : null}
            <DesktopWorkspaceHeader
              projectName={currentProjectName}
              saveStatus={saveStatus}
              onToggleSidebar={toggleSidebar}
            />
            <div className="hidden lg:block">
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
            </div>
            <MobilePlannerChrome
              modeLabel={modeLabel}
              mobileDoneVisible={mobileDoneVisible}
              mobilePanel={mobilePanel}
              mobileTipsOpen={mobileTipsOpen}
              mobileToolLabel={mobileToolLabel}
              projectName={currentProjectName}
              saveStatus={saveStatus}
              viewMode={viewMode}
              zoomPercent={zoomPercent}
              onClosePanel={() => setMobilePanel(null)}
              onDone={handleMobileDone}
              onFitView={fitViewBox}
              onLayers={() =>
                setMobilePanel((currentPanel) =>
                  currentPanel === "layers" ? null : "layers"
                )
              }
              onMenu={() => setOpenMobile(true)}
              onMore={() =>
                setMobilePanel((currentPanel) =>
                  currentPanel === "more" ? null : "more"
                )
              }
              onSave={handleMobileDone}
              onSelectTool={handleSelectMobileTool}
              onToggleTips={() =>
                setMobileTipsOpen((currentOpen) => !currentOpen)
              }
              onViewModeChange={setViewMode}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
            />
            {viewMode === "top" ? (
              <FeatureToolList
                activeTool={activeTool}
                className="absolute top-[152px] left-5 z-30 hidden lg:block"
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
            deckPoints={deckPoints}
            demoMode={demoMode}
            demoOpenAIKey={demoOpenAIKey}
            ensureProject={ensureCurrentProject}
            elevationSettings={elevationSettings}
            features={features}
            placementMode={placementMode}
            poolPoints={poolPoints}
            selectedFeature={selectedFeature}
            house={house}
            projectId={currentProjectId}
            projectName={currentProjectName}
            setBoardDirection={setBoardDirection}
            setElevationSettings={setElevationSettings}
            setHouse={setHouse}
            setDemoOpenAIKey={setDemoOpenAIKey}
            viewMode={viewMode}
            onDeleteFeature={handleDeleteFeature}
            onUpdateFeature={handleUpdateFeature}
          />
        </RightCalculatorSidebar>

        <section className="hidden lg:hidden">
          <CalculatorPanel
            calculations={calculations}
            boardDirection={boardDirection}
            deckPoints={deckPoints}
            demoMode={demoMode}
            demoOpenAIKey={demoOpenAIKey}
            ensureProject={ensureCurrentProject}
            elevationSettings={elevationSettings}
            features={features}
            placementMode={placementMode}
            poolPoints={poolPoints}
            selectedFeature={selectedFeature}
            house={house}
            projectId={currentProjectId}
            projectName={currentProjectName}
            setBoardDirection={setBoardDirection}
            setElevationSettings={setElevationSettings}
            setHouse={setHouse}
            setDemoOpenAIKey={setDemoOpenAIKey}
            viewMode={viewMode}
            onDeleteFeature={handleDeleteFeature}
            onUpdateFeature={handleUpdateFeature}
          />
        </section>
      </div>

      <div className="hidden">
        <MobileSummary
        calculations={calculations}
        boardDirection={boardDirection}
        deckPoints={deckPoints}
        ensureProject={ensureCurrentProject}
        elevationSettings={elevationSettings}
        features={features}
        placementMode={placementMode}
        poolPoints={poolPoints}
        selectedFeature={selectedFeature}
        house={house}
        projectId={currentProjectId}
        projectName={currentProjectName}
        setBoardDirection={setBoardDirection}
        setElevationSettings={setElevationSettings}
        setHouse={setHouse}
        viewMode={viewMode}
        onDeleteFeature={handleDeleteFeature}
        onUpdateFeature={handleUpdateFeature}
        />
      </div>
    </main>
  )
}

function DesktopWorkspaceHeader({
  onToggleSidebar,
  projectName,
  saveStatus,
}: {
  onToggleSidebar: () => void
  projectName: string
  saveStatus: SaveStatus | "Demo mode"
}) {
  return (
    <div className="hidden h-[72px] shrink-0 items-center justify-between border-b border-stone-200 bg-white px-6 lg:flex">
      <div className="flex min-w-0 items-center gap-4">
        <button
          aria-label="Toggle navigation sidebar"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-stone-900 hover:bg-stone-100"
          type="button"
          onClick={onToggleSidebar}
        >
          <PanelRightIcon className="size-5" />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-semibold tracking-tight text-stone-950">
              {projectName}
            </h1>
            <button
              aria-label="Redigera projektnamn"
              className="flex size-6 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-950"
              type="button"
            >
              <PencilIcon className="size-3.5" />
            </button>
          </div>
          <p className="mt-0.5 text-xs text-stone-500">
            {saveStatus === "Saved"
              ? "Senast sparad nyss"
              : saveStatus === "Demo mode"
                ? "Demo-läge"
                : saveStatus}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <DesktopHeaderButton label="Ångra">
          <Undo2Icon />
        </DesktopHeaderButton>
        <DesktopHeaderButton label="Gör om">
          <Redo2Icon />
        </DesktopHeaderButton>
        <DesktopHeaderButton label="Fler alternativ">
          <MoreHorizontalIcon />
        </DesktopHeaderButton>
      </div>
    </div>
  )
}

function DesktopHeaderButton({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <button
      aria-label={label}
      className="flex size-8 items-center justify-center rounded-lg text-stone-700 hover:bg-stone-100 hover:text-stone-950 [&_svg]:size-4"
      title={label}
      type="button"
    >
      {children}
    </button>
  )
}

function MobilePlannerChrome({
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
              <p className="text-[11px] leading-tight text-zinc-500">1 ruta = 0.5 m</p>
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

function getDesktopEnhancedFitViewBox(viewBox: ViewBox): ViewBox {
  if (
    typeof window === "undefined" ||
    !window.matchMedia("(min-width: 1024px)").matches
  ) {
    return viewBox
  }

  return zoomViewBox(viewBox, DESKTOP_FIT_ZOOM)
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
          className="fixed top-5 right-3 z-30 hidden lg:inline-flex xl:right-5"
          title="Open calculator sidebar"
          onClick={onToggle}
        />
      ) : null}
      <aside
        aria-hidden={!open}
        className={
          open
            ? "fixed inset-y-0 right-0 z-20 hidden w-[320px] translate-x-0 border-s border-stone-200 bg-white text-sidebar-foreground transition-transform duration-200 lg:flex xl:w-[360px]"
            : "pointer-events-none fixed inset-y-0 right-0 z-20 hidden w-[320px] translate-x-full border-s border-stone-200 bg-white text-sidebar-foreground transition-transform duration-200 lg:flex xl:w-[360px]"
        }
      >
        <div className="flex h-full min-h-0 w-full flex-col">
          <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-stone-200 px-4 lg:px-5">
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
          <div className="min-h-0 flex-1 overflow-y-auto p-3.5">{children}</div>
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
    return "Rita"
  }

  if (activeTool === "measure") {
    return "Mät"
  }

  if (activeTool === "pan") {
    return "Panorera"
  }

  return "Välj"
}
