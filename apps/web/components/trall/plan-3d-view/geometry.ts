import * as THREE from "three"

import {
  getTerrainHeightAt,
  mToCm,
} from "@/lib/trall/elevation"
import type { Plan3DLine, Plan3DModel, Point3D } from "@/lib/trall/plan-3d"
import {
  PLAN_3D_LAYERS,
  terrainOverlayY,
} from "@/lib/trall/plan-3d-layers"

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

export function validatePlan3DPlacement(model: Plan3DModel) {
  if (
    typeof window === "undefined" ||
    !["localhost", "127.0.0.1"].includes(window.location.hostname)
  ) {
    return
  }

  const deckTopY = model.elevation.deckFinishedY
  const deckBottomY = deckTopY - model.elevation.deckThicknessM
  const warnings: string[] = []

  for (const post of model.supportPosts) {
    if (post.terrainY >= post.deckBottomY - PLAN_3D_LAYERS.renderEpsilonM) {
      warnings.push(`support ${post.id} has no clearance below deck`)
    }
  }

  for (const stairs of model.stairs) {
    if (stairs.totalHeightM <= PLAN_3D_LAYERS.surfaceLiftM) {
      warnings.push(`stairs ${stairs.id} has near-zero height`)
    }
  }

  for (const point of model.deckPoints) {
    const terrainY = getTerrainHeightAt(
      point,
      model.elevation.settings.terrain,
      model.elevation.terrainBounds
    )
    if (terrainY > deckBottomY - PLAN_3D_LAYERS.surfaceLiftM) {
      warnings.push("terrain is close to or above deck underside")
      break
    }
  }

  if (warnings.length > 0) {
    console.warn("[Plan3D placement]", [...new Set(warnings)])
  }
}

function addSlabSideFaces(
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

function setPlanarUvAttribute(geometry: THREE.BufferGeometry) {
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

function offsetFromCenter(point: Point3D, center: Point3D, distance: number) {
  const x = point.x - center.x
  const z = point.z - center.z
  const length = Math.hypot(x, z) || 1

  return {
    x: point.x + (x / length) * distance,
    z: point.z + (z / length) * distance,
  }
}
