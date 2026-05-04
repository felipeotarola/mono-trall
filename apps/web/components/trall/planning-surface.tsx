"use client"

import type { Dispatch, SetStateAction } from "react"
import { useEffect, useRef } from "react"

import { Plan3DView } from "@/components/trall/plan-3d-view"
import { PlanSvg } from "@/components/trall/plan-svg"
import { ScaleIndicator } from "@/components/trall/svg/scale-indicator"
import type { EdgeConstraint } from "@/lib/trall/edge-model"
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
      className={`relative min-h-[calc(100svh-11rem)] overflow-hidden pt-28 md:min-h-[calc(100svh-7rem)] md:pt-24 2xl:pt-20 ${trallPlanClasses.page}`}
    >
      <div className={`absolute inset-0 ${trallPlanClasses.gridFine}`} />
      <div className={`absolute inset-0 ${trallPlanClasses.gridStrong}`} />
      <div className="absolute top-16 left-0 h-px w-full bg-stone-500/20" />
      <div className="absolute top-0 left-16 h-full w-px bg-stone-500/20" />
      <div className="absolute top-16 left-16 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-stone-700/55" />

      <div className={`absolute top-28 left-4 hidden text-[11px] font-medium md:top-24 sm:block 2xl:top-20 ${trallPlanClasses.floatingLabel}`}>
        x 0, y 0
      </div>

      <p className={`absolute top-28 right-4 z-10 max-w-[min(24rem,calc(100%-2rem))] md:top-24 2xl:top-20 ${trallPlanClasses.floatingLabel}`}>
        {viewMode === "3d"
          ? "3D preview: orbit, pan, zoom. Edit geometry in Top view."
          : getPlannerInstruction(activeTool, placementMode)}
      </p>

      <div className="relative flex h-[calc(100svh-13.5rem)] min-h-[520px] items-stretch justify-center px-3 py-8 md:h-[calc(100svh-10rem)]">
        <div ref={canvasFrameRef} className="h-full w-full">
          {viewMode === "3d" ? (
            <Plan3DView
              boardDirection={boardDirection}
              deckEdgeConstraints={deckEdgeConstraints}
              deckPoints={deckPoints}
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
          className={`pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between ${trallPlanClasses.bottomLegend}`}
        >
          <ScaleIndicator />
          <span>
            Scale 1:100 · 1 grid square = 0.5 m · Cmd/Ctrl snaps angle · Alt
            disables grid · Shift locks axis · Space pans · Zoom {zoomPercent}% ·
            Drag pool body to move it · Click a dimension to edit length ·
            Double-click an edge to add a node · Select an edge to add/remove
            nodes · When edge snaps to house, it becomes attached
          </span>
        </div>
      ) : null}
    </div>
  )
}

function getPlannerInstruction(
  activeTool: ActiveTool,
  placementMode: FeaturePlacementType | null
) {
  if (placementMode === "stairs") {
    return "Stairs: click a deck edge to place stairs."
  }

  if (placementMode === "railing") {
    return "Railing: click deck edges to toggle railing coverage."
  }

  if (placementMode === "pergola") {
    return "Pergola: click inside the deck to place it."
  }

  if (placementMode === "privacyScreen") {
    return "Privacy screen: click a deck edge to place a screen segment."
  }

  if (placementMode === "boardDirection") {
    return "Board direction: use the calculator panel controls to rotate the deck boards."
  }

  if (activeTool === "select") {
    return "Select mode: drag highlighted points to adjust the deck shape. Double-click an edge to add a node."
  }

  return "Drag points to adjust deck shape. Double-click an edge to add a node."
}
