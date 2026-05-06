import * as THREE from "three"

import { getTerrainHeightAt } from "@/lib/trall/elevation"
import type { Plan3DModel } from "@/lib/trall/plan-3d"
import {
  PLAN_3D_LAYERS,
  terrainOverlayY,
} from "@/lib/trall/plan-3d-layers"

import {
  offsetFromCenter,
  setPlanarUvAttribute,
} from "@/components/trall/plan-3d-view/geometry-utils"
import { getLabelPoint } from "@/components/trall/plan-3d-view/label-geometry"

export function createPoolExcavationGeometry(model: Plan3DModel) {
  const points = model.poolPoints
  if (!points || points.length < 3) {
    return null
  }

  const terrain = model.elevation.settings.terrain
  const terrainBounds = model.elevation.terrainBounds
  const poolBottomY =
    model.elevation.poolTopY -
    model.elevation.poolBodyHeightM -
    PLAN_3D_LAYERS.surfaceLiftM
  const center = getLabelPoint(points)
  const positions: number[] = []

  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length]
    if (!next) {
      return
    }

    const start = offsetFromCenter(point, center, 0.045)
    const end = offsetFromCenter(next, center, 0.045)
    const startTerrainY = getTerrainHeightAt(start, terrain, terrainBounds)
    const endTerrainY = getTerrainHeightAt(end, terrain, terrainBounds)

    if (
      startTerrainY <= poolBottomY + 0.05 &&
      endTerrainY <= poolBottomY + 0.05
    ) {
      return
    }

    positions.push(
      start.x,
      terrainOverlayY(startTerrainY),
      start.z,
      end.x,
      terrainOverlayY(endTerrainY),
      end.z,
      end.x,
      poolBottomY,
      end.z,
      start.x,
      terrainOverlayY(startTerrainY),
      start.z,
      end.x,
      poolBottomY,
      end.z,
      start.x,
      poolBottomY,
      start.z
    )
  })

  if (positions.length === 0) {
    return null
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  )
  setPlanarUvAttribute(geometry)
  geometry.computeVertexNormals()

  return geometry
}

export function createPoolExcavationRimGeometry(model: Plan3DModel) {
  const points = model.poolPoints
  if (!points || points.length < 3) {
    return null
  }

  const center = getLabelPoint(points)
  const terrain = model.elevation.settings.terrain
  const terrainBounds = model.elevation.terrainBounds
  const positions: number[] = []

  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length]
    if (!next) {
      return
    }

    const start = offsetFromCenter(point, center, 0.07)
    const end = offsetFromCenter(next, center, 0.07)

    positions.push(
      start.x,
      getTerrainHeightAt(start, terrain, terrainBounds) +
        PLAN_3D_LAYERS.lineLiftM,
      start.z,
      end.x,
      getTerrainHeightAt(end, terrain, terrainBounds) +
        PLAN_3D_LAYERS.lineLiftM,
      end.z
    )
  })

  if (positions.length === 0) {
    return null
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  )

  return geometry
}
