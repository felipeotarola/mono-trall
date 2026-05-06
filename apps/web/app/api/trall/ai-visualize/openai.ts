import { buildImagePrompt, getImageSize } from "./prompts"
import { IMAGE_MODEL, type OpenAIImageResponse, type VisualizationRequest } from "./types"

export function createOpenAIImageEditFormData(input: VisualizationRequest) {
  const formData = new FormData()
  formData.append("model", IMAGE_MODEL)
  formData.append("prompt", buildImagePrompt(input))
  formData.append("size", getImageSize(input))
  formData.append("quality", "high")

  if (input.action === "markup_edit") {
    const sourceImage = input.images.find(
      (image) => image.kind === "markup_source"
    )
    const maskImage = input.images.find((image) => image.kind === "markup_mask")

    if (!sourceImage || !maskImage) {
      return { error: "Marked image and mask are required.", status: 400 }
    }

    formData.append("image", sourceImage.file, sourceImage.file.name)
    formData.append("mask", maskImage.file, maskImage.file.name)

    return { formData }
  }

  for (const image of input.images) {
    formData.append("image[]", image.file, image.file.name)
  }

  return { formData }
}

export async function requestOpenAIImageEdit(
  apiKey: string,
  formData: FormData
) {
  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  })

  const payload = (await response.json()) as OpenAIImageResponse

  return {
    ok: response.ok,
    payload,
    status: response.status,
  }
}
