import type {
  HouseBounds,
  PlanContentBounds,
  Point,
  PointBounds,
  ViewBox,
} from "./types"

const CONTENT_PADDING = 160
const MIN_VIEW_BOX_WIDTH = 900
const MIN_VIEW_BOX_HEIGHT = 650
const PAN_PADDING = 500

export function getPointBounds(houseBounds: HouseBounds): PointBounds {
  return {
    minX: Math.min(0, houseBounds.left - 400),
    maxX: Math.max(1200, houseBounds.right + 400),
    minY: Math.min(0, houseBounds.top - 250),
    maxY: Math.max(900, houseBounds.bottom + 500),
  }
}

export function getPlanContentBounds(
  houseBounds: HouseBounds,
  deckPoints: Point[]
): PlanContentBounds {
  const deckXs = deckPoints.map((point) => point.x)
  const deckYs = deckPoints.map((point) => point.y)

  return {
    left: Math.min(houseBounds.left, ...deckXs) - CONTENT_PADDING,
    right: Math.max(houseBounds.right, ...deckXs) + CONTENT_PADDING,
    top: Math.min(houseBounds.top, ...deckYs) - CONTENT_PADDING,
    bottom: Math.max(houseBounds.bottom, ...deckYs) + CONTENT_PADDING,
  }
}

export function getFitViewBox(
  houseBounds: HouseBounds,
  deckPoints: Point[],
  targetAspectRatio?: number
): ViewBox {
  const bounds = getPlanContentBounds(houseBounds, deckPoints)
  const contentWidth = bounds.right - bounds.left
  const contentHeight = bounds.bottom - bounds.top
  let width = Math.max(contentWidth, MIN_VIEW_BOX_WIDTH)
  let height = Math.max(contentHeight, MIN_VIEW_BOX_HEIGHT)

  if (targetAspectRatio && Number.isFinite(targetAspectRatio)) {
    const currentAspectRatio = width / height

    if (currentAspectRatio < targetAspectRatio) {
      width = height * targetAspectRatio
    } else {
      height = width / targetAspectRatio
    }
  }

  return {
    x: bounds.left - (width - contentWidth) / 2,
    y: bounds.top - (height - contentHeight) / 2,
    width,
    height,
  }
}

export function isContentInsideViewBox(
  contentBounds: PlanContentBounds,
  viewBox: ViewBox
): boolean {
  return (
    contentBounds.left >= viewBox.x &&
    contentBounds.right <= viewBox.x + viewBox.width &&
    contentBounds.top >= viewBox.y &&
    contentBounds.bottom <= viewBox.y + viewBox.height
  )
}

export function clampPanViewBox(
  viewBox: ViewBox,
  contentBounds: PlanContentBounds
): ViewBox {
  return {
    ...viewBox,
    x: clampViewBoxAxis(
      viewBox.x,
      contentBounds.left - PAN_PADDING,
      contentBounds.right + PAN_PADDING
    ),
    y: clampViewBoxAxis(
      viewBox.y,
      contentBounds.top - PAN_PADDING,
      contentBounds.bottom + PAN_PADDING
    ),
  }
}

function clampViewBoxAxis(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
