import type { HouseModel, Material, Point, ViewBox } from "./types"

export const PIXELS_PER_METER = 40
export const GRID_SIZE_PX = PIXELS_PER_METER / 2
export const SNAP_THRESHOLD_PX = 14
export const ANGLE_SNAP_DEGREES = [0, 45, 90, 135, 180, 225, 270, 315]
export const ANGLE_SNAP_THRESHOLD_DEG = 6
export const PARALLEL_HINT_THRESHOLD_DEG = 4
export const MIN_ZOOM_VIEWBOX_WIDTH = 350
export const MAX_ZOOM_VIEWBOX_WIDTH = 2200
export const ZOOM_STEP = 0.85

export const INITIAL_VIEW_BOX: ViewBox = {
  x: 80,
  y: 16,
  width: 1000,
  height: 744,
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

export const initialPoolPoints: [Point, Point, Point, Point] = [
  { x: 360, y: 430 },
  { x: 520, y: 430 },
  { x: 520, y: 510 },
  { x: 360, y: 510 },
]

export const initialHouse: HouseModel = {
  centerX: 456,
  doorOffsetM: 0,
  doors: [{ id: "door-1", offsetM: 0, widthCm: 90, heightCm: 210 }],
  roofStyle: "gable",
  windows: [
    {
      id: "window-1",
      offsetM: -3.2,
      row: "upper",
      widthCm: 120,
      heightCm: 120,
    },
    {
      id: "window-2",
      offsetM: 3.2,
      row: "upper",
      widthCm: 120,
      heightCm: 120,
    },
    {
      id: "window-3",
      offsetM: -3.2,
      row: "lower",
      widthCm: 120,
      heightCm: 120,
    },
    {
      id: "window-4",
      offsetM: 3.2,
      row: "lower",
      widthCm: 120,
      heightCm: 120,
    },
  ],
  topY: 116,
  widthM: 10.5,
  depthM: 6,
}
