"use client"

import type { Dispatch, SetStateAction } from "react"
import { useEffect, useRef } from "react"

import { Plan3DView } from "@/components/trall/plan-3d-view"
import { PlanSvg } from "@/components/trall/plan-svg"
import type { EdgeConstraint } from "@/lib/trall/edge-model"
import type { ElevationSettings } from "@/lib/trall/elevation"
import type {
  BoardDirectionSettings,
  DeckFeature,
  FeaturePlacementType,
} from "@/lib/trall/features"
import type {
  ActiveTool,
  HouseBounds,
  HouseModel,
  MeasurementLine,
  PlannerViewMode,
  Point,
  ViewBox,
} from "@/lib/trall/types"
import type { SupportSegment } from "@/lib/trall/supports"
import { trallPlanClasses } from "@/lib/trall/visual-style"

export function PlanningSurface({
  activeTool,
  activePointIndex,
  activePoolPointIndex,
  boardDirection,
  deckEdgeConstraints,
  deckPoints,
  elevationSettings,
  features,
  house,
  houseBounds,
  measurements,
  placementMode,
  poolEdgeConstraints,
  poolPoints,
  selectedFeatureId,
  setActivePointIndex,
  setDeckEdgeConstraints,
  setDeckPoints,
  setActivePoolPointIndex,
  setFeatures,
  setHouse,
  setMeasurements,
  setPoolEdgeConstraints,
  setPoolPoints,
  setSelectedFeatureId,
  setViewAspectRatio,
  setViewBox,
  supportSegments,
  onDeleteFeature,
  onFeaturePlaced,
  onResetView,
  viewBox,
  viewMode,
  zoomPercent,
}: {
  activeTool: ActiveTool
  activePointIndex: number | null
  activePoolPointIndex: number | null
  boardDirection: BoardDirectionSettings
  deckEdgeConstraints: EdgeConstraint[]
  deckPoints: Point[]
  elevationSettings: ElevationSettings
  features: DeckFeature[]
  house: HouseModel
  houseBounds: HouseBounds
  measurements: MeasurementLine[]
  placementMode: FeaturePlacementType | null
  poolEdgeConstraints: EdgeConstraint[]
  poolPoints: Point[] | null
  selectedFeatureId: string | null
  setActivePointIndex: (index: number | null) => void
  setDeckEdgeConstraints: Dispatch<SetStateAction<EdgeConstraint[]>>
  setDeckPoints: Dispatch<SetStateAction<Point[]>>
  setActivePoolPointIndex: (index: number | null) => void
  setFeatures: Dispatch<SetStateAction<DeckFeature[]>>
  setHouse: Dispatch<SetStateAction<HouseModel>>
  setMeasurements: Dispatch<SetStateAction<MeasurementLine[]>>
  setPoolEdgeConstraints: Dispatch<SetStateAction<EdgeConstraint[]>>
  setPoolPoints: Dispatch<SetStateAction<Point[] | null>>
  setSelectedFeatureId: (featureId: string | null) => void
  setViewAspectRatio: (aspectRatio: number) => void
  setViewBox: Dispatch<SetStateAction<ViewBox>>
  supportSegments: SupportSegment[]
  onDeleteFeature: (featureId: string) => void
  onFeaturePlaced: (featureId: string, keepPlacement?: boolean) => void
  onResetView: () => void
  viewBox: ViewBox
  viewMode: PlannerViewMode
  zoomPercent: number
}) {
  const canvasFrameRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvasFrame = canvasFrameRef.current
    if (!canvasFrame) {
      return
    }

    const updateAspectRatio = () => {
      const { width, height } = canvasFrame.getBoundingClientRect()
      if (width > 0 && height > 0) {
        setViewAspectRatio(width / height)
      }
    }

    updateAspectRatio()
    const resizeObserver = new ResizeObserver(updateAspectRatio)
    resizeObserver.observe(canvasFrame)

    return () => resizeObserver.disconnect()
  }, [setViewAspectRatio])

  return (
    <div
      className={`relative min-h-[calc(100svh-1.5rem)] overflow-hidden pt-[104px] ${viewMode === "top" ? "pb-[176px]" : "pb-0"} lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:pt-0 lg:pb-0 ${trallPlanClasses.page}`}
    >
      <div className={`absolute inset-0 ${trallPlanClasses.gridFine}`} />
      <div className={`absolute inset-0 ${trallPlanClasses.gridStrong}`} />
      <div className="absolute top-16 left-0 h-px w-full bg-stone-500/20" />
      <div className="absolute top-0 left-16 h-full w-px bg-stone-500/20" />
      <div className="absolute top-16 left-16 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-stone-700/55" />

      <div
        className={`relative flex ${viewMode === "top" ? "h-[calc(100svh-17.5rem)]" : "h-[calc(100svh-8rem)]"} min-h-[390px] items-stretch justify-center px-0 py-6 lg:h-0 lg:min-h-0 lg:flex-1 lg:px-5 lg:py-5`}
      >
        <div ref={canvasFrameRef} className="h-full w-full">
          {viewMode === "3d" ? (
            <Plan3DView
              boardDirection={boardDirection}
              deckEdgeConstraints={deckEdgeConstraints}
              deckPoints={deckPoints}
              elevationSettings={elevationSettings}
              features={features}
              house={house}
              houseBounds={houseBounds}
              poolPoints={poolPoints}
            />
          ) : (
            <PlanSvg
              activeTool={activeTool}
              activePointIndex={activePointIndex}
              activePoolPointIndex={activePoolPointIndex}
              boardDirection={boardDirection}
              deckEdgeConstraints={deckEdgeConstraints}
              deckPoints={deckPoints}
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
              setViewBox={setViewBox}
              supportSegments={supportSegments}
              onDeleteFeature={onDeleteFeature}
              onFeaturePlaced={onFeaturePlaced}
              onResetView={onResetView}
              viewBox={viewBox}
            />
          )}
        </div>
      </div>

      {viewMode === "top" ? (
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 hidden h-12 items-center justify-between gap-6 border-t border-stone-200 bg-white/92 px-5 text-xs text-stone-700 backdrop-blur lg:flex`}
        >
          <span className="min-w-0 truncate">
            Skala 1:100 · Rutnät 0.5 m · Zoom {zoomPercent}% · Snäpp Av ·
            Panorera
          </span>
          <span className="hidden shrink-0 text-stone-500 xl:inline">
            Tips: {getCompactPlannerTip(activeTool, placementMode)}
          </span>
        </div>
      ) : null}
    </div>
  )
}

function getCompactPlannerTip(
  activeTool: ActiveTool,
  placementMode: FeaturePlacementType | null
) {
  if (viewModeIsPlacement(placementMode)) {
    return "Klicka i planen för att placera valt objekt."
  }

  if (activeTool === "measure") {
    return "Dra för att mäta avstånd."
  }

  return "Dubbelklicka på en kant för att lägga till en nod."
}

function viewModeIsPlacement(placementMode: FeaturePlacementType | null) {
  return placementMode !== null && placementMode !== "boardDirection"
}
