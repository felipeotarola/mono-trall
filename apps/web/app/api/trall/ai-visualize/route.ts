import { NextResponse } from "next/server"
import { put } from "@vercel/blob"

import { createClient } from "@/lib/supabase/server"
import type {
  AIVisualizationAsset,
  AIVisualizationRecord,
  AIVisualizationStyle,
} from "@/lib/trall/ai-visualization"

export const runtime = "nodejs"

const MAX_REFERENCE_IMAGES = 6
const MAX_IMAGE_BYTES = 12 * 1024 * 1024
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2"
const expansionModes = ["wide", "vertical", "square"] as const

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser()
  if ("response" in auth) {
    return auth.response
  }

  const projectId = new URL(request.url).searchParams.get("projectId")?.trim()

  if (!projectId) {
    return NextResponse.json({ error: "Project id is required" }, { status: 400 })
  }

  const allowed = await assertProjectAccess(auth, projectId)
  if ("response" in allowed) {
    return allowed.response
  }

  const { data, error } = await auth.supabase
    .from("trall_mono_ai_visualizations")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false })
    .limit(12)
    .returns<AIVisualizationRecord[]>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ visualizations: data })
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser()
  if ("response" in auth) {
    return auth.response
  }

  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY is missing. Add it to the web app environment before generating images.",
      },
      { status: 400 }
    )
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "BLOB_READ_WRITE_TOKEN is missing. Add it before saving AI image assets.",
      },
      { status: 400 }
    )
  }

  const inputResult = await parseVisualizationRequest(request).catch(
    (error: unknown) => ({
      error:
        error instanceof Error
          ? error.message
          : "Could not parse image generation request.",
    })
  )

  if ("error" in inputResult) {
    return NextResponse.json({ error: inputResult.error }, { status: 400 })
  }

  const input = inputResult

  if (!input.projectId) {
    return NextResponse.json({ error: "Project id is required" }, { status: 400 })
  }

  const allowed = await assertProjectAccess(auth, input.projectId)
  if ("response" in allowed) {
    return allowed.response
  }

  if (input.images.length === 0) {
    return NextResponse.json(
      { error: "Add at least one property photo or a 3D layout reference." },
      { status: 400 }
    )
  }

  const openAIFormData = new FormData()
  openAIFormData.append("model", IMAGE_MODEL)
  openAIFormData.append("prompt", buildImagePrompt(input))
  openAIFormData.append("size", getImageSize(input))
  openAIFormData.append("quality", "high")

  if (input.action === "markup_edit") {
    const sourceImage = input.images.find(
      (image) => image.kind === "markup_source"
    )
    const maskImage = input.images.find((image) => image.kind === "markup_mask")

    if (!sourceImage || !maskImage) {
      return NextResponse.json(
        { error: "Marked image and mask are required." },
        { status: 400 }
      )
    }

    openAIFormData.append("image", sourceImage.file, sourceImage.file.name)
    openAIFormData.append("mask", maskImage.file, maskImage.file.name)
  } else {
    for (const image of input.images) {
      openAIFormData.append("image[]", image.file, image.file.name)
    }
  }

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: openAIFormData,
  })

  const payload = (await response.json()) as OpenAIImageResponse

  if (!response.ok) {
    return NextResponse.json(
      {
        error:
          payload.error?.message ??
          "OpenAI image generation failed. Check image inputs and model access.",
      },
      { status: response.status }
    )
  }

  const generatedImages = await uploadGeneratedImages(
    payload,
    input,
    auth.userId
  )

  if (generatedImages.length === 0) {
    return NextResponse.json(
      { error: "The image API returned no image data." },
      { status: 502 }
    )
  }

  const referenceImages = await uploadReferenceImages(input, auth.userId)

  const { data: visualization, error: insertError } = await auth.supabase
    .from("trall_mono_ai_visualizations")
    .insert({
      project_id: input.projectId,
      user_id: auth.userId,
      brief: input.brief,
      style: input.style,
      plan_summary: input.planSummary,
      reference_images: referenceImages,
      generated_images: generatedImages,
    })
    .select("*")
    .single<AIVisualizationRecord>()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({
    images: generatedImages.map((image) => image.url),
    visualization,
  })
}

type AuthContext = {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
}

type VisualizationRequest = {
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

type OpenAIImageResponse = {
  data?: Array<{
    b64_json?: string
  }>
  error?: {
    message?: string
  }
}

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      response: NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      ),
    }
  }

  return { supabase, userId: user.id }
}

async function assertProjectAccess(auth: AuthContext, projectId: string) {
  const { error } = await auth.supabase
    .from("trall_mono_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", auth.userId)
    .single<{ id: string }>()

  if (error) {
    return {
      response: NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      ),
    }
  }

  return { ok: true }
}

