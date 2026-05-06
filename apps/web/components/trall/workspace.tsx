"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  Maximize2Icon,
  Minimize2Icon,
} from "lucide-react"

import { CalculatorPanel } from "@/components/trall/calculator-panel"
import { CanvasToolbar } from "@/components/trall/canvas-toolbar"
import { FeatureToolList } from "@/components/trall/features/feature-tool-list"
import { MobileSummary } from "@/components/trall/mobile-summary"
import { PlanningSurface } from "@/components/trall/planning-surface"
import { DesktopWorkspaceHeader } from "@/components/trall/workspace/desktop-workspace-header"
import { MobilePlannerChrome } from "@/components/trall/workspace/mobile-planner-chrome"
import { getModeLabel } from "@/components/trall/workspace/mode-label"
import { RightCalculatorSidebar } from "@/components/trall/workspace/right-calculator-sidebar"
import type {
  MobilePanel,
  MobileToolLabel,
  SaveStatus,
} from "@/components/trall/workspace/types"
import { getDesktopEnhancedFitViewBox } from "@/components/trall/workspace/viewbox"
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
import { useSidebar } from "@workspace/ui/components/sidebar"

const AUTOSAVE_DELAY_MS = 1200
const FALLBACK_PROJECT_NAME = "Untitled"

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
