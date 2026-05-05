"use client"

import { RotateCwIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import {
  rotateBoardDirection,
  setBoardDirectionMode,
  setCustomBoardDirection,
  type BoardDirectionSettings,
} from "@/lib/trall/features"

export function BoardDirectionControl({
  boardDirection,
  onChange,
}: {
  boardDirection: BoardDirectionSettings
  onChange: (settings: BoardDirectionSettings) => void
}) {
  return (
    <Card size="sm" className="border-stone-200 shadow-none">
      <CardHeader className="space-y-1.5 pb-3">
        <CardTitle>Brädriktning</CardTitle>
        <CardDescription>
          Styr den synliga riktningen på trallbrädorna i planen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-1 rounded-lg border bg-muted/20 p-1">
          <ModeButton
            active={boardDirection.boardDirectionMode === "parallel-house"}
            label="Parallell"
            onClick={() =>
              onChange(setBoardDirectionMode("parallel-house", boardDirection))
            }
          />
          <ModeButton
            active={
              boardDirection.boardDirectionMode === "perpendicular-house"
            }
            label="Vinkelrät"
            onClick={() =>
              onChange(
                setBoardDirectionMode("perpendicular-house", boardDirection)
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
            <RotateCwIcon />
            Återställ
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <Button
      aria-pressed={active}
      className="h-8 px-2"
      size="sm"
      variant={active ? "secondary" : "ghost"}
      onClick={onClick}
    >
      {label}
    </Button>
  )
}
