"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  CameraIcon,
  EraserIcon,
  ImageIcon,
  Loader2Icon,
  Maximize2Icon,
  PaintbrushIcon,
  SparklesIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
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
  type AIVisualizationRecord,
  type AIVisualizationStyle,
} from "@/lib/trall/ai-visualization"
import type { PlannerViewMode } from "@/lib/trall/types"

type UploadedReference = {
  file: File
  id: string
  previewUrl: string
}

type ExpansionMode = "wide" | "vertical" | "square"

type AIVisualizationPanelProps = {
  ensureProject: () => Promise<string>
  planSummary: string
  projectId: string | null
  viewMode: PlannerViewMode
}

export function AIVisualizationPanel({
  ensureProject,
  planSummary,
  projectId,
  viewMode,
}: AIVisualizationPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [brief, setBrief] = useState(
    "Show the planned deck, pool, fences, stairs, planting, and house materials realistically on this property."
  )
  const [error, setError] = useState<string | null>(null)
  const [expandingSourceUrl, setExpandingSourceUrl] = useState<string | null>(
    null
  )
  const [expansionBrief, setExpansionBrief] = useState(
    "Expand the scene naturally while keeping the house, deck, pool, materials, and lighting unchanged."
  )
  const [expansionMode, setExpansionMode] = useState<ExpansionMode>("wide")
  const [editingVisualization, setEditingVisualization] =
    useState<AIVisualizationRecord | null>(null)
  const [visualizations, setVisualizations] = useState<
    AIVisualizationRecord[]
  >([])
  const [generating, setGenerating] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [reference3D, setReference3D] = useState<string | null>(null)
  const [style, setStyle] =
    useState<AIVisualizationStyle>("planning_realistic")
  const [uploads, setUploads] = useState<UploadedReference[]>([])
  const selectedStyle = useMemo(
    () =>
      aiVisualizationStyleOptions.find((option) => option.value === style) ??
      aiVisualizationStyleOptions[0],
    [style]
  )

  useEffect(() => {
    if (!projectId) {
      setVisualizations([])
      return
    }

    const activeProjectId = projectId
    let cancelled = false

    async function loadVisualizations() {
      setLoadingHistory(true)

      try {
        const response = await fetch(
          `/api/trall/ai-visualize?projectId=${encodeURIComponent(activeProjectId)}`
        )
        const payload = (await response.json()) as {
          error?: string
          visualizations?: AIVisualizationRecord[]
        }

        if (!response.ok) {
          throw new Error(payload.error ?? "Could not load AI images.")
        }

        if (!cancelled) {
          setVisualizations(payload.visualizations ?? [])
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Could not load AI images."
          )
        }
      } finally {
        if (!cancelled) {
          setLoadingHistory(false)
        }
      }
    }

    loadVisualizations()

    return () => {
      cancelled = true
    }
  }, [projectId])

  function addUploads(files: FileList | null) {
    if (!files) {
      return
    }

    const nextUploads = [...files]
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, Math.max(0, 6 - uploads.length))
      .map((file) => ({
        file,
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        previewUrl: URL.createObjectURL(file),
      }))

    setUploads((currentUploads) => [...currentUploads, ...nextUploads])
    setError(null)
  }

  function removeUpload(uploadId: string) {
    setUploads((currentUploads) => {
      const removed = currentUploads.find((upload) => upload.id === uploadId)

      if (removed) {
        URL.revokeObjectURL(removed.previewUrl)
      }

      return currentUploads.filter((upload) => upload.id !== uploadId)
    })
  }

  function capture3DReference() {
    const canvas = document.querySelector<HTMLCanvasElement>(
      '[data-testid="plan-3d-view"] canvas'
    )

    if (!canvas) {
      setError("Switch to 3D first, then capture the current view.")
      return
    }

    try {
      setReference3D(canvas.toDataURL("image/png"))
      setError(null)
    } catch {
      setError("Could not capture the 3D canvas. Try refreshing 3D view.")
    }
  }

  async function generateVisualization() {
    if (uploads.length === 0 && !reference3D) {
      setError("Add at least one property photo or capture the 3D view first.")
      return
    }

    setGenerating(true)
    setError(null)

    try {
      const savedProjectId = await ensureProject()
      const formData = new FormData()
      formData.append("brief", brief)
      formData.append("planSummary", planSummary)
      formData.append("projectId", savedProjectId)
      formData.append("style", style)

      for (const upload of uploads) {
        formData.append("images", upload.file, upload.file.name)
      }

      if (reference3D) {
        formData.append("reference3D", reference3D)
      }

      const response = await fetch("/api/trall/ai-visualize", {
        method: "POST",
        body: formData,
      })
      const payload = (await response.json()) as {
        error?: string
        images?: string[]
        visualization?: AIVisualizationRecord
      }

      if (!response.ok) {
        throw new Error(payload.error ?? "Image generation failed.")
      }

      if (payload.visualization) {
        setVisualizations((currentVisualizations) => [
          payload.visualization as AIVisualizationRecord,
          ...currentVisualizations,
        ])
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Image generation failed."
      )
    } finally {
      setGenerating(false)
    }
  }

  async function expandVisualization(visualization: AIVisualizationRecord) {
    const sourceImage = visualization.generated_images[0]

    if (!sourceImage) {
      setError("This visualization has no generated image to expand.")
      return
    }

    setExpandingSourceUrl(sourceImage.url)
    setError(null)

    try {
      const savedProjectId = await ensureProject()
      const formData = new FormData()
      formData.append("action", "expand")
      formData.append("brief", expansionBrief)
      formData.append("expansionMode", expansionMode)
      formData.append("planSummary", planSummary)
      formData.append("projectId", savedProjectId)
      formData.append("sourceImageUrl", sourceImage.url)
      formData.append("style", visualization.style)

      const response = await fetch("/api/trall/ai-visualize", {
        method: "POST",
        body: formData,
      })
      const payload = (await response.json()) as {
        error?: string
        visualization?: AIVisualizationRecord
      }

      if (!response.ok) {
        throw new Error(payload.error ?? "Image expansion failed.")
      }

      if (payload.visualization) {
        setVisualizations((currentVisualizations) => [
          payload.visualization as AIVisualizationRecord,
          ...currentVisualizations,
        ])
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Image expansion failed."
      )
    } finally {
      setExpandingSourceUrl(null)
    }
  }

  async function regenerateMarkedImage({
    instruction,
    mask,
    sourceImageUrl,
    visualization,
  }: {
    instruction: string
    mask: Blob
    sourceImageUrl: string
    visualization: AIVisualizationRecord
  }) {
    setGenerating(true)
    setError(null)

    try {
      const savedProjectId = await ensureProject()
      const formData = new FormData()
      formData.append("action", "markup_edit")
      formData.append("brief", instruction)
      formData.append("mask", mask, "trall-ai-markup-mask.png")
      formData.append("planSummary", planSummary)
      formData.append("projectId", savedProjectId)
      formData.append("sourceImageUrl", sourceImageUrl)
      formData.append("style", visualization.style)

      const response = await fetch("/api/trall/ai-visualize", {
        method: "POST",
        body: formData,
      })
      const payload = (await response.json()) as {
        error?: string
        visualization?: AIVisualizationRecord
      }

      if (!response.ok) {
        throw new Error(payload.error ?? "Marked image regeneration failed.")
      }

      if (payload.visualization) {
        setVisualizations((currentVisualizations) => [
          payload.visualization as AIVisualizationRecord,
          ...currentVisualizations,
        ])
        setEditingVisualization(payload.visualization)
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Marked image regeneration failed."
      )
    } finally {
      setGenerating(false)
    }
  }

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
          Add exterior property photos, capture the 3D view for layout, then
          describe what the generated image should show. Photos and generated
          renders are saved to the project.
        </div>

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
              Saved AI images
            </div>
            <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    Expand canvas
                  </span>
                  <Select
                    value={expansionMode}
                    onValueChange={(nextMode) =>
                      setExpansionMode(nextMode as ExpansionMode)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wide">Wide</SelectItem>
                      <SelectItem value="vertical">Vertical</SelectItem>
                      <SelectItem value="square">Square</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid content-end">
                  <span className="text-xs text-muted-foreground">
                    Saved as a new image
                  </span>
                </div>
              </div>
              <textarea
                className="min-h-16 resize-none rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={expansionBrief}
                onChange={(event) => setExpansionBrief(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              {visualizations.map((visualization) => (
                <SavedVisualization
                  key={visualization.id}
                  expandingSourceUrl={expandingSourceUrl}
                  onExpand={() => expandVisualization(visualization)}
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

function SavedVisualization({
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

function ReferenceImage({
  label,
  onRemove,
  src,
}: {
  label: string
  onRemove: () => void
  src: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-md border bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element -- Local object URLs and canvas captures are not remote optimized assets. */}
      <img src={src} alt={label} className="aspect-square w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 bg-black/55 px-1.5 py-1 text-[10px] font-medium text-white">
        <span className="block truncate">{label}</span>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute top-1 right-1 size-6 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={onRemove}
      >
        <Trash2Icon className="size-3.5" />
      </Button>
    </div>
  )
}

function AIImageEditorDialog({
  generating,
  onOpenChange,
  onRegenerate,
  open,
  visualization,
}: {
  generating: boolean
  onOpenChange: (open: boolean) => void
  onRegenerate: (input: {
    instruction: string
    mask: Blob
    sourceImageUrl: string
    visualization: AIVisualizationRecord
  }) => Promise<void>
  open: boolean
  visualization: AIVisualizationRecord | null
}) {
  const image = visualization?.generated_images[0] ?? null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94svh] max-w-[min(120rem,96vw)] overflow-hidden p-0">
        <DialogHeader className="border-b px-5 pt-5 pb-3">
          <DialogTitle>AI image review</DialogTitle>
          <DialogDescription>
            Mark an area and describe what should change, then regenerate a
            corrected image.
          </DialogDescription>
        </DialogHeader>
        {visualization && image ? (
          <AIImageMarkupEditor
            generating={generating}
            imageUrl={image.url}
            onRegenerate={(instruction, mask) =>
              onRegenerate({
                instruction,
                mask,
                sourceImageUrl: image.url,
                visualization,
              })
            }
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function AIImageMarkupEditor({
  generating,
  imageUrl,
  onRegenerate,
}: {
  generating: boolean
  imageUrl: string
  onRegenerate: (instruction: string, mask: Blob) => Promise<void>
}) {
  const imageRef = useRef<HTMLImageElement | null>(null)
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [brushSize, setBrushSize] = useState(44)
  const [drawing, setDrawing] = useState(false)
  const [hasMarks, setHasMarks] = useState(false)
  const [instruction, setInstruction] = useState(
    "Remove the marked part and fill it with the realistic surrounding property context."
  )

  function initializeCanvases() {
    const image = imageRef.current
    const maskCanvas = maskCanvasRef.current
    const overlayCanvas = overlayCanvasRef.current

    if (!image || !maskCanvas || !overlayCanvas) {
      return
    }

    const width = image.naturalWidth || image.clientWidth
    const height = image.naturalHeight || image.clientHeight

    for (const canvas of [maskCanvas, overlayCanvas]) {
      canvas.width = width
      canvas.height = height
    }

    const maskContext = maskCanvas.getContext("2d")
    const overlayContext = overlayCanvas.getContext("2d")

    if (!maskContext || !overlayContext) {
      return
    }

    maskContext.globalCompositeOperation = "source-over"
    maskContext.fillStyle = "#000000"
    maskContext.fillRect(0, 0, width, height)
    overlayContext.clearRect(0, 0, width, height)
    setHasMarks(false)
  }

  function clearMarks() {
    initializeCanvases()
  }

  function drawAt(event: React.PointerEvent<HTMLCanvasElement>) {
    const overlayCanvas = overlayCanvasRef.current
    const maskCanvas = maskCanvasRef.current

    if (!overlayCanvas || !maskCanvas) {
      return
    }

    const point = getCanvasPoint(event, overlayCanvas)
    const radius = brushSize / 2
    const overlayContext = overlayCanvas.getContext("2d")
    const maskContext = maskCanvas.getContext("2d")

    if (!overlayContext || !maskContext) {
      return
    }

    overlayContext.globalCompositeOperation = "source-over"
    overlayContext.fillStyle = "rgba(239, 68, 68, 0.48)"
    overlayContext.strokeStyle = "rgba(255, 255, 255, 0.75)"
    overlayContext.lineWidth = Math.max(2, brushSize / 12)
    overlayContext.beginPath()
    overlayContext.arc(point.x, point.y, radius, 0, Math.PI * 2)
    overlayContext.fill()
    overlayContext.stroke()

    maskContext.globalCompositeOperation = "destination-out"
    maskContext.beginPath()
    maskContext.arc(point.x, point.y, radius, 0, Math.PI * 2)
    maskContext.fill()
    setHasMarks(true)
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    setDrawing(true)
    drawAt(event)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (drawing) {
      drawAt(event)
    }
  }

  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    setDrawing(false)
  }

  async function submitMarkedEdit() {
    const maskCanvas = maskCanvasRef.current

    if (!maskCanvas || !hasMarks) {
      return
    }

    const mask = await canvasToBlob(maskCanvas)
    await onRegenerate(instruction, mask)
  }

  return (
    <div className="grid max-h-[calc(94svh-6.5rem)] grid-rows-[1fr_auto] overflow-hidden">
      <div className="overflow-auto bg-zinc-950 p-4">
        <div className="relative mx-auto w-fit max-w-full">
          {/* eslint-disable-next-line @next/next/no-img-element -- Blob URL is a persisted user-generated image. */}
          <img
            ref={imageRef}
            src={imageUrl}
            alt="AI generated property visualization"
            className="max-h-[calc(94svh-16rem)] max-w-full select-none rounded-md object-contain"
            draggable={false}
            onLoad={initializeCanvases}
          />
          <canvas ref={maskCanvasRef} className="hidden" />
          <canvas
            ref={overlayCanvasRef}
            className="absolute inset-0 h-full w-full cursor-crosshair rounded-md"
            onPointerCancel={handlePointerUp}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
        </div>
      </div>
      <div className="grid gap-3 border-t bg-background p-4 lg:grid-cols-[1fr_15rem]">
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Correction instruction
          </span>
          <textarea
            className="min-h-20 resize-none rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
          />
        </label>
        <div className="grid content-end gap-2">
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Brush size
            </span>
            <Input
              min={12}
              max={120}
              type="range"
              value={brushSize}
              onChange={(event) => setBrushSize(Number(event.target.value))}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={clearMarks}>
              <EraserIcon className="size-4" />
              Clear
            </Button>
            <Button
              type="button"
              disabled={generating || !hasMarks}
              onClick={submitMarkedEdit}
            >
              {generating ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <PaintbrushIcon className="size-4" />
              )}
              Regenerate
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatFileLabel(file: File) {
  const sizeMb = file.size / (1024 * 1024)

  return `${file.name} · ${sizeMb.toFixed(sizeMb >= 1 ? 1 : 2)} MB`
}

function getCanvasPoint(
  event: React.PointerEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement
) {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  }
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error("Could not create markup mask."))
      }
    }, "image/png")
  })
}

function getStyleLabel(style: AIVisualizationStyle) {
  return (
    aiVisualizationStyleOptions.find((option) => option.value === style)
      ?.label ?? "AI visualization"
  )
}
