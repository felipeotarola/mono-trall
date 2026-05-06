import * as THREE from "three"

import type { Plan3DLine, Point3D } from "@/lib/trall/plan-3d"

export function createLineSegmentsGeometry(lines: Plan3DLine[], y: number) {
  const positions = lines.flatMap((line) => [
    line.start.x,
    y,
    line.start.z,
    line.end.x,
    y,
    line.end.z,
  ])
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  )

  return geometry
}

export function createLineLoopGeometry(points: Point3D[], y: number) {
  const positions: number[] = []

  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length]
    if (next) {
      positions.push(point.x, y, point.z, next.x, y, next.z)
    }
  })

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  )

  return geometry
}
