import type { Dispatch, SetStateAction } from "react"

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
  deckMaterialOptions,
  houseWallColorPresets,
  houseWallMaterialOptions,
  poolWallMaterialOptions,
  roofMaterialOptions,
  terrainMaterialOptions,
} from "@/lib/trall/appearance"
import type { ElevationSettings } from "@/lib/trall/elevation"

import { useAppearanceSettingsForm } from "../hooks/use-appearance-settings-form"

export function AppearanceSettingsCard({
  elevationSettings,
  setElevationSettings,
}: {
  elevationSettings: ElevationSettings
  setElevationSettings: Dispatch<SetStateAction<ElevationSettings>>
}) {
  const { appearance, updateAppearance, updateHouseWallMaterial } =
    useAppearanceSettingsForm({ elevationSettings, setElevationSettings })

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
            onChange={updateHouseWallMaterial}
          />
          <HouseColorControl
            value={appearance.houseWallColor}
            onChange={(value) => updateAppearance("houseWallColor", value)}
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

function HouseColorControl({
  onChange,
  value,
}: {
  onChange: (value: string) => void
  value: string
}) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs text-muted-foreground">House color</span>
      <div className="flex items-center gap-2">
        <Input
          aria-label="House color"
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border p-1"
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <Input
          className="h-10 min-w-0 text-xs"
          inputMode="text"
          value={value}
          onChange={(event) => {
            if (/^#[0-9a-fA-F]{6}$/.test(event.target.value)) {
              onChange(event.target.value)
            }
          }}
        />
      </div>
      <div className="grid grid-cols-6 gap-1">
        {houseWallColorPresets.map((preset) => (
          <button
            key={preset.value}
            aria-label={preset.label}
            className="h-6 rounded-md border shadow-sm"
            style={{ backgroundColor: preset.value }}
            title={preset.label}
            type="button"
            onClick={() => onChange(preset.value)}
          />
        ))}
      </div>
    </div>
  )
}
