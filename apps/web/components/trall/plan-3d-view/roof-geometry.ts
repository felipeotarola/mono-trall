import * as THREE from "three"

import type { Plan3DModel } from "@/lib/trall/plan-3d"

export type HouseRoofDimensions = {
  gableAngleRad: number
  gableRise: number
  halfDepth: number
  halfWidth: number
  rafterLength: number
  shedAngleRad: number
  shedRise: number
  slopeLength: number
  thickness: number
}

export type RoofTileRow = {
  args: [number, number, number]
  id: string
  position: [number, number, number]
  rotation: [number, number, number]
  shadowArgs: [number, number, number]
  shadowPosition: [number, number, number]
}

export function createHouseRoofGeometry({
  depthM,
  roofStyle,
  widthM,
}: {
  depthM: number
  roofStyle: Plan3DModel["house"]["roofStyle"]
  widthM: number
}) {
  const dimensions = getHouseRoofDimensions(widthM, depthM)

  if (roofStyle === "shed") {
    return createShedRoofGeometry(dimensions)
  }

  if (roofStyle === "flat") {
    return new THREE.BoxGeometry(
      dimensions.halfWidth * 2,
      dimensions.thickness,
      dimensions.halfDepth * 2
    )
      .translate(0, dimensions.thickness / 2, 0)
      .toNonIndexed()
  }

  return createGableRoofGeometry(dimensions)
}

export function getHouseRoofDimensions(
  widthM: number,
  depthM: number
): HouseRoofDimensions {
  const halfWidth = widthM / 2 + 0.26
  const halfDepth = depthM / 2 + 0.24
  const gableRise = Math.min(2.2, Math.max(0.9, widthM * 0.18))
  const shedRise = Math.min(1.8, Math.max(0.85, depthM * 0.22))
  const rafterLength = Math.hypot(halfWidth, gableRise)
  const slopeLength = Math.hypot(halfDepth * 2, shedRise)

  return {
    gableAngleRad: Math.atan2(gableRise, halfWidth),
    gableRise,
    halfDepth,
    halfWidth,
    rafterLength,
    shedAngleRad: Math.atan2(shedRise, halfDepth * 2),
    shedRise,
    slopeLength,
    thickness: 0.16,
  }
}

export function getRoofTileRows(
  dimensions: HouseRoofDimensions,
  roofStyle: Plan3DModel["house"]["roofStyle"]
): RoofTileRow[] {
  if (roofStyle === "shed") {
    return getShedRoofTileRows(dimensions)
  }

  if (roofStyle === "gable") {
    return getGableRoofTileRows(dimensions)
  }

  return []
}

function createGableRoofGeometry(dimensions: HouseRoofDimensions) {
  const { gableRise, halfDepth, halfWidth } = dimensions
  const eaveY = -0.04
  const undersideY = -dimensions.thickness
  const vertices = new Float32Array([
    -halfWidth,
    eaveY,
    halfDepth,
    halfWidth,
    eaveY,
    halfDepth,
    0,
    gableRise,
    halfDepth,
    -halfWidth,
    eaveY,
    -halfDepth,
    halfWidth,
    eaveY,
    -halfDepth,
    0,
    gableRise,
    -halfDepth,
    -halfWidth,
    undersideY,
    halfDepth,
    halfWidth,
    undersideY,
    halfDepth,
    -halfWidth,
    undersideY,
    -halfDepth,
    halfWidth,
    undersideY,
    -halfDepth,
  ])
  const indices = [
    0, 2, 5, 0, 5, 3, 2, 1, 4, 2, 4, 5, 0, 1, 2, 3, 5, 4, 6, 8, 9, 6, 9, 7, 0,
    6, 7, 0, 7, 1, 3, 4, 9, 3, 9, 8, 0, 3, 8, 0, 8, 6, 1, 7, 9, 1, 9, 4,
  ]

  return createIndexedGeometry(vertices, indices)
}

function createShedRoofGeometry(dimensions: HouseRoofDimensions) {
  const { halfDepth, halfWidth, shedRise, thickness } = dimensions
  const vertices = new Float32Array([
    -halfWidth,
    0,
    halfDepth,
    halfWidth,
    0,
    halfDepth,
    halfWidth,
    shedRise,
    -halfDepth,
    -halfWidth,
    shedRise,
    -halfDepth,
    -halfWidth,
    thickness,
    halfDepth,
    halfWidth,
    thickness,
    halfDepth,
    halfWidth,
    shedRise + thickness,
    -halfDepth,
    -halfWidth,
    shedRise + thickness,
    -halfDepth,
  ])
  const indices = [
    4, 5, 6, 4, 6, 7, 0, 3, 2, 0, 2, 1, 0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5, 3,
    7, 6, 3, 6, 2, 0, 1, 5, 0, 5, 4,
  ]

  return createIndexedGeometry(vertices, indices)
}

function createIndexedGeometry(vertices: Float32Array, indices: number[]) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}

function getGableRoofTileRows(dimensions: HouseRoofDimensions): RoofTileRow[] {
  const rows: RoofTileRow[] = []
  const rowCount = Math.max(
    5,
    Math.min(11, Math.floor(dimensions.halfWidth / 0.42))
  )
  const depth = dimensions.halfDepth * 2 - 0.28
  const rowWidth = 0.055

  for (let index = 1; index <= rowCount; index += 1) {
    const t = index / (rowCount + 1)
    const leftX = -dimensions.halfWidth + dimensions.halfWidth * t
    const rightX = dimensions.halfWidth - dimensions.halfWidth * t
    const y = dimensions.gableRise * t + 0.075

    rows.push({
      args: [rowWidth, 0.035, depth],
      id: `gable-left-${index}`,
      position: [leftX, y, 0],
      rotation: [0, 0, dimensions.gableAngleRad],
      shadowArgs: [0.018, 0.018, depth],
      shadowPosition: [0.048, -0.035, 0],
    })
    rows.push({
      args: [rowWidth, 0.035, depth],
      id: `gable-right-${index}`,
      position: [rightX, y, 0],
      rotation: [0, 0, -dimensions.gableAngleRad],
      shadowArgs: [0.018, 0.018, depth],
      shadowPosition: [-0.048, -0.035, 0],
    })
  }

  return rows
}

function getShedRoofTileRows(dimensions: HouseRoofDimensions): RoofTileRow[] {
  const rows: RoofTileRow[] = []
  const rowCount = Math.max(
    6,
    Math.min(14, Math.floor(dimensions.slopeLength / 0.42))
  )
  const width = dimensions.halfWidth * 2 - 0.32
  const rowDepth = 0.055

  for (let index = 1; index <= rowCount; index += 1) {
    const t = index / (rowCount + 1)
    const z = dimensions.halfDepth - dimensions.halfDepth * 2 * t
    const y = dimensions.shedRise * t + dimensions.thickness + 0.07

    rows.push({
      args: [width, 0.035, rowDepth],
      id: `shed-${index}`,
      position: [0, y, z],
      rotation: [dimensions.shedAngleRad, 0, 0],
      shadowArgs: [width, 0.014, 0.018],
      shadowPosition: [0, -0.035, 0.046],
    })
  }

  return rows
}
