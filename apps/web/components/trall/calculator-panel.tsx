"use client"

import type { Dispatch, SetStateAction } from "react"
import { useCallback, useState } from "react"
import { Trash2Icon } from "lucide-react"

import { BoardDirectionControl } from "@/components/trall/features/board-direction-control"
import { FeatureSettingsCard } from "@/components/trall/features/feature-settings-card"
import { MaterialsManager } from "@/components/trall/materials-manager"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  normalizeElevationSettings,
  type ElevationSettings,
} from "@/lib/trall/elevation"
import type {
  HouseDoor,
  HouseModel,
  HouseRoofStyle,
  HouseWindow,
  Material,
  Metric,
} from "@/lib/trall/types"
import { clamp } from "@/lib/trall/geometry"
import type {
  BoardDirectionSettings,
  DeckFeature,
  FeaturePlacementType,
} from "@/lib/trall/features"
import { formatCurrency } from "@/lib/trall/format"
import {
  MAX_HOUSE_DOOR_HEIGHT_CM,
  MAX_HOUSE_DOOR_WIDTH_CM,
  MAX_HOUSE_WINDOW_HEIGHT_CM,
  MAX_HOUSE_WINDOW_WIDTH_CM,
  MIN_HOUSE_DOOR_HEIGHT_CM,
  MIN_HOUSE_DOOR_WIDTH_CM,
  MIN_HOUSE_WINDOW_HEIGHT_CM,
  MIN_HOUSE_WINDOW_WIDTH_CM,
  createDefaultHouseDoor,
  createDefaultHouseWindow,
  getHouseDoors,
  getHouseRoofStyle,
  getHouseWindows,
  houseRoofStyleOptions,
} from "@/lib/trall/house"
import {
  emptyMaterialTotals,
  type ProjectMaterialSummary,
} from "@/lib/trall/materials"
import type { SupportLayout } from "@/lib/trall/supports"
import {
  deckMaterialOptions,
  houseWallMaterialOptions,
  poolWallMaterialOptions,
  roofMaterialOptions,
  terrainMaterialOptions,
  type AppearanceSettings,
} from "@/lib/trall/appearance"

export function CalculatorPanel({
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

  return (
    <div className="space-y-3">
      <FeatureSettingsCard
        feature={selectedFeature}
        onDelete={onDeleteFeature}
        onUpdate={onUpdateFeature}
      />

      {!selectedFeature || placementMode === "boardDirection" ? (
        <BoardDirectionControl
          boardDirection={boardDirection}
          onChange={setBoardDirection}
        />
      ) : null}

      <Card size="sm" className="bg-zinc-950 text-white dark:bg-primary">
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-white/70">Estimated material price</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              {hasProjectMaterials
                ? formatCurrency(projectMaterialSummary.totalCost)
                : "No materials"}
            </p>
            <p className="mt-1 text-xs text-white/60">
              {hasProjectMaterials
                ? "Calculated from materials assigned to this project"
                : "Add project materials before creating a quote"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Measurements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {calculations.metrics.map((metric) => (
            <MetricRow key={metric.label} {...metric} />
          ))}
        </CardContent>
      </Card>

      <MaterialsManager
        deckAreaM2={calculations.areaM2}
        ensureProject={ensureProject}
        onSummaryChange={handleProjectMaterialSummaryChange}
        projectId={projectId}
        supportLayout={calculations.supportLayout}
      />

      <ElevationSettingsCard
        elevationSettings={elevationSettings}
        setElevationSettings={setElevationSettings}
      />

      <AppearanceSettingsCard
        elevationSettings={elevationSettings}
        setElevationSettings={setElevationSettings}
      />

      <HouseDimensionsCard house={house} setHouse={setHouse} />

      <Card size="sm">
        <CardHeader>
          <CardTitle>Project summary</CardTitle>
          <CardDescription>{projectName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <MetricRow label="House template" value="Single family house" />
          <MetricRow label="Deck type" value="Attached angled edge" />
          <MetricRow label="Last saved" value="Mock draft · 2 min ago" />
        </CardContent>
      </Card>
    </div>
  )
}

function MetricRow({ label, value }: Metric) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/25 px-3 py-2">
      <span className="min-w-0 truncate text-sm text-muted-foreground">
        {label}
      </span>
      <span className="shrink-0 text-sm font-semibold">{value}</span>
    </div>
  )
}

