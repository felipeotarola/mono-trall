"use client"

import { useRef, useState } from "react"
import { EraserIcon, Loader2Icon, PaintbrushIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import type { AIVisualizationRecord } from "@/lib/trall/ai-visualization"

export function AIImageEditorDialog({
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
