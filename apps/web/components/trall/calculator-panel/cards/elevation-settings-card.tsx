import type { Dispatch, SetStateAction } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import type { ElevationSettings } from "@/lib/trall/elevation"

import {
  CentimeterInput,
  NumberInput,
} from "../controls/number-input"
import { useElevationSettingsForm } from "../hooks/use-elevation-settings-form"

export function ElevationSettingsCard({
  elevationSettings,
  setElevationSettings,
}: {
  elevationSettings: ElevationSettings
  setElevationSettings: Dispatch<SetStateAction<ElevationSettings>>
}) {
  const {
    normalizedElevationSettings,
    updateNumber,
    updateShowHeightMarkers,
    updateShowPoolExcavation,
    updateShowPosts,
    updateTerrainMode,
  } = useElevationSettingsForm({ elevationSettings, setElevationSettings })

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
            onValueChange={updateTerrainMode}
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
            onCheckedChange={(checked) => updateShowPosts(checked === true)}
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
                updateShowHeightMarkers(checked === true)
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
                updateShowPoolExcavation(checked === true)
              }
            />
            Show pool excavation cut
          </label>
        </div>
      </CardContent>
    </Card>
  )
}
