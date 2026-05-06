import { Loader2Icon, Maximize2Icon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import type { AIVisualizationRecord } from "@/lib/trall/ai-visualization"

import { getStyleLabel } from "../utils"

export function SavedVisualization({
  expandingSourceUrl,
  onExpand,
  onOpen,
  visualization,
}: {
  expandingSourceUrl: string | null
  onExpand: () => void
  onOpen: () => void
  visualization: AIVisualizationRecord
}) {
  const generatedImage = visualization.generated_images[0]

  if (!generatedImage) {
    return null
  }

  return (
    <div className="overflow-hidden rounded-md border bg-background">
      <button
        type="button"
        className="block w-full cursor-zoom-in text-left"
        onClick={onOpen}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Blob URLs are persisted user-generated images. */}
        <img
          src={generatedImage.url}
          alt="Generated property visualization"
          className="aspect-video w-full object-cover"
        />
      </button>
      <div className="space-y-1 px-3 py-2">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="truncate font-medium">
            {generatedImage.kind === "expanded"
              ? "Expanded image"
              : getStyleLabel(visualization.style)}
          </span>
          <span className="shrink-0 text-muted-foreground">
            {visualization.reference_images.length} ref
          </span>
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {visualization.brief || "No brief"}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          disabled={expandingSourceUrl !== null}
          onClick={onExpand}
        >
          {expandingSourceUrl === generatedImage.url ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <Maximize2Icon className="size-4" />
          )}
          {expandingSourceUrl === generatedImage.url ? "Expanding..." : "Expand"}
        </Button>
      </div>
    </div>
  )
}