function AppearanceSettingsCard({
  elevationSettings,
  setElevationSettings,
}: {
  elevationSettings: ElevationSettings
  setElevationSettings: Dispatch<SetStateAction<ElevationSettings>>
}) {
  const normalizedElevationSettings =
    normalizeElevationSettings(elevationSettings)
  const appearance = normalizedElevationSettings.appearance

  function updateAppearance<Key extends keyof AppearanceSettings>(
    key: Key,
    value: AppearanceSettings[Key]
  ) {
    setElevationSettings((current) => {
      const normalized = normalizeElevationSettings(current)

      return {
        ...normalized,
        appearance: {
          ...normalized.appearance,
          [key]: value,
        },
      }
    })
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>3D appearance</CardTitle>
        <CardDescription>
          Visual presets only. Geometry and quantities stay unchanged.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-1.5">
          <span className="text-xs text-muted-foreground">Render mode</span>
          <div className="grid grid-cols-2 rounded-lg border bg-muted/25 p-1">
            <Button
              size="sm"
              type="button"
              variant={
                appearance.renderMode === "construction" ? "secondary" : "ghost"
              }
              onClick={() => updateAppearance("renderMode", "construction")}
            >
              Construction
            </Button>
            <Button
              size="sm"
              type="button"
              variant={
                appearance.renderMode === "realistic" ? "secondary" : "ghost"
              }
              onClick={() => updateAppearance("renderMode", "realistic")}
            >
              Realistic
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <AppearanceSelect
            label="Deck"
            options={deckMaterialOptions}
            value={appearance.deckMaterial}
            onChange={(value) => updateAppearance("deckMaterial", value)}
          />
          <AppearanceSelect
            label="House wall"
            options={houseWallMaterialOptions}
            value={appearance.houseWallMaterial}
            onChange={(value) => updateAppearance("houseWallMaterial", value)}
          />
          <AppearanceSelect
            label="Roof"
            options={roofMaterialOptions}
            value={appearance.roofMaterial}
            onChange={(value) => updateAppearance("roofMaterial", value)}
          />
          <AppearanceSelect
            label="Pool wall"
            options={poolWallMaterialOptions}
            value={appearance.poolWallMaterial}
            onChange={(value) => updateAppearance("poolWallMaterial", value)}
          />
          <AppearanceSelect
            label="Ground"
            options={terrainMaterialOptions}
            value={appearance.terrainMaterial}
            onChange={(value) => updateAppearance("terrainMaterial", value)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function AppearanceSelect<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: T) => void
  options: ReadonlyArray<{ value: T; label: string }>
  value: T
}) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Select
        value={value}
        onValueChange={(nextValue) => onChange(nextValue as T)}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function ElevationSettingsCard({
  elevationSettings,
  setElevationSettings,
}: {
  elevationSettings: ElevationSettings
  setElevationSettings: Dispatch<SetStateAction<ElevationSettings>>
}) {
  const normalizedElevationSettings =
    normalizeElevationSettings(elevationSettings)

  function updateNumber(path: ElevationNumberPath, value: string) {
    const numericValue = Number.parseFloat(value)
    if (!Number.isFinite(numericValue)) {
      return
    }

    setElevationSettings((current) =>
      setElevationNumber(current, path, numericValue)
    )
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Levels & terrain</CardTitle>
        <CardDescription>
          House threshold = 0 cm. Model sloped plots while the deck stays level.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-1.5">
          <span className="text-xs text-muted-foreground">Terrain mode</span>
          <Select
            value={normalizedElevationSettings.terrain.mode}
            onValueChange={(value) =>
              setElevationSettings((current) => {
                const normalized = normalizeElevationSettings(current)

                return {
                  ...normalized,
                  terrain: {
                    ...normalized.terrain,
                    mode: value === "flat" ? "flat" : "single_slope",
                  },
                }
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flat">Flat</SelectItem>
              <SelectItem value="single_slope">Single slope</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <CentimeterInput
            label="Deck height"
            value={normalizedElevationSettings.deck.finishedHeightCm}
            onChange={(value) => updateNumber("deck.finishedHeightCm", value)}
          />
          <CentimeterInput
            label="Deck thickness"
            min={8}
            value={normalizedElevationSettings.deck.thicknessCm}
            onChange={(value) => updateNumber("deck.thicknessCm", value)}
          />
          <CentimeterInput
            label="Pool top"
            value={normalizedElevationSettings.pool.topHeightCm}
            onChange={(value) => updateNumber("pool.topHeightCm", value)}
          />
          <CentimeterInput
            label="Pool body"
            min={20}
            value={normalizedElevationSettings.pool.bodyHeightCm}
            onChange={(value) => updateNumber("pool.bodyHeightCm", value)}
          />
          <CentimeterInput
            label="Ground house"
            value={normalizedElevationSettings.terrain.heightAtHouseCm}
            onChange={(value) => updateNumber("terrain.heightAtHouseCm", value)}
          />
          <CentimeterInput
            label="Ground front"
            value={normalizedElevationSettings.terrain.heightAtFarEdgeCm}
            onChange={(value) =>
              updateNumber("terrain.heightAtFarEdgeCm", value)
            }
          />
          <NumberInput
            label="Slope direction"
            suffix="deg"
            value={normalizedElevationSettings.terrain.slopeDirectionDeg}
            onChange={(value) =>
              updateNumber("terrain.slopeDirectionDeg", value)
            }
          />
          <NumberInput
            label="Post spacing"
            min={0.8}
            step={0.1}
            suffix="m"
            value={normalizedElevationSettings.supports.maxPostSpacingM}
            onChange={(value) =>
              updateNumber("supports.maxPostSpacingM", value)
            }
          />
        </div>
        <label className="flex items-center gap-2 rounded-lg border bg-muted/25 px-3 py-2 text-sm">
          <Checkbox
            checked={normalizedElevationSettings.supports.showPosts}
            onCheckedChange={(checked) =>
              setElevationSettings((current) => {
                const normalized = normalizeElevationSettings(current)

                return {
                  ...normalized,
                  supports: {
                    ...normalized.supports,
                    showPosts: checked === true,
                  },
                }
              })
            }
          />
          Show deck support posts
        </label>
        <div className="grid gap-2">
          <label className="flex items-center gap-2 rounded-lg border bg-muted/25 px-3 py-2 text-sm">
            <Checkbox
              checked={
                normalizedElevationSettings.visualization.showHeightMarkers
              }
              onCheckedChange={(checked) =>
                setElevationSettings((current) => ({
                  ...normalizeElevationSettings(current),
                  visualization: {
                    ...normalizeElevationSettings(current).visualization,
                    showHeightMarkers: checked === true,
                  },
                }))
              }
            />
            Show 3D height markers
          </label>
          <label className="flex items-center gap-2 rounded-lg border bg-muted/25 px-3 py-2 text-sm">
            <Checkbox
              checked={
                normalizedElevationSettings.visualization.showPoolExcavation
              }
              onCheckedChange={(checked) =>
                setElevationSettings((current) => ({
                  ...normalizeElevationSettings(current),
                  visualization: {
                    ...normalizeElevationSettings(current).visualization,
                    showPoolExcavation: checked === true,
                  },
                }))
              }
            />
            Show pool excavation cut
          </label>
        </div>
      </CardContent>
    </Card>
  )
}

type ElevationNumberPath =
  | "deck.finishedHeightCm"
  | "deck.thicknessCm"
  | "pool.topHeightCm"
  | "pool.bodyHeightCm"
  | "terrain.heightAtHouseCm"
  | "terrain.heightAtFarEdgeCm"
  | "terrain.slopeDirectionDeg"
  | "supports.maxPostSpacingM"

function setElevationNumber(
  current: ElevationSettings,
  path: ElevationNumberPath,
  value: number
): ElevationSettings {
  const normalized = normalizeElevationSettings(current)

  if (path === "deck.finishedHeightCm") {
    return {
      ...normalized,
      deck: { ...normalized.deck, finishedHeightCm: value },
    }
  }
  if (path === "deck.thicknessCm") {
    return { ...normalized, deck: { ...normalized.deck, thicknessCm: value } }
  }
  if (path === "pool.topHeightCm") {
    return { ...normalized, pool: { ...normalized.pool, topHeightCm: value } }
  }
  if (path === "pool.bodyHeightCm") {
    return { ...normalized, pool: { ...normalized.pool, bodyHeightCm: value } }
  }
  if (path === "terrain.heightAtHouseCm") {
    return {
      ...normalized,
      terrain: { ...normalized.terrain, heightAtHouseCm: value },
    }
  }
  if (path === "terrain.heightAtFarEdgeCm") {
    return {
      ...normalized,
      terrain: { ...normalized.terrain, heightAtFarEdgeCm: value },
    }
  }
  if (path === "terrain.slopeDirectionDeg") {
    return {
      ...normalized,
      terrain: { ...normalized.terrain, slopeDirectionDeg: value },
    }
  }

  return {
    ...normalized,
    supports: { ...normalized.supports, maxPostSpacingM: value },
  }
}

function CentimeterInput({
  label,
  min,
  onChange,
  value,
}: {
  label: string
  min?: number
  onChange: (value: string) => void
  value: number
}) {
  return (
    <NumberInput
      label={label}
      min={min}
      suffix="cm"
      value={value}
      onChange={onChange}
    />
  )
}

function NumberInput({
  label,
  min,
  onChange,
  step = 1,
  suffix,
  value,
}: {
  label: string
  min?: number
  onChange: (value: string) => void
  step?: number
  suffix: string
  value: number
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1 rounded-lg border bg-background px-2">
        <Input
          className="border-0 px-0 shadow-none focus-visible:ring-0"
          inputMode="decimal"
          min={min}
          step={step}
          type="number"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="shrink-0 text-xs text-muted-foreground">{suffix}</span>
      </div>
    </label>
  )
}

function HouseDimensionsCard({
  house,
  setHouse,
}: {
  house: HouseModel
  setHouse: Dispatch<SetStateAction<HouseModel>>
}) {
  function updateHouseDimension(key: "widthM" | "depthM", value: string) {
    const numericValue = Number.parseFloat(value)
    if (!Number.isFinite(numericValue)) {
      return
    }

    const bounds = key === "widthM" ? { min: 2, max: 30 } : { min: 2, max: 20 }

    setHouse((current) => ({
      ...current,
      [key]: clamp(numericValue, bounds.min, bounds.max),
    }))
  }
  const doors = getHouseDoors(house)
  const roofStyle = getHouseRoofStyle(house)
  const windows = getHouseWindows(house)
  const openingWidthM =
    doors.reduce((total, door) => total + (door.widthCm ?? 90) / 100, 0) +
    windows.reduce((total, window) => total + (window.widthCm ?? 120) / 100, 0)

  function updateRoofStyle(value: HouseRoofStyle) {
    setHouse((current) => ({
      ...current,
      roofStyle: value,
    }))
  }

  function addDoor() {
    setHouse((current) => {
      const currentDoors = getHouseDoors(current)
      const nextIndex = currentDoors.length + 1
      const offsetStepM = Math.min(1.2, current.widthM / 6)
      const rawOffsetM = (nextIndex % 2 === 0 ? 1 : -1) * offsetStepM
      const maxOffsetM = Math.max(0, current.widthM / 2 - 0.45)

      return {
        ...current,
        doors: [
          ...currentDoors,
          createDefaultHouseDoor(
            `door-${Date.now()}`,
            clamp(rawOffsetM, -maxOffsetM, maxOffsetM)
          ),
        ],
      }
    })
  }

  function updateDoor(doorId: string, updater: (door: HouseDoor) => HouseDoor) {
    setHouse((current) => ({
      ...current,
      doors: getHouseDoors(current).map((door) =>
        door.id === doorId ? updater(door) : door
      ),
    }))
  }

  function updateDoorDimension(
    doorId: string,
    key: "widthCm" | "heightCm",
    value: string
  ) {
    const numericValue = Number.parseFloat(value)
    if (!Number.isFinite(numericValue)) {
      return
    }

    const bounds =
      key === "widthCm"
        ? { min: MIN_HOUSE_DOOR_WIDTH_CM, max: MAX_HOUSE_DOOR_WIDTH_CM }
        : { min: MIN_HOUSE_DOOR_HEIGHT_CM, max: MAX_HOUSE_DOOR_HEIGHT_CM }

    updateDoor(doorId, (door) => ({
      ...door,
      [key]: clamp(numericValue, bounds.min, bounds.max),
    }))
  }

  function addWindow() {
    setHouse((current) => {
      const currentWindows = getHouseWindows(current)
      const nextIndex = currentWindows.length + 1
      const offsetStepM = Math.min(1.2, current.widthM / 6)
      const rawOffsetM = (nextIndex % 2 === 0 ? 1 : -1) * offsetStepM
      const maxOffsetM = Math.max(0, current.widthM / 2 - 0.9)

      return {
        ...current,
        windows: [
          ...currentWindows,
          createDefaultHouseWindow(
            `window-${Date.now()}`,
            clamp(rawOffsetM, -maxOffsetM, maxOffsetM),
            nextIndex % 2 === 0 ? "upper" : "lower"
          ),
        ],
      }
    })
  }

  function updateWindow(
    windowId: string,
    updater: (window: HouseWindow) => HouseWindow
  ) {
    setHouse((current) => ({
      ...current,
      windows: getHouseWindows(current).map((window) =>
        window.id === windowId ? updater(window) : window
      ),
    }))
  }

  function updateWindowDimension(
    windowId: string,
    key: "widthCm" | "heightCm",
    value: string
  ) {
    const numericValue = Number.parseFloat(value)
    if (!Number.isFinite(numericValue)) {
      return
    }

    const bounds =
      key === "widthCm"
        ? { min: MIN_HOUSE_WINDOW_WIDTH_CM, max: MAX_HOUSE_WINDOW_WIDTH_CM }
        : { min: MIN_HOUSE_WINDOW_HEIGHT_CM, max: MAX_HOUSE_WINDOW_HEIGHT_CM }

    updateWindow(windowId, (window) => ({
      ...window,
      [key]: clamp(numericValue, bounds.min, bounds.max),
    }))
  }

  function updateWindowRow(windowId: string, row: HouseWindow["row"]) {
    updateWindow(windowId, (window) => ({ ...window, row }))
  }

  function removeWindow(windowId: string) {
    setHouse((current) => ({
      ...current,
      windows: getHouseWindows(current).filter(
        (window) => window.id !== windowId
      ),
    }))
  }

  function removeDoor(doorId: string) {
    setHouse((current) => ({
      ...current,
      doors: getHouseDoors(current).filter((door) => door.id !== doorId),
    }))
  }

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
                <div
                  key={door.id}
                  className="grid gap-2 rounded-md bg-background p-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-xs">
                      Door {index + 1}
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
                  </div>
                  <div className="grid grid-cols-2 gap-2">
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
                </div>
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
                <div
                  key={window.id}
                  className="grid gap-2 rounded-md bg-background p-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-xs">
                      Window {index + 1}
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
                  </div>
                  <div className="grid grid-cols-3 gap-2">
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
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
