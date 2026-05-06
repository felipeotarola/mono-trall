import { NextResponse } from "next/server"

import type { AIVisualizationRecord } from "@/lib/trall/ai-visualization"

import { assertProjectAccess, getAuthenticatedUser } from "./auth"
import {
  createOpenAIImageEditFormData,
  requestOpenAIImageEdit,
} from "./openai"
import { parseVisualizationRequest } from "./request"
import {
  getDemoGeneratedImages,
  getDemoReferenceImages,
  uploadGeneratedImages,
  uploadReferenceImages,
} from "./storage"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get("projectId")?.trim()

  if (projectId === "demo") {
    return NextResponse.json({ visualizations: [] })
  }

  const auth = await getAuthenticatedUser()
  if ("response" in auth) {
    return auth.response
  }

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
  const demoMode =
    request.headers.get("x-trall-demo") === "true" && input.projectId === "demo"
  const apiKey = demoMode
    ? request.headers.get("x-openai-api-key")?.trim()
    : process.env.OPENAI_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      {
        error: demoMode
          ? "Add an OpenAI API key before generating images in demo mode."
          : "OPENAI_API_KEY is missing. Add it to the web app environment before generating images.",
      },
      { status: 400 }
    )
  }

  const auth = demoMode ? null : await getAuthenticatedUser()
  if (auth && "response" in auth) {
    return auth.response
  }

  if (!demoMode && !process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "BLOB_READ_WRITE_TOKEN is missing. Add it before saving AI image assets.",
      },
      { status: 400 }
    )
  }

  if (!input.projectId) {
    return NextResponse.json({ error: "Project id is required" }, { status: 400 })
  }

  if (auth) {
    const allowed = await assertProjectAccess(auth, input.projectId)
    if ("response" in allowed) {
      return allowed.response
    }
  }

  if (input.images.length === 0) {
    return NextResponse.json(
      { error: "Add at least one property photo or a 3D layout reference." },
      { status: 400 }
    )
  }

  const formDataResult = createOpenAIImageEditFormData(input)

  if ("error" in formDataResult) {
    return NextResponse.json(
      { error: formDataResult.error },
      { status: formDataResult.status }
    )
  }

  const openAIResult = await requestOpenAIImageEdit(
    apiKey,
    formDataResult.formData
  )

  if (!openAIResult.ok) {
    return NextResponse.json(
      {
        error:
          openAIResult.payload.error?.message ??
          "OpenAI image generation failed. Check image inputs and model access.",
      },
      { status: openAIResult.status }
    )
  }

  if (!auth && !demoMode) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const generatedImages = demoMode
    ? getDemoGeneratedImages(openAIResult.payload, input)
    : await uploadGeneratedImages(openAIResult.payload, input, auth!.userId)

  if (generatedImages.length === 0) {
    return NextResponse.json(
      { error: "The image API returned no image data." },
      { status: 502 }
    )
  }

  const referenceImages = demoMode
    ? getDemoReferenceImages(input)
    : await uploadReferenceImages(input, auth!.userId)

  if (demoMode) {
    const visualization = {
      id: crypto.randomUUID(),
      project_id: input.projectId,
      user_id: "demo",
      brief: input.brief,
      style: input.style,
      plan_summary: input.planSummary,
      reference_images: referenceImages,
      generated_images: generatedImages,
      created_at: new Date().toISOString(),
    } satisfies AIVisualizationRecord

    return NextResponse.json({
      images: generatedImages.map((image) => image.url),
      visualization,
    })
  }

  const persistedAuth = auth

  if (!persistedAuth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { data: visualization, error: insertError } = await persistedAuth.supabase
    .from("trall_mono_ai_visualizations")
    .insert({
      project_id: input.projectId,
      user_id: persistedAuth.userId,
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
