import * as THREE from "three"

import type { Point3D } from "@/lib/trall/plan-3d"

import {
  addSlabSideFaces,
  setPlanarUvAttribute,
} from "@/components/trall/plan-3d-view/geometry-utils"

export function createPolygonSlabGeometry(
  points: Point3D[],
  thickness: number,
  holes: Point3D[][] = [],
  options: {
    includeHoleSideFaces?: boolean
  } = {}
) {
  const contour = points.map((point) => new THREE.Vector2(point.x, point.z))
  const holeContours = holes.map((hole) =>
    hole.map((point) => new THREE.Vector2(point.x, point.z))
  )
  const vertices = [...points, ...holes.flat()]
  const triangles = THREE.ShapeUtils.triangulateShape(contour, holeContours)
  const positions: number[] = []

  for (const triangle of triangles) {
    for (const index of triangle) {
      const point = vertices[index]
      if (point) {
        positions.push(point.x, 0, point.z)
      }
    }
  }

  for (const triangle of triangles) {
    for (const index of [...triangle].reverse()) {
      const point = vertices[index]
      if (point) {
        positions.push(point.x, -thickness, point.z)
      }
    }
  }

  addSlabSideFaces(positions, points, thickness)
  if (options.includeHoleSideFaces !== false) {
    holes.forEach((hole) => addSlabSideFaces(positions, hole, thickness))
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

export function createPoolBodyGeometry(points: Point3D[], depthM: number) {
  const contour = points.map((point) => new THREE.Vector2(point.x, point.z))
  const triangles = THREE.ShapeUtils.triangulateShape(contour, [])
  const positions: number[] = []

  for (const triangle of triangles) {
    for (const index of [...triangle].reverse()) {
      const point = points[index]
      if (point) {
        positions.push(point.x, -depthM, point.z)
      }
    }
  }

  addSlabSideFaces(positions, points, depthM)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  )
  geometry.computeVertexNormals()

  return geometry
}

export function createFlatPolygonGeometry(points: Point3D[]) {
  const contour = points.map((point) => new THREE.Vector2(point.x, point.z))
  const triangles = THREE.ShapeUtils.triangulateShape(contour, [])
  const positions: number[] = []

  for (const triangle of triangles) {
    for (const index of triangle) {
      const point = points[index]
      if (point) {
        positions.push(point.x, 0, point.z)
      }
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  )
  geometry.computeVertexNormals()

  return geometry
}
