/* eslint-disable react/no-unknown-property */

import { useMemo } from "react"
import * as THREE from "three"

import type { Plan3DModel } from "@/lib/trall/plan-3d"

import { createTerrainGeometry } from "@/components/trall/plan-3d-view/geometry"
import type {
  SceneMaterials,
  SceneTextureMaps,
} from "@/components/trall/plan-3d-view/materials"

export function TerrainMesh({
  materials,
  model,
  textureMaps,
}: {
  materials: SceneMaterials
  model: Plan3DModel
  textureMaps: SceneTextureMaps
}) {
  const geometry = useMemo(() => createTerrainGeometry(model), [model])

  return (
    <mesh receiveShadow geometry={geometry}>
      <meshStandardMaterial
        color={textureMaps.terrain ? "#ffffff" : materials.terrainColor}
        map={textureMaps.terrain}
        roughness={materials.terrainRoughness}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
