import * as THREE from "three"

import { getTerrainHeightAt } from "@/lib/trall/elevation"
import type { Plan3DModel } from "@/lib/trall/plan-3d"

import { setPlanarUvAttribute } from "@/components/trall/plan-3d-view/geometry-utils"

export function createTerrainGeometry(model: Plan3DModel) {
  const bounds = model.elevation.terrainBounds
  const terrain = model.elevation.settings.terrain
  const corners = [
    { x: bounds.minX, z: bounds.minZ },
    { x: bounds.maxX, z: bounds.minZ },
    { x: bounds.maxX, z: bounds.maxZ },
    { x: bounds.minX, z: bounds.maxZ },
  ]
  const top = corners.map((point) => ({
    ...point,
    y: getTerrainHeightAt(point, terrain, bounds),
  }))
  const positions = [
    top[0]?.x ?? 0,
    top[0]?.y ?? 0,
    top[0]?.z ?? 0,
    top[1]?.x ?? 0,
    top[1]?.y ?? 0,
    top[1]?.z ?? 0,
    top[2]?.x ?? 0,
    top[2]?.y ?? 0,
    top[2]?.z ?? 0,
    top[0]?.x ?? 0,
    top[0]?.y ?? 0,
    top[0]?.z ?? 0,
    top[2]?.x ?? 0,
    top[2]?.y ?? 0,
    top[2]?.z ?? 0,
    top[3]?.x ?? 0,
    top[3]?.y ?? 0,
    top[3]?.z ?? 0,
  ]

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  )
  setPlanarUvAttribute(geometry)
  geometry.computeVertexNormals()

  return geometry
}
