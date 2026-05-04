"use client"

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
import { clamp } from "@/lib/trall/geometry"
import type {
  DeckFeature,
  PergolaFeature,
  PrivacyScreenFeature,
  RailingFeature,
  StairFeature,
} from "@/lib/trall/features"

export function FeatureSettingsCard({
  feature,
  onDelete,
  onUpdate,
}: {
  feature: DeckFeature | null
  onDelete: (featureId: string) => void
  onUpdate: (feature: DeckFeature) => void
}) {
  if (!feature) {
    return null
  }

  return (
    <Card size="sm" className="border-stone-300">
      <CardHeader>
        <CardTitle>Feature settings</CardTitle>
        <CardDescription>{getFeatureDescription(feature)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <FeatureNameInput feature={feature} onUpdate={onUpdate} />
        {feature.type === "stairs" ? (
          <StairSettings feature={feature} onUpdate={onUpdate} />
        ) : null}
        {feature.type === "railing" ? (
          <RailingSettings feature={feature} onUpdate={onUpdate} />
        ) : null}
        {feature.type === "pergola" ? (
          <PergolaSettings feature={feature} onUpdate={onUpdate} />
        ) : null}
        {feature.type === "privacyScreen" ? (
          <PrivacyScreenSettings feature={feature} onUpdate={onUpdate} />
        ) : null}
        <Button
          className="w-full justify-center"
          size="sm"
          variant="destructive"
          onClick={() => onDelete(feature.id)}
        >
          <Trash2Icon />
          Delete {feature.label}
        </Button>
      </CardContent>
    </Card>
  )
}

function FeatureNameInput({
  feature,
  onUpdate,
}: {
  feature: DeckFeature
  onUpdate: (feature: DeckFeature) => void
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs text-muted-foreground">Label</span>
      <Input
        value={feature.label}
        onChange={(event) =>
          onUpdate({ ...feature, label: event.target.value } as DeckFeature)
        }
      />
    </label>
  )
}

function StairSettings({
  feature,
  onUpdate,
}: {
  feature: StairFeature
  onUpdate: (feature: DeckFeature) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <NumberField
        label="Width"
        max={5}
        min={0.6}
        step={0.1}
        unit="m"
        value={feature.widthM}
        onChange={(value) =>
          onUpdate({ ...feature, widthM: clamp(value, 0.6, 5) })
        }
      />
      <NumberField
        label="Total run"
        max={5}
        min={0.5}
        step={0.1}
        unit="m"
        value={feature.depthM}
        onChange={(value) =>
          onUpdate({ ...feature, depthM: clamp(value, 0.5, 5) })
        }
      />
      <NumberField
        label="Steps"
        max={16}
        min={1}
        step={1}
        unit=""
        value={feature.stepCount}
        onChange={(value) =>
          onUpdate({ ...feature, stepCount: Math.round(clamp(value, 1, 16)) })
        }
      />
      <SelectField
        label="Direction"
        options={[
          { label: "Outward", value: "outward" },
          { label: "Inward", value: "inward" },
        ]}
        value={feature.direction}
        onChange={(value) =>
          onUpdate({
            ...feature,
            direction: value === "inward" ? "inward" : "outward",
          })
        }
      />
      <p className="col-span-2 text-[11px] leading-snug text-muted-foreground">
        Tread depth:{" "}
        {(feature.depthM / Math.max(1, feature.stepCount)).toFixed(2)} m. 3D
        stair height follows terrain and deck level.
      </p>
    </div>
  )
}

function RailingSettings({
  feature,
  onUpdate,
}: {
  feature: RailingFeature
  onUpdate: (feature: DeckFeature) => void
}) {
  return (
    <div className="grid gap-2">
      <div className="rounded-lg border bg-muted/25 px-3 py-2 text-sm">
        {feature.edgeIds.length} selected edge
        {feature.edgeIds.length === 1 ? "" : "s"}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="Height"
          max={140}
          min={80}
          step={5}
          unit="cm"
          value={feature.heightCm}
          onChange={(value) =>
            onUpdate({
              ...feature,
              heightCm: Math.round(clamp(value, 80, 140)),
            })
          }
        />
        <SelectField
          label="Style"
          options={[
            { label: "Wood", value: "wood" },
            { label: "Glass", value: "glass" },
            { label: "Metal", value: "metal" },
          ]}
          value={feature.style}
          onChange={(value) =>
            onUpdate({
              ...feature,
              style: value === "glass" || value === "metal" ? value : "wood",
            })
          }
        />
      </div>
    </div>
  )
}

function PergolaSettings({
  feature,
  onUpdate,
}: {
  feature: PergolaFeature
  onUpdate: (feature: DeckFeature) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <NumberField
        label="Width"
        max={8}
        min={1}
        step={0.1}
        unit="m"
        value={feature.widthM}
        onChange={(value) =>
          onUpdate({ ...feature, widthM: clamp(value, 1, 8) })
        }
      />
      <NumberField
        label="Depth"
        max={8}
        min={1}
        step={0.1}
        unit="m"
        value={feature.depthM}
        onChange={(value) =>
          onUpdate({ ...feature, depthM: clamp(value, 1, 8) })
        }
      />
      <NumberField
        label="Rotation"
        max={359}
        min={0}
        step={1}
        unit="deg"
        value={Math.round(feature.rotationDeg)}
        onChange={(value) =>
          onUpdate({ ...feature, rotationDeg: clamp(value, 0, 359) })
        }
      />
      <NumberField
        label="Posts"
        max={12}
        min={4}
        step={1}
        unit=""
        value={feature.postCount}
        onChange={(value) =>
          onUpdate({ ...feature, postCount: Math.round(clamp(value, 4, 12)) })
        }
      />
    </div>
  )
}

function PrivacyScreenSettings({
  feature,
  onUpdate,
}: {
  feature: PrivacyScreenFeature
  onUpdate: (feature: DeckFeature) => void
}) {
  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="Height"
          max={240}
          min={120}
          step={5}
          unit="cm"
          value={feature.heightCm}
          onChange={(value) =>
            onUpdate({
              ...feature,
              heightCm: Math.round(clamp(value, 120, 240)),
            })
          }
        />
        <SelectField
          label="Style"
          options={[
            { label: "Slatted", value: "slatted" },
            { label: "Solid", value: "solid" },
            { label: "Greenery", value: "greenery" },
          ]}
          value={feature.style}
          onChange={(value) =>
            onUpdate({
              ...feature,
              style:
                value === "solid" || value === "greenery" ? value : "slatted",
            })
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="Start"
          max={100}
          min={0}
          step={5}
          unit="%"
          value={Math.round(feature.startT * 100)}
          onChange={(value) => {
            const startT = clamp(value / 100, 0, feature.endT - 0.05)
            onUpdate({ ...feature, startT })
          }}
        />
        <NumberField
          label="End"
          max={100}
          min={0}
          step={5}
          unit="%"
          value={Math.round(feature.endT * 100)}
          onChange={(value) => {
            const endT = clamp(value / 100, feature.startT + 0.05, 1)
            onUpdate({ ...feature, endT })
          }}
        />
      </div>
    </div>
  )
}

function NumberField({
  label,
  max,
  min,
  onChange,
  step,
  unit,
  value,
}: {
  label: string
  max: number
  min: number
  onChange: (value: number) => void
  step: number
  unit: string
  value: number
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1 rounded-lg border bg-background px-2">
        <Input
          className="border-0 px-0 shadow-none focus-visible:ring-0"
          inputMode="decimal"
          max={max}
          min={min}
          step={step}
          type="number"
          value={value}
          onChange={(event) => {
            const numericValue = Number.parseFloat(event.target.value)
            if (Number.isFinite(numericValue)) {
              onChange(numericValue)
            }
          }}
        />
        {unit ? (
          <span className="text-xs text-muted-foreground">{unit}</span>
        ) : null}
      </div>
    </label>
  )
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: string) => void
  options: { label: string; value: string }[]
  value: string
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <select
        className="h-10 w-full rounded-lg border bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function getFeatureDescription(feature: DeckFeature) {
  if (feature.type === "stairs") {
    return "Attached to a deck edge."
  }

  if (feature.type === "railing") {
    return "Toggle edge coverage from the canvas."
  }

  if (feature.type === "pergola") {
    return "Placed as a rectangular deck object."
  }

  return "Attached to a partial deck edge segment."
}
