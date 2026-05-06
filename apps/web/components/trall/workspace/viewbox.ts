import type { ViewBox } from "@/lib/trall/types"
import { zoomViewBox } from "@/lib/trall/view"

const DESKTOP_FIT_ZOOM = 1.14

export function getDesktopEnhancedFitViewBox(viewBox: ViewBox): ViewBox {
  if (
    typeof window === "undefined" ||
    !window.matchMedia("(min-width: 1024px)").matches
  ) {
    return viewBox
  }

  return zoomViewBox(viewBox, DESKTOP_FIT_ZOOM)
}
