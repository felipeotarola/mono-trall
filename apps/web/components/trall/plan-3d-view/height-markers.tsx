/* eslint-disable react/no-unknown-property */

import { useMemo } from "react"
import { Html } from "@react-three/drei"
import * as THREE from "three"

import {
  getTerrainHeightAt,
} from "@/lib/trall/elevation"
import type { Plan3DModel, Point3D } from "@/lib/trall/plan-3d"
import { PLAN_3D_LAYERS } from "@/lib/trall/plan-3d-layers"

import {
  formatHeightCm,
  getGroundLabelPoint,
  getLabelPoint,
} from "@/components/trall/plan-3d-view/geometry"

export function HeightMarkers({ model }: { model: Plan3DModel }) {
  const deckPoint = getLabelPoint(model.deckPoints)
  const poolPoint = model.poolPoints ? getLabelPoint(model.poolPoints) : null
  const groundPoint = getGroundLabelPoint(model)

  return (
    <>
      <HeightMarker
        baseY={getTerrainHeightAt(
          deckPoint,
          model.elevation.settings.terrain,
          model.elevation.terrainBounds
        )}
        color="#6f4b2f"
        label={`Deck ${formatHeightCm(model.elevation.deckFinishedY)}`}
        point={deckPoint}
        y={model.elevation.deckFinishedY + PLAN_3D_LAYERS.labelLiftM}
      />
      {poolPoint ? (
        <HeightMarker
          baseY={model.elevation.poolTopY - model.elevation.poolBodyHeightM}
          color="#1d79b7"
          label={`Pool top ${formatHeightCm(model.elevation.poolTopY)}`}
          point={poolPoint}
          y={model.elevation.poolTopY + PLAN_3D_LAYERS.labelLiftM}
        />
      ) : null}
      <HeightMarker
        baseY={groundPoint.y - 0.22}
        color="#645846"
        label={`Ground ${formatHeightCm(groundPoint.y)}`}
        point={groundPoint}
        y={groundPoint.y + PLAN_3D_LAYERS.labelLiftM}
      />
    </>
  )
}

function HeightMarker({
  baseY,
  color,
  label,
  point,
  y,
}: {
  baseY: number
  color: string
  label: string
  point: Point3D
  y: number
}) {
  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [point.x, baseY, point.z, point.x, y, point.z],
        3
      )
    )

    return geometry
  }, [baseY, point, y])

  return (
    <group>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color={color} transparent opacity={0.72} />
      </lineSegments>
      <mesh position={[point.x, y, point.z]}>
        <sphereGeometry args={[0.055, 14, 10]} />
        <meshStandardMaterial color={color} roughness={0.42} />
      </mesh>
      <Html
        center
        distanceFactor={5}
        position={[point.x, y + 0.22, point.z]}
        style={{ pointerEvents: "none" }}
        zIndexRange={[20, 0]}
      >
        <span
          className="rounded border border-stone-300 bg-white/95 px-2.5 py-1 text-xs font-semibold text-stone-800 shadow-sm"
          style={{ whiteSpace: "nowrap" }}
        >
          {label}
        </span>
      </Html>
    </group>
  )
}
