/* eslint-disable react/no-unknown-property */

import { useMemo } from "react"
import * as THREE from "three"

import type { Plan3DModel } from "@/lib/trall/plan-3d"

import {
  createPoolExcavationGeometry,
  createPoolExcavationRimGeometry,
} from "@/components/trall/plan-3d-view/geometry"
import type { SceneMaterials } from "@/components/trall/plan-3d-view/materials"

export function PoolExcavation({
  materials,
  model,
}: {
  materials: SceneMaterials
  model: Plan3DModel
}) {
  const geometry = useMemo(() => createPoolExcavationGeometry(model), [model])
  const rimGeometry = useMemo(
    () => createPoolExcavationRimGeometry(model),
    [model]
  )

  if (!geometry || !rimGeometry) {
    return null
  }

  return (
    <>
      <mesh receiveShadow geometry={geometry}>
        <meshStandardMaterial
          color={materials.excavationColor}
          polygonOffset
          polygonOffsetFactor={-1}
          roughness={0.98}
          side={THREE.DoubleSide}
        />
      </mesh>
      <lineSegments geometry={rimGeometry}>
        <lineBasicMaterial
          color={materials.excavationRimColor}
          transparent
          opacity={0.86}
        />
      </lineSegments>
    </>
  )
}
