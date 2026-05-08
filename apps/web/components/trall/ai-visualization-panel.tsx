"use client"

import { useRef } from "react"
import {
  CameraIcon,
  ImageIcon,
  Loader2Icon,
  SparklesIcon,
  UploadIcon,
} from "lucide-react"

import { AIImageEditorDialog } from "@/components/trall/ai-visualization/components/ai-image-editor-dialog"
import { ReferenceImage } from "@/components/trall/ai-visualization/components/reference-image"
import { SavedVisualization } from "@/components/trall/ai-visualization/components/saved-visualization"
import { useAIVisualizationFlow } from "@/components/trall/ai-visualization/hooks/use-ai-visualization-flow"
import { formatFileLabel } from "@/components/trall/ai-visualization/utils"
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
  aiVisualizationStyleOptions,
  type AIVisualizationStyle,
} from "@/lib/trall/ai-visualization"
import type { PlannerViewMode } from "@/lib/trall/types"

type AIVisualizationPanelProps = {
  demoMode?: boolean
  demoOpenAIKey?: string
  ensureProject: () => Promise<string>
  planSummary: string
  projectId: string | null
  setDemoOpenAIKey?: (key: string) => void
  viewMode: PlannerViewMode
}

export function AIVisualizationPanel({
  demoMode = false,
  demoOpenAIKey = "",
  ensureProject,
  planSummary,
  projectId,
  setDemoOpenAIKey,
  viewMode,
}: AIVisualizationPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const {
    addUploads,
    brief,
    capture3DReference,
    editingVisualization,
    error,
    generateVisualization,
    generating,
    loadingHistory,
    reference3D,
    regenerateMarkedImage,
    removeUpload,
    selectedStyle,
    setBrief,
    setEditingVisualization,
    setReference3D,
    setStyle,
    style,
    uploads,
    visualizations,
  } = useAIVisualizationFlow({
    demoMode,
    demoOpenAIKey,
    ensureProject,
    planSummary,
    projectId,
  })

  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-start gap-2">
          <SparklesIcon className="mt-0.5 size-4 text-primary" />
          <div className="min-w-0">
            <CardTitle>AI property image</CardTitle>
            <CardDescription>
              Combine real photos with the current 3D deck plan.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border bg-muted/25 p-3 text-xs text-muted-foreground">
          {demoMode
            ? "Add exterior property photos, capture the 3D view for layout, then use your OpenAI API key for generation. Demo renders stay in this browser session."
            : "Add exterior property photos, capture the 3D view for layout, then describe what the generated image should show. Photos and generated renders are saved to the project."}
        </div>

        {demoMode ? (
          <label className="grid gap-1.5 rounded-lg border border-amber-200 bg-amber-50/70 p-3">
            <span className="text-xs font-medium text-amber-950">
              OpenAI API key
            </span>
            <Input
              autoComplete="off"
              placeholder="sk-..."
              type="password"
              value={demoOpenAIKey}
              onChange={(event) => setDemoOpenAIKey?.(event.target.value)}
            />
            <span className="text-xs text-amber-900/75">
              Sent only with demo generation requests. It is not saved by this app.
            </span>
          </label>
        ) : null}

        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => addUploads(event.target.files)}
        />

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon className="size-4" />
            Photos
          </Button>
          <Button
            type="button"
            variant={reference3D ? "secondary" : "outline"}
            size="sm"
            onClick={capture3DReference}
          >
            <CameraIcon className="size-4" />
            3D view
          </Button>
        </div>

        {viewMode !== "3d" ? (
          <p className="text-xs text-muted-foreground">
            Switch to 3D before capturing a layout reference.
          </p>
        ) : null}

        {uploads.length || reference3D ? (
          <div className="grid grid-cols-3 gap-2">
            {uploads.map((upload) => (
              <ReferenceImage
                key={upload.id}
                label={formatFileLabel(upload.file)}
                src={upload.previewUrl}
                onRemove={() => removeUpload(upload.id)}
              />
            ))}
            {reference3D ? (
              <ReferenceImage
                label="3D layout"
                src={reference3D}
                onRemove={() => setReference3D(null)}
              />
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-1.5">
          <span className="text-xs text-muted-foreground">Style</span>
          <Select
            value={style}
            onValueChange={(nextStyle) =>
              setStyle(nextStyle as AIVisualizationStyle)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {aiVisualizationStyleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">
            {selectedStyle.description}
          </span>
        </div>

        <label className="grid gap-1.5">
          <span className="text-xs text-muted-foreground">Brief</span>
          <textarea
            className="min-h-24 resize-none rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            value={brief}
            onChange={(event) => setBrief(event.target.value)}
          />
        </label>

        {error ? (
          <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        ) : null}

        <Button
          type="button"
          className="w-full"
          disabled={generating}
          onClick={generateVisualization}
        >
          {generating ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <SparklesIcon className="size-4" />
          )}
          {generating ? "Generating..." : "Generate image"}
        </Button>

        {loadingHistory ? (
          <div className="rounded-lg border bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
            Loading saved AI images...
          </div>
        ) : null}

        {visualizations.length ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <ImageIcon className="size-3.5" />
              {demoMode ? "Demo AI images" : "Saved AI images"}
            </div>
            <div className="grid gap-2">
              {visualizations.map((visualization) => (
                <SavedVisualization
                  key={visualization.id}
                  onOpen={() => setEditingVisualization(visualization)}
                  visualization={visualization}
                />
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
      <AIImageEditorDialog
        generating={generating}
        onOpenChange={(open) => {
          if (!open) {
            setEditingVisualization(null)
          }
        }}
        onRegenerate={regenerateMarkedImage}
        open={editingVisualization !== null}
        visualization={editingVisualization}
      />
    </Card>
  )
}
