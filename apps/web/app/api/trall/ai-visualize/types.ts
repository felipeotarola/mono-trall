import type { createClient } from "@/lib/supabase/server"
import type {
  AIVisualizationAsset,
  AIVisualizationStyle,
} from "@/lib/trall/ai-visualization"

export const MAX_REFERENCE_IMAGES = 6
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024
export const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2"
export const expansionModes = ["wide", "vertical", "square"] as const

export type AuthContext = {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
}

export type VisualizationRequest = {
  brief: string
  images: Array<{
    existingAsset?: AIVisualizationAsset
    file: File
    kind: AIVisualizationAsset["kind"]
  }>
  planSummary: string
  projectId: string
  style: AIVisualizationStyle
  action: "generate" | "expand" | "markup_edit"
  expansionMode: (typeof expansionModes)[number]
}

export type OpenAIImageResponse = {
  data?: Array<{
    b64_json?: string
  }>
  error?: {
    message?: string
  }
}
