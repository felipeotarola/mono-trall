import type { ReactNode } from "react"

export type Tool = {
  label: string
  icon: ReactNode
  active?: boolean
  onClick?: () => void
}

export type Point = {
  x: number
  y: number
}

export type MeasurementLine = {
  id: string
  start: Point
  end: Point
}

export type SnapType = "none" | "grid" | "house" | "angle"

export type ActiveTool = "select" | "draw" | "measure" | "pan"

export type PlannerViewMode = "top" | "3d"

export type ViewBox = {
  x: number
  y: number
  width: number
  height: number
}

export type PointBounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export type PlanContentBounds = {
  left: number
  right: number
  top: number
  bottom: number
}

export type AttachedEdge = {
  edgeIndex: number
  attached: boolean
}

export type EditableDimension = {
  edgeIndex: number
  value: string
}

export type HouseModel = {
  centerX: number
  doorOffsetM?: number
  doors?: HouseDoor[]
  windows?: HouseWindow[]
  topY: number
  widthM: number
  depthM: number
}

export type HouseDoor = {
  id: string
  offsetM: number
  widthCm?: number
  heightCm?: number
}

export type HouseWindow = {
  id: string
  offsetM: number
  row: "upper" | "lower"
  widthCm?: number
  heightCm?: number
}

export type HouseBounds = {
  left: number
  right: number
  top: number
  bottom: number
  centerX: number
  widthPx: number
  depthPx: number
}

export type Metric = {
  label: string
  value: string
}

export type Material = {
  label: string
  value: string
  detail: string
}
