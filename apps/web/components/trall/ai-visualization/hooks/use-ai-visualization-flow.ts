import { useEffect, useMemo, useState } from "react"

import {
  aiVisualizationStyleOptions,
  type AIVisualizationRecord,
  type AIVisualizationStyle,
} from "@/lib/trall/ai-visualization"

export type UploadedReference = {
  file: File
  id: string
  previewUrl: string
}

export function useAIVisualizationFlow({
  demoMode,
  demoOpenAIKey,
  ensureProject,
  planSummary,
  projectId,
}: {
  demoMode: boolean
  demoOpenAIKey: string
  ensureProject: () => Promise<string>
  planSummary: string
  projectId: string | null
}) {
  const [brief, setBrief] = useState(
    "Show the planned deck, pool, fences, stairs, planting, and house materials realistically on this property."
  )
  const [error, setError] = useState<string | null>(null)
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
    if (!projectId || demoMode) {
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
  }, [demoMode, projectId])

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
      if (demoMode && !demoOpenAIKey.trim()) {
        throw new Error("Add an OpenAI API key to generate images in demo mode.")
      }

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

      const payload = await postAIVisualization({
        demoMode,
        demoOpenAIKey,
        formData,
        fallbackError: "Image generation failed.",
      })

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
      if (demoMode && !demoOpenAIKey.trim()) {
        throw new Error("Add an OpenAI API key to edit images in demo mode.")
      }

      const savedProjectId = await ensureProject()
      const formData = new FormData()
      formData.append("action", "markup_edit")
      formData.append("brief", instruction)
      formData.append("mask", mask, "trall-ai-markup-mask.png")
      formData.append("planSummary", planSummary)
      formData.append("projectId", savedProjectId)
      formData.append("sourceImageUrl", sourceImageUrl)
      formData.append("style", visualization.style)

      const payload = await postAIVisualization({
        demoMode,
        demoOpenAIKey,
        formData,
        fallbackError: "Marked image regeneration failed.",
      })

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

  return {
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
  }
}

async function postAIVisualization({
  demoMode,
  demoOpenAIKey,
  fallbackError,
  formData,
}: {
  demoMode: boolean
  demoOpenAIKey: string
  fallbackError: string
  formData: FormData
}) {
  const response = await fetch("/api/trall/ai-visualize", {
    method: "POST",
    headers: getDemoHeaders(demoMode, demoOpenAIKey),
    body: formData,
  })
  const payload = (await response.json()) as {
    error?: string
    images?: string[]
    visualization?: AIVisualizationRecord
  }

  if (!response.ok) {
    throw new Error(payload.error ?? fallbackError)
  }

  return payload
}

function getDemoHeaders(demoMode: boolean, demoOpenAIKey: string) {
  return demoMode
    ? {
        "x-openai-api-key": demoOpenAIKey.trim(),
        "x-trall-demo": "true",
      }
    : undefined
}
