import * as THREE from "three"

import type { Point3D } from "@/lib/trall/plan-3d"

export function addSlabSideFaces(
  positions: number[],
  points: Point3D[],
  thickness: number
) {
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length]
    if (!next) {
      return
    }

    positions.push(
      point.x,
      0,
      point.z,
      next.x,
      0,
      next.z,
      next.x,
      -thickness,
      next.z,
      point.x,
      0,
      point.z,
      next.x,
      -thickness,
      next.z,
      point.x,
      -thickness,
      point.z
    )
  })
}

export function setPlanarUvAttribute(geometry: THREE.BufferGeometry) {
  const position = geometry.getAttribute("position")
  const uvs: number[] = []
  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minZ = Number.POSITIVE_INFINITY
  let maxZ = Number.NEGATIVE_INFINITY

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index)
    const z = position.getZ(index)
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minZ = Math.min(minZ, z)
    maxZ = Math.max(maxZ, z)
  }

  const width = maxX - minX || 1
  const depth = maxZ - minZ || 1

  for (let index = 0; index < position.count; index += 1) {
    uvs.push(
      (position.getX(index) - minX) / width,
      (position.getZ(index) - minZ) / depth
    )
  }

  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
}

export function offsetFromCenter(
  point: Point3D,
  center: Point3D,
  distance: number
) {
  const x = point.x - center.x
  const z = point.z - center.z
  const length = Math.hypot(x, z) || 1

  return {
    x: point.x + (x / length) * distance,
    z: point.z + (z / length) * distance,
  }
}
