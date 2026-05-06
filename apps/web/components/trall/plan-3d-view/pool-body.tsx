/* eslint-disable react/no-unknown-property */

import { useMemo } from "react"
import * as THREE from "three"

import type { Plan3DModel } from "@/lib/trall/plan-3d"
import { PLAN_3D_LAYERS } from "@/lib/trall/plan-3d-layers"

import {
  createFlatPolygonGeometry,
  createLineLoopGeometry,
  createPoolBodyGeometry,
} from "@/components/trall/plan-3d-view/geometry"
import type {
  SceneMaterials,
  SceneTextureMaps,
} from "@/components/trall/plan-3d-view/materials"

export function PoolBody({
  materials,
  model,
  textureMaps,
}: {
  materials: SceneMaterials
  model: Plan3DModel
  textureMaps: SceneTextureMaps
}) {
  const points = model.poolPoints
  const geometry = useMemo(
    () =>
      points
        ? createPoolBodyGeometry(points, model.elevation.poolBodyHeightM)
        : null,
    [model.elevation.poolBodyHeightM, points]
  )
  const waterGeometry = useMemo(
    () => (points ? createFlatPolygonGeometry(points) : null),
    [points]
  )
  const poolBorderY = model.elevation.poolTopY + PLAN_3D_LAYERS.trimLiftM
  const borderGeometry = useMemo(
    () => (points ? createLineLoopGeometry(points, poolBorderY) : null),
    [points, poolBorderY]
  )

  if (!geometry || !waterGeometry || !borderGeometry) {
    return null
  }

  return (
    <group position={[0, model.elevation.poolTopY, 0]}>
      <mesh castShadow receiveShadow geometry={geometry}>
        <meshStandardMaterial
          color={textureMaps.poolWall ? "#ffffff" : materials.poolWallColor}
          map={textureMaps.poolWall}
          roughness={0.72}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh
        geometry={waterGeometry}
        position={[0, -PLAN_3D_LAYERS.waterBelowPoolTopM, 0]}
      >
        <meshStandardMaterial
          color={materials.poolWaterColor}
          metalness={0.05}
          roughness={0.24}
          side={THREE.DoubleSide}
          transparent
          opacity={0.88}
        />
      </mesh>
      <lineSegments
        geometry={borderGeometry}
        position={[0, -model.elevation.poolTopY, 0]}
        renderOrder={2}
      >
        <lineBasicMaterial color={materials.poolBorderColor} linewidth={1} />
      </lineSegments>
    </group>
  )
}
