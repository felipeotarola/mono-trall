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
import type { HouseModel, Material, Metric } from "@/lib/trall/types"

export function MobileSummary({
  calculations,
  ensureProject,
  house,
  projectId,
  setHouse,
}: {
  calculations: {
    areaM2: number
    boardRunLm: number
    priceLabel: string
    metrics: Metric[]
    materials: Material[]
  }
  ensureProject: () => Promise<string>
  house: HouseModel
  projectId: string | null
  setHouse: Dispatch<SetStateAction<HouseModel>>
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
                ensureProject={ensureProject}
                house={house}
                projectId={projectId}
                setHouse={setHouse}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
