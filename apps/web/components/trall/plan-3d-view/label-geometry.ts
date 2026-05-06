import {
  getTerrainHeightAt,
  mToCm,
} from "@/lib/trall/elevation"
import type { Plan3DModel, Point3D } from "@/lib/trall/plan-3d"

export function getMidpoint(a: Point3D, b: Point3D) {
  return {
    x: (a.x + b.x) / 2,
    z: (a.z + b.z) / 2,
  }
}

export function getLabelPoint(points: Point3D[]) {
  const total = points.reduce(
    (sum, point) => ({
      x: sum.x + point.x,
      z: sum.z + point.z,
    }),
    { x: 0, z: 0 }
  )
  const count = Math.max(1, points.length)

  return {
    x: total.x / count,
    z: total.z / count,
  }
}

export function getGroundLabelPoint(model: Plan3DModel) {
  const bounds = model.elevation.terrainBounds
  const angleRad =
    (model.elevation.settings.terrain.slopeDirectionDeg * Math.PI) / 180
  const direction = {
    x: Math.sin(angleRad),
    z: Math.cos(angleRad),
  }
  const corners = [
    { x: bounds.minX + 0.7, z: bounds.minZ + 0.7 },
    { x: bounds.maxX - 0.7, z: bounds.minZ + 0.7 },
    { x: bounds.maxX - 0.7, z: bounds.maxZ - 0.7 },
    { x: bounds.minX + 0.7, z: bounds.maxZ - 0.7 },
  ]
  const point = corners.reduce((best, candidate) =>
    candidate.x * direction.x + candidate.z * direction.z >
    best.x * direction.x + best.z * direction.z
      ? candidate
      : best
  )

  return {
    ...point,
    y: getTerrainHeightAt(
      point,
      model.elevation.settings.terrain,
      model.elevation.terrainBounds
    ),
  }
}

export function formatHeightCm(valueM: number) {
  const valueCm = Math.round(mToCm(valueM))

  return `${valueCm > 0 ? "+" : ""}${valueCm} cm`
}
