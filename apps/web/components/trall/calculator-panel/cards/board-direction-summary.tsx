"use client"

import { useState } from "react"
import { SlidersHorizontalIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import {
  rotateBoardDirection,
  setBoardDirectionMode,
  setCustomBoardDirection,
  type BoardDirectionSettings,
} from "@/lib/trall/features"

import { ModeButton } from "../controls/mode-button"

export function BoardDirectionSummary({
  boardDirection,
  onChange,
}: {
  boardDirection: BoardDirectionSettings
  onChange: (settings: BoardDirectionSettings) => void
}) {
  const [open, setOpen] = useState(false)
  const modeLabel =
    boardDirection.boardDirectionMode === "custom"
      ? "Anpassad"
      : boardDirection.boardDirectionMode === "perpendicular-house"
        ? "Vinkelrät"
        : "Parallell"

  return (
    <Card size="sm" className="border-stone-200 shadow-none">
      <div>
        <button
          className="flex w-full cursor-pointer items-start justify-between gap-3 p-4 text-left"
          type="button"
          onClick={() => setOpen((current) => !current)}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <SlidersHorizontalIcon className="size-4" />
              <CardTitle>Brädriktning</CardTitle>
            </div>
            <CardDescription className="mt-1">
              {modeLabel} · {Math.round(boardDirection.boardDirectionDeg)}°
            </CardDescription>
          </div>
          <span className="shrink-0 text-xs font-medium text-stone-500">
            {open ? "Stäng" : "Redigera"}
          </span>
        </button>
        {open ? (
          <CardContent className="space-y-3 border-t pt-3">
            <div className="grid grid-cols-3 gap-1 rounded-lg border bg-muted/20 p-1">
              <ModeButton
                active={boardDirection.boardDirectionMode === "parallel-house"}
                label="Parallell"
                onClick={() =>
                  onChange(
                    setBoardDirectionMode("parallel-house", boardDirection)
                  )
                }
              />
              <ModeButton
                active={
                  boardDirection.boardDirectionMode === "perpendicular-house"
                }
                label="Vinkelrät"
                onClick={() =>
                  onChange(
                    setBoardDirectionMode(
                      "perpendicular-house",
                      boardDirection
                    )
                  )
                }
              />
              <ModeButton
                active={boardDirection.boardDirectionMode === "custom"}
                label="Anpassad"
                onClick={() =>
                  onChange(setBoardDirectionMode("custom", boardDirection))
                }
              />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Vinkel</span>
                <div className="flex items-center gap-1 rounded-lg border bg-background px-2">
                  <Input
                    className="border-0 px-0 shadow-none focus-visible:ring-0"
                    inputMode="decimal"
                    max={359}
                    min={0}
                    step={1}
                    type="number"
                    value={Math.round(boardDirection.boardDirectionDeg)}
                    onChange={(event) =>
                      onChange(
                        setCustomBoardDirection(
                          boardDirection,
                          Number.parseFloat(event.target.value)
                        )
                      )
                    }
                  />
                  <span className="text-xs text-muted-foreground">°</span>
                </div>
              </label>
              <Button
                className="mt-5 h-10"
                size="lg"
                variant="outline"
                onClick={() => onChange(rotateBoardDirection(boardDirection))}
              >
                Återställ
              </Button>
            </div>
          </CardContent>
        ) : null}
      </div>
    </Card>
  )
}
