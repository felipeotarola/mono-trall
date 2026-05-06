import {
  aiVisualizationStyleOptions,
  type AIVisualizationStyle,
} from "@/lib/trall/ai-visualization"

export function formatFileLabel(file: File) {
  const sizeMb = file.size / (1024 * 1024)

  return `${file.name} · ${sizeMb.toFixed(sizeMb >= 1 ? 1 : 2)} MB`
}

export function getStyleLabel(style: AIVisualizationStyle) {
  return (
    aiVisualizationStyleOptions.find((option) => option.value === style)
      ?.label ?? "AI visualization"
  )
}
