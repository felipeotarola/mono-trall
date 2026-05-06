import type { Dispatch, SetStateAction } from "react"
import { Trash2Icon } from "lucide-react"

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  MAX_HOUSE_DOOR_HEIGHT_CM,
  MAX_HOUSE_DOOR_WIDTH_CM,
  MAX_HOUSE_WINDOW_HEIGHT_CM,
  MAX_HOUSE_WINDOW_WIDTH_CM,
  MIN_HOUSE_DOOR_HEIGHT_CM,
  MIN_HOUSE_DOOR_WIDTH_CM,
  MIN_HOUSE_WINDOW_HEIGHT_CM,
  MIN_HOUSE_WINDOW_WIDTH_CM,
  houseRoofStyleOptions,
} from "@/lib/trall/house"
import type { HouseModel, HouseRoofStyle, HouseWindow } from "@/lib/trall/types"

import { useHouseForm } from "../hooks/use-house-form"

export function HouseDimensionsCard({
  house,
  setHouse,
}: {
  house: HouseModel
  setHouse: Dispatch<SetStateAction<HouseModel>>
}) {
  const {
    addDoor,
    addWindow,
    doors,
    openingWidthM,
    removeDoor,
    removeWindow,
    roofStyle,
    updateDoorDimension,
    updateHouseDimension,
    updateRoofStyle,
    updateWindowDimension,
    updateWindowRow,
    windows,
  } = useHouseForm({ house, setHouse })

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>House dimensions</CardTitle>
        <CardDescription>
          Set house size first, then snap deck points to the wall.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Width</span>
          <div className="flex items-center gap-1 rounded-lg border bg-background px-2">
            <Input
              className="border-0 px-0 shadow-none focus-visible:ring-0"
              inputMode="decimal"
              max={30}
              min={2}
              step={0.1}
              type="number"
              value={house.widthM}
              onChange={(event) =>
                updateHouseDimension("widthM", event.target.value)
              }
            />
            <span className="text-xs text-muted-foreground">m</span>
          </div>
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Depth</span>
          <div className="flex items-center gap-1 rounded-lg border bg-background px-2">
            <Input
              className="border-0 px-0 shadow-none focus-visible:ring-0"
              inputMode="decimal"
              max={20}
              min={2}
              step={0.1}
              type="number"
              value={house.depthM}
              onChange={(event) =>
                updateHouseDimension("depthM", event.target.value)
              }
            />
            <span className="text-xs text-muted-foreground">m</span>
          </div>
        </label>
        <label className="col-span-2 space-y-1">
          <span className="text-xs text-muted-foreground">Roof type</span>
          <Select
            value={roofStyle}
            onValueChange={(value) => updateRoofStyle(value as HouseRoofStyle)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {houseRoofStyleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <div className="col-span-2 grid gap-2 rounded-lg border bg-muted/25 p-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Doors: {doors.length}
            </span>
            <Button size="sm" variant="outline" onClick={addDoor}>
              Add door
            </Button>
          </div>
          <p className="text-[11px] leading-snug text-muted-foreground">
            House width: {house.widthM.toFixed(1)} m · openings:{" "}
            {openingWidthM.toFixed(1)} m
          </p>
          {doors.length > 0 ? (
            <div className="grid gap-1">
              {doors.map((door, index) => (
                <details key={door.id} className="rounded-md bg-background">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-2">
                    <span className="min-w-0 truncate text-xs font-medium">
                      Door {index + 1} · {door.widthCm} x {door.heightCm} cm
                    </span>
                    <Button
                      aria-label={`Remove door ${index + 1}`}
                      size="icon-xs"
                      title="Remove door"
                      variant="ghost"
                      onClick={() => removeDoor(door.id)}
                    >
                      <Trash2Icon />
                    </Button>
                  </summary>
                  <div className="grid grid-cols-2 gap-2 border-t p-2">
                    <label className="space-y-1">
                      <span className="text-[11px] text-muted-foreground">
                        Width
                      </span>
                      <div className="flex h-8 items-center gap-1 rounded-lg border bg-background px-2">
                        <Input
                          className="h-7 border-0 px-0 text-xs shadow-none focus-visible:ring-0"
                          inputMode="decimal"
                          max={MAX_HOUSE_DOOR_WIDTH_CM}
                          min={MIN_HOUSE_DOOR_WIDTH_CM}
                          step={5}
                          type="number"
                          value={door.widthCm}
                          onChange={(event) =>
                            updateDoorDimension(
                              door.id,
                              "widthCm",
                              event.target.value
                            )
                          }
                        />
                        <span className="text-[11px] text-muted-foreground">
                          cm
                        </span>
                      </div>
                    </label>
                    <label className="space-y-1">
                      <span className="text-[11px] text-muted-foreground">
                        Height
                      </span>
                      <div className="flex h-8 items-center gap-1 rounded-lg border bg-background px-2">
                        <Input
                          className="h-7 border-0 px-0 text-xs shadow-none focus-visible:ring-0"
                          inputMode="decimal"
                          max={MAX_HOUSE_DOOR_HEIGHT_CM}
                          min={MIN_HOUSE_DOOR_HEIGHT_CM}
                          step={5}
                          type="number"
                          value={door.heightCm}
                          onChange={(event) =>
                            updateDoorDimension(
                              door.id,
                              "heightCm",
                              event.target.value
                            )
                          }
                        />
                        <span className="text-[11px] text-muted-foreground">
                          cm
                        </span>
                      </div>
                    </label>
                  </div>
                </details>
              ))}
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Windows: {windows.length}
            </span>
            <Button size="sm" variant="outline" onClick={addWindow}>
              Add window
            </Button>
          </div>
          {windows.length > 0 ? (
            <div className="grid gap-1">
              {windows.map((window, index) => (
                <details key={window.id} className="rounded-md bg-background">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-2">
                    <span className="min-w-0 truncate text-xs font-medium">
                      Window {index + 1} · {window.row} · {window.widthCm} x{" "}
                      {window.heightCm} cm
                    </span>
                    <Button
                      aria-label={`Remove window ${index + 1}`}
                      size="icon-xs"
                      title="Remove window"
                      variant="ghost"
                      onClick={() => removeWindow(window.id)}
                    >
                      <Trash2Icon />
                    </Button>
                  </summary>
                  <div className="grid grid-cols-3 gap-2 border-t p-2">
                    <label className="space-y-1">
                      <span className="text-[11px] text-muted-foreground">
                        Row
                      </span>
                      <Select
                        value={window.row}
                        onValueChange={(value) =>
                          updateWindowRow(
                            window.id,
                            value as HouseWindow["row"]
                          )
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lower">Lower</SelectItem>
                          <SelectItem value="upper">Upper</SelectItem>
                        </SelectContent>
                      </Select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-[11px] text-muted-foreground">
                        Width
                      </span>
                      <div className="flex h-8 items-center gap-1 rounded-lg border bg-background px-2">
                        <Input
                          className="h-7 border-0 px-0 text-xs shadow-none focus-visible:ring-0"
                          inputMode="decimal"
                          max={MAX_HOUSE_WINDOW_WIDTH_CM}
                          min={MIN_HOUSE_WINDOW_WIDTH_CM}
                          step={5}
                          type="number"
                          value={window.widthCm}
                          onChange={(event) =>
                            updateWindowDimension(
                              window.id,
                              "widthCm",
                              event.target.value
                            )
                          }
                        />
                        <span className="text-[11px] text-muted-foreground">
                          cm
                        </span>
                      </div>
                    </label>
                    <label className="space-y-1">
                      <span className="text-[11px] text-muted-foreground">
                        Height
                      </span>
                      <div className="flex h-8 items-center gap-1 rounded-lg border bg-background px-2">
                        <Input
                          className="h-7 border-0 px-0 text-xs shadow-none focus-visible:ring-0"
                          inputMode="decimal"
                          max={MAX_HOUSE_WINDOW_HEIGHT_CM}
                          min={MIN_HOUSE_WINDOW_HEIGHT_CM}
                          step={5}
                          type="number"
                          value={window.heightCm}
                          onChange={(event) =>
                            updateWindowDimension(
                              window.id,
                              "heightCm",
                              event.target.value
                            )
                          }
                        />
                        <span className="text-[11px] text-muted-foreground">
                          cm
                        </span>
                      </div>
                    </label>
                  </div>
                </details>
              ))}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
