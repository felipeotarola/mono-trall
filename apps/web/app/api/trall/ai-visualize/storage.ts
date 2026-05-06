import { put } from "@vercel/blob"

import type { AIVisualizationAsset } from "@/lib/trall/ai-visualization"

import type { OpenAIImageResponse, VisualizationRequest } from "./types"

export async function uploadReferenceImages(
  input: VisualizationRequest,
  userId: string
) {
  return Promise.all(
    input.images.map(({ existingAsset, file, kind }, index) =>
      existingAsset
        ? existingAsset
        : uploadImageFile({
            file,
            kind,
            path: getBlobPath({
              extension: getFileExtension(file),
              index,
              projectId: input.projectId,
              role: kind,
              userId,
            }),
          })
    )
  )
}

export async function uploadGeneratedImages(
  payload: OpenAIImageResponse,
  input: VisualizationRequest,
  userId: string
) {
  const base64Images =
    payload.data
      ?.map((item) => item.b64_json)
      .filter((value): value is string => Boolean(value)) ?? []

  return Promise.all(
    base64Images.map((base64, index) =>
      uploadImageFile({
        file: new File(
          [Buffer.from(base64, "base64")],
          `trall-ai-visualization-${index + 1}.png`,
          { type: "image/png" }
        ),
        kind: getGeneratedAssetKind(input),
        path: getBlobPath({
          extension: "png",
          index,
          projectId: input.projectId,
          role: getGeneratedAssetKind(input),
          userId,
        }),
      })
    )
  )
}

export function getDemoReferenceImages(input: VisualizationRequest) {
  return input.images.map(({ existingAsset, file, kind }, index) =>
    existingAsset
      ? existingAsset
      : ({
          contentType: file.type || "application/octet-stream",
          kind,
          name: file.name || `demo-reference-${index + 1}.png`,
          sizeBytes: file.size,
          url: "",
        } satisfies AIVisualizationAsset)
  )
}

export function getDemoGeneratedImages(
  payload: OpenAIImageResponse,
  input: VisualizationRequest
) {
  const base64Images =
    payload.data
      ?.map((item) => item.b64_json)
      .filter((value): value is string => Boolean(value)) ?? []

  return base64Images.map(
    (base64, index) =>
      ({
        contentType: "image/png",
        kind: getGeneratedAssetKind(input),
        name: `trall-ai-demo-${index + 1}.png`,
        sizeBytes: Buffer.byteLength(base64, "base64"),
        url: `data:image/png;base64,${base64}`,
      }) satisfies AIVisualizationAsset
  )
}

async function uploadImageFile({
  file,
  kind,
  path,
}: {
  file: File
  kind: AIVisualizationAsset["kind"]
  path: string
}) {
  const result = await put(path, file, {
    access: "public",
    addRandomSuffix: true,
  })

  return {
    contentType: file.type || "application/octet-stream",
    kind,
    name: file.name,
    sizeBytes: file.size,
    url: result.url,
  } satisfies AIVisualizationAsset
}

function getBlobPath({
  extension,
  index,
  projectId,
  role,
  userId,
}: {
  extension: string
  index: number
  projectId: string
  role: string
  userId: string
}) {
  return [
    "trall-ai",
    userId,
    projectId,
    `${Date.now()}-${role}-${index + 1}.${extension}`,
  ].join("/")
}

function getFileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase()

  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) {
    return fromName
  }

  if (file.type === "image/jpeg") {
    return "jpg"
  }

  return file.type === "image/webp" ? "webp" : "png"
}

function getGeneratedAssetKind(input: VisualizationRequest) {
  if (input.action === "expand") {
    return "expanded"
  }

  return input.action === "markup_edit" ? "edited" : "generated"
}
