import type { HouseModel, Material, Point, ViewBox } from "./types"

export const PIXELS_PER_METER = 40
export const GRID_SIZE_PX = PIXELS_PER_METER / 2
export const SNAP_THRESHOLD_PX = 14
export const ANGLE_SNAP_DEGREES = [0, 45, 90, 135, 180, 225, 270, 315]
export const ANGLE_SNAP_THRESHOLD_DEG = 6
export const PARALLEL_HINT_THRESHOLD_DEG = 4

export const POINT_BOUNDS = {
  minX: 80,
  maxX: 1080,
  minY: 120,
  maxY: 760,
}

export const INITIAL_VIEW_BOX: ViewBox = {
  x: 80,
  y: 16,
  width: 1000,
  height: 744,
}

export const PAN_BOUNDS = {
  minX: -300,
  maxX: 600,
  minY: -250,
  maxY: 350,
}

export const baseMaterials: Material[] = [
  { label: "Joists", value: "94 lm", detail: "45 × 145 mm" },
  { label: "Post anchors", value: "12 pcs", detail: "Galvanized" },
  { label: "Deck screws", value: "1,250 pcs", detail: "A4 stainless" },
]

export const initialDeckPoints: [Point, Point, Point, Point] = [
  { x: 184, y: 364 },
  { x: 680, y: 364 },
  { x: 742, y: 558 },
  { x: 175, y: 602 },
]

export const initialHouse: HouseModel = {
  centerX: 456,
  topY: 116,
  widthM: 10.5,
  depthM: 6,
}
