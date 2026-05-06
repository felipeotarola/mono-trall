import type { AIVisualizationAsset } from "@/lib/trall/ai-visualization"

import {
  expansionModes,
  MAX_IMAGE_BYTES,
  MAX_REFERENCE_IMAGES,
  type VisualizationRequest,
} from "./types"

export async function parseVisualizationRequest(
  request: Request
): Promise<VisualizationRequest> {
  const formData = await request.formData()
  const brief = getFormString(formData, "brief").slice(0, 2000)
  const planSummary = getFormString(formData, "planSummary").slice(0, 3000)
  const projectId = getFormString(formData, "projectId")
  const style = parseStyle(getFormString(formData, "style"))
  const action = parseAction(getFormString(formData, "action"))
  const expansionMode = parseExpansionMode(
    getFormString(formData, "expansionMode")
  )
  const images: VisualizationRequest["images"] = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File)
    .slice(0, MAX_REFERENCE_IMAGES)
    .filter((file) => file.type.startsWith("image/") && file.size > 0)
    .filter((file) => file.size <= MAX_IMAGE_BYTES)
    .map((file) => ({
      file,
      kind: "property_reference" as const,
    }))

  const reference3D = getFormString(formData, "reference3D")

  if (reference3D.startsWith("data:image/")) {
    images.push({
      file: await dataUrlToFile(reference3D, "trall-3d-reference.png"),
      kind: "layout_reference",
    })
  }

  if (action === "expand" || action === "markup_edit") {
    const sourceImageUrl = getFormString(formData, "sourceImageUrl")

    if (!sourceImageUrl) {
      throw new Error("Choose a saved AI image to edit.")
    }

    const sourceFile = await fetchSourceImage(sourceImageUrl)
    const sourceKind =
      action === "markup_edit" ? "markup_source" : "expanded_source"

    images.splice(0, images.length, {
      existingAsset: {
        contentType: sourceFile.type || "image/png",
        kind: sourceKind,
        name: sourceFile.name,
        sizeBytes: sourceFile.size,
        url: sourceImageUrl,
      },
      file: sourceFile,
      kind: sourceKind,
    })

    if (action === "markup_edit") {
      const mask = formData.get("mask")

      if (!(mask instanceof File) || !mask.type.startsWith("image/")) {
        throw new Error("Draw a mark on the image before regenerating.")
      }

      images.push({
        file: mask,
        kind: "markup_mask",
      })
    }
  }

  return { action, brief, expansionMode, images, planSummary, projectId, style }
}

export function getFormString(formData: FormData, key: string) {
  const value = formData.get(key)

  return typeof value === "string" ? value.trim() : ""
}

async function dataUrlToFile(dataUrl: string, name: string) {
  const response = await fetch(dataUrl)
  const blob = await response.blob()

  return new File([blob], name, { type: blob.type || "image/png" })
}

async function fetchSourceImage(sourceImageUrl: string) {
  if (sourceImageUrl.startsWith("data:image/")) {
    return dataUrlToFile(sourceImageUrl, "trall-ai-demo-source.png")
  }

  let url: URL

  try {
    url = new URL(sourceImageUrl)
  } catch {
    throw new Error("Source image URL is invalid.")
  }

  if (url.protocol !== "https:") {
    throw new Error("Source image must be a saved HTTPS image.")
  }

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error("Could not load the saved source image.")
  }

  const blob = await response.blob()

  if (!blob.type.startsWith("image/")) {
    throw new Error("Source image must be an image file.")
  }

  if (blob.size > MAX_IMAGE_BYTES) {
    throw new Error("Source image is too large to expand.")
  }

  return new File([blob], "trall-ai-expand-source.png", {
    type: blob.type || "image/png",
  })
}

function parseStyle(style: string): VisualizationRequest["style"] {
  switch (style) {
    case "premium_sales":
    case "evening":
    case "construction_neutral":
      return style
    default:
      return "planning_realistic"
  }
}

function parseAction(action: string): VisualizationRequest["action"] {
  if (action === "expand" || action === "markup_edit") {
    return action
  }

  return "generate"
}

function parseExpansionMode(mode: string) {
  return expansionModes.find((candidate) => candidate === mode) ?? "wide"
}

export function getExistingAsset(
  image: VisualizationRequest["images"][number]
): AIVisualizationAsset | undefined {
  return image.existingAsset
}
