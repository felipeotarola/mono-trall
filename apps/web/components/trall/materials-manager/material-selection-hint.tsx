import { Button } from "@workspace/ui/components/button"
import {
  getMaterialDimensionsLabel,
  type MaterialRecord,
} from "@/lib/trall/materials"

export function MaterialSelectionHint({
  boardGapMm,
  material,
  onUseSuggested,
  suggestedLinearMetres,
  suggestedPieces,
}: {
  boardGapMm: number
  material: MaterialRecord
  onUseSuggested: () => void
  suggestedLinearMetres: number | null
  suggestedPieces: number | null
}) {
  const dimensions = getMaterialDimensionsLabel(material)

  if (!dimensions && !suggestedLinearMetres) {
    return null
  }

  return (
    <div className="rounded-lg bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate">
          {dimensions ? `${dimensions}` : "No dimensions"}
          {suggestedLinearMetres
            ? ` · ${boardGapMm} mm gap · suggested ${suggestedLinearMetres} lpm`
            : ""}
          {suggestedPieces ? ` · ${suggestedPieces} boards` : ""}
        </span>
        {suggestedLinearMetres ? (
          <Button size="xs" variant="outline" onClick={onUseSuggested}>
            Use
          </Button>
        ) : null}
      </div>
    </div>
  )
}
