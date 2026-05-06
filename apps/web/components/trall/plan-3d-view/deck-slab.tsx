/* eslint-disable react/no-unknown-property */

import { useMemo } from "react"
import * as THREE from "three"

import type { Plan3DModel } from "@/lib/trall/plan-3d"

import { createPolygonSlabGeometry } from "@/components/trall/plan-3d-view/geometry"
import type {
  SceneMaterials,
  SceneTextureMaps,
} from "@/components/trall/plan-3d-view/materials"

export function DeckSlab({
  materials,
  model,
  textureMaps,
}: {
  materials: SceneMaterials
  model: Plan3DModel
  textureMaps: SceneTextureMaps
}) {
  const geometry = useMemo(
    () =>
      createPolygonSlabGeometry(
        model.deckPoints,
        model.elevation.deckThicknessM,
        model.poolPoints ? [model.poolPoints] : [],
        { includeHoleSideFaces: false }
      ),
    [model.deckPoints, model.elevation.deckThicknessM, model.poolPoints]
  )

  return (
    <mesh
      castShadow
      receiveShadow
      geometry={geometry}
      position={[0, model.elevation.deckFinishedY, 0]}
    >
      <meshStandardMaterial
        color={textureMaps.deck ? "#ffffff" : materials.deckColor}
        map={textureMaps.deck}
        roughness={materials.deckRoughness}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
