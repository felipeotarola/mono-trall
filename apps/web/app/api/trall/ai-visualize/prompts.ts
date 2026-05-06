import type { VisualizationRequest } from "./types"

export function getImageSize(input: VisualizationRequest) {
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

export function buildImagePrompt(input: VisualizationRequest) {
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