async function parseVisualizationRequest(
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

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key)

  return typeof value === "string" ? value.trim() : ""
}

async function dataUrlToFile(dataUrl: string, name: string) {
  const response = await fetch(dataUrl)
  const blob = await response.blob()

  return new File([blob], name, { type: blob.type || "image/png" })
}

async function fetchSourceImage(sourceImageUrl: string) {
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

async function uploadReferenceImages(
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

async function uploadGeneratedImages(
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
        kind:
          input.action === "expand"
            ? "expanded"
            : input.action === "markup_edit"
              ? "edited"
              : "generated",
        path: getBlobPath({
          extension: "png",
          index,
          projectId: input.projectId,
          role:
            input.action === "expand"
              ? "expanded"
              : input.action === "markup_edit"
                ? "edited"
                : "generated",
          userId,
        }),
      })
    )
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

function parseStyle(style: string): AIVisualizationStyle {
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

function getImageSize(input: VisualizationRequest) {
  if (input.action !== "expand") {
    return "1536x1024"
  }

  switch (input.expansionMode) {
    case "vertical":
      return "1024x1536"
    case "square":
      return "1024x1024"
    default:
      return "1536x1024"
  }
}

function buildImagePrompt(input: VisualizationRequest) {
  if (input.action === "expand") {
    return buildExpandPrompt(input)
  }

  if (input.action === "markup_edit") {
    return buildMarkupEditPrompt(input)
  }

  const styleDirection = getStyleDirection(input.style)
  const userBrief = input.brief
    ? input.brief
    : "Create a realistic visualization of the planned deck on this property."

  return [
    "You are creating a realistic property visualization for TrallAI, a deck planning tool.",
    "Use the real property photo(s) as the source of truth for the house, camera angle, surroundings, existing garden, facade, lighting, and scale.",
    "Use the included 3D planner reference, if present, as the source of truth for deck shape, pool position, terrain/elevation relationship, fences, stairs, pergolas, plants, and accessories.",
    "Preserve the real property identity. Do not invent a different house, facade, roof shape, lot layout, or camera position.",
    "Make the new construction feel physically built into the existing property, with believable shadows, perspective, material scale, and contact with ground/deck surfaces.",
    "Avoid unrealistic luxury staging unless explicitly requested. Do not add people, text, logos, watermarks, annotations, labels, or blueprint overlays.",
    styleDirection,
    "",
    "User brief:",
    userBrief,
    "",
    "Planner summary:",
    input.planSummary || "No structured planner summary was provided.",
  ].join("\n")
}

function buildExpandPrompt(input: VisualizationRequest) {
  const userBrief = input.brief
    ? input.brief
    : "Expand this generated TrallAI property image."

  return [
    "Expand this existing TrallAI property visualization into a larger complete image.",
    "Keep the original property, deck, pool, materials, lighting, perspective, and visual style consistent.",
    "Do not crop, distort, stretch, or redesign the central subject. Continue the house, garden, sky, terrain, deck, shadows, and surrounding context naturally beyond the original frame.",
    "Do not add text, watermarks, labels, people, logos, UI, or blueprint overlays.",
    `Target composition: ${input.expansionMode}.`,
    "",
    "Expansion brief:",
    userBrief,
    "",
    "Planner context:",
    input.planSummary || "No structured planner summary was provided.",
  ].join("\n")
}

function buildMarkupEditPrompt(input: VisualizationRequest) {
  const userBrief = input.brief
    ? input.brief
    : "Regenerate the marked area while keeping the rest of the image unchanged."

  return [
    "Edit this TrallAI property visualization using the provided mask.",
    "Only change the marked/masked area unless the instruction requires tiny lighting or shadow adjustments at the boundary.",
    "Keep the unmarked parts of the property image unchanged: house, deck, pool, materials, lighting, perspective, scale, and camera angle.",
    "Use the instruction to remove, replace, or correct the marked area. If removing an object, fill the area with realistic continuation of the surrounding property, garden, terrain, house facade, sky, or deck.",
    "Do not add text, watermarks, labels, people, logos, UI, or blueprint overlays.",
    "",
    "Markup instruction:",
    userBrief,
    "",
    "Planner context:",
    input.planSummary || "No structured planner summary was provided.",
  ].join("\n")
}

function getStyleDirection(style: string) {
  switch (style) {
    case "premium_sales":
      return "Visual style: polished premium sales render, still believable and based on the real property."
    case "evening":
      return "Visual style: realistic evening exterior with warm outdoor lighting visible, while preserving the property geometry."
    case "construction_neutral":
      return "Visual style: neutral construction planning preview with clear geometry and readable material transitions."
    default:
      return "Visual style: realistic daylight planning preview with practical Scandinavian deck materials."
  }
}
