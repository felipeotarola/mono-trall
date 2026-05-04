"use client"

import type { Dispatch, SetStateAction } from "react"
import { ClipboardListIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import { CalculatorPanel } from "@/components/trall/calculator-panel"
import type {
  BoardDirectionSettings,
  DeckFeature,
  FeaturePlacementType,
} from "@/lib/trall/features"
import type { ElevationSettings } from "@/lib/trall/elevation"
import type { HouseModel, Material, Metric } from "@/lib/trall/types"
import type { SupportLayout } from "@/lib/trall/supports"

export function MobileSummary({
  boardDirection,
  calculations,
  elevationSettings,
  ensureProject,
  house,
  placementMode,
  projectId,
  projectName,
  selectedFeature,
  setBoardDirection,
  setElevationSettings,
  setHouse,
  onDeleteFeature,
  onUpdateFeature,
}: {
  boardDirection: BoardDirectionSettings
  calculations: {
    areaM2: number
    boardRunLm: number
    priceLabel: string
    supportLayout: SupportLayout
    metrics: Metric[]
    materials: Material[]
  }
  elevationSettings: ElevationSettings
  ensureProject: () => Promise<string>
  house: HouseModel
  placementMode: FeaturePlacementType | null
  projectId: string | null
  projectName: string
  selectedFeature: DeckFeature | null
  setBoardDirection: (settings: BoardDirectionSettings) => void
  setElevationSettings: Dispatch<SetStateAction<ElevationSettings>>
  setHouse: Dispatch<SetStateAction<HouseModel>>
  onDeleteFeature: (featureId: string) => void
  onUpdateFeature: (feature: DeckFeature) => void
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
              <CalculatorPanel
                calculations={calculations}
                boardDirection={boardDirection}
                elevationSettings={elevationSettings}
                ensureProject={ensureProject}
                placementMode={placementMode}
                selectedFeature={selectedFeature}
                house={house}
                projectId={projectId}
                projectName={projectName}
                setBoardDirection={setBoardDirection}
                setElevationSettings={setElevationSettings}
                setHouse={setHouse}
                onDeleteFeature={onDeleteFeature}
                onUpdateFeature={onUpdateFeature}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
