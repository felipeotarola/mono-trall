"use client"

import type { Dispatch, SetStateAction } from "react"
import { useCallback, useState } from "react"

import { AIVisualizationPanel } from "@/components/trall/ai-visualization-panel"
import { AppearanceSettingsCard } from "@/components/trall/calculator-panel/cards/appearance-settings-card"
import { BoardDirectionSummary } from "@/components/trall/calculator-panel/cards/board-direction-summary"
import { ElevationSettingsCard } from "@/components/trall/calculator-panel/cards/elevation-settings-card"
import { HouseDimensionsCard } from "@/components/trall/calculator-panel/cards/house-dimensions-card"
import {
  MeasurementsCard,
  PriceSummaryCard,
  ProjectSummaryCard,
  TerrainSummaryCard,
} from "@/components/trall/calculator-panel/cards/overview-cards"
import {
  inspectorTabs,
  InspectorTabPanel,
  type InspectorTab,
} from "@/components/trall/calculator-panel/inspector-tabs"
import { FeatureSettingsCard } from "@/components/trall/features/feature-settings-card"
import { MaterialsManager } from "@/components/trall/materials-manager"
import { buildAIPlanSummary } from "@/lib/trall/ai-visualization"
import type { ElevationSettings } from "@/lib/trall/elevation"
import type {
  BoardDirectionSettings,
  DeckFeature,
  FeaturePlacementType,
} from "@/lib/trall/features"
import { formatCurrency } from "@/lib/trall/format"
import {
  emptyMaterialTotals,
  type ProjectMaterialSummary,
} from "@/lib/trall/materials"
import type { SupportLayout } from "@/lib/trall/supports"
import type {
  HouseModel,
  Material,
  Metric,
  PlannerViewMode,
  Point,
} from "@/lib/trall/types"

type CalculatorPanelProps = {
  boardDirection: BoardDirectionSettings
  calculations: {
    areaM2: number
    priceLabel: string
    supportLayout: SupportLayout
    metrics: Metric[]
    materials: Material[]
  }
  deckPoints: Point[]
  demoMode?: boolean
  demoOpenAIKey?: string
  elevationSettings: ElevationSettings
  ensureProject: () => Promise<string>
  features: DeckFeature[]
  house: HouseModel
  placementMode: FeaturePlacementType | null
  poolPoints: Point[] | null
  projectId: string | null
  projectName: string
  selectedFeature: DeckFeature | null
  setBoardDirection: (settings: BoardDirectionSettings) => void
  setDemoOpenAIKey?: (key: string) => void
  setElevationSettings: Dispatch<SetStateAction<ElevationSettings>>
  setHouse: Dispatch<SetStateAction<HouseModel>>
  viewMode: PlannerViewMode
  onDeleteFeature: (featureId: string) => void
  onUpdateFeature: (feature: DeckFeature) => void
}

export function CalculatorPanel({
  boardDirection,
  calculations,
  deckPoints,
  demoMode = false,
  demoOpenAIKey = "",
  elevationSettings,
  ensureProject,
  features,
  house,
  poolPoints,
  projectId,
  projectName,
  selectedFeature,
  setBoardDirection,
  setDemoOpenAIKey,
  setElevationSettings,
  setHouse,
  viewMode,
  onDeleteFeature,
  onUpdateFeature,
}: CalculatorPanelProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>("overview")
  const [projectMaterialSummary, setProjectMaterialSummary] =
    useState<ProjectMaterialSummary>({
      ...emptyMaterialTotals,
      itemCount: 0,
    })

  const handleProjectMaterialSummaryChange = useCallback(
    (summary: ProjectMaterialSummary) => {
      setProjectMaterialSummary(summary)
    },
    []
  )
  const hasProjectMaterials = projectMaterialSummary.itemCount > 0
  const displayPrice = hasProjectMaterials
    ? formatCurrency(projectMaterialSummary.totalCost)
    : calculations.priceLabel
  const aiPlanSummary = buildAIPlanSummary({
    areaM2: calculations.areaM2,
    deckPoints,
    elevationSettings,
    features,
    house,
    poolPoints,
    projectName,
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="sticky top-0 z-10 -mx-3.5 -mt-3.5 border-b bg-white px-3.5 pt-3.5">
        <div className="flex gap-1 overflow-x-auto pb-2">
          {inspectorTabs.map((tab) => (
            <button
              key={tab.id}
              aria-pressed={activeTab === tab.id}
              className={
                activeTab === tab.id
                  ? "flex h-9 shrink-0 items-center border-b-2 border-stone-950 px-1.5 text-sm font-semibold text-stone-950"
                  : "flex h-9 shrink-0 items-center border-b-2 border-transparent px-1.5 text-sm font-medium text-stone-500 hover:text-stone-950"
              }
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="hidden size-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <InspectorTabPanel active={activeTab === "overview"}>
        <FeatureSettingsCard
          feature={selectedFeature}
          onDelete={onDeleteFeature}
          onUpdate={onUpdateFeature}
        />
        <PriceSummaryCard
          hasProjectMaterials={hasProjectMaterials}
          price={displayPrice}
        />
        <MeasurementsCard metrics={calculations.metrics} />
        <BoardDirectionSummary
          boardDirection={boardDirection}
          onChange={setBoardDirection}
        />
        <TerrainSummaryCard
          elevationSettings={elevationSettings}
          onEdit={() => setActiveTab("3d")}
        />
        <ProjectSummaryCard projectName={projectName} />
      </InspectorTabPanel>

      <InspectorTabPanel active={activeTab === "materials"}>
        <MaterialsManager
          deckAreaM2={calculations.areaM2}
          demoMode={demoMode}
          ensureProject={ensureProject}
          onSummaryChange={handleProjectMaterialSummaryChange}
          projectId={projectId}
          supportLayout={calculations.supportLayout}
        />
      </InspectorTabPanel>

      <InspectorTabPanel active={activeTab === "3d"}>
        <ElevationSettingsCard
          elevationSettings={elevationSettings}
          setElevationSettings={setElevationSettings}
        />
        <AppearanceSettingsCard
          elevationSettings={elevationSettings}
          setElevationSettings={setElevationSettings}
        />
      </InspectorTabPanel>

      <InspectorTabPanel active={activeTab === "ai"}>
        <AIVisualizationPanel
          demoMode={demoMode}
          demoOpenAIKey={demoOpenAIKey}
          ensureProject={ensureProject}
          planSummary={aiPlanSummary}
          projectId={projectId}
          setDemoOpenAIKey={setDemoOpenAIKey}
          viewMode={viewMode}
        />
      </InspectorTabPanel>

      <InspectorTabPanel active={activeTab === "house"}>
        <HouseDimensionsCard house={house} setHouse={setHouse} />
      </InspectorTabPanel>
    </div>
  )
}
