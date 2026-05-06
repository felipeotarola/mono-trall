/* eslint-disable react/no-unknown-property */

import type { Plan3DModel } from "@/lib/trall/plan-3d"
import {
  PLAN_3D_LAYERS,
  terrainOverlayY,
} from "@/lib/trall/plan-3d-layers"

import type { SceneMaterials } from "@/components/trall/plan-3d-view/materials"

export function Stairs({
  materials,
  model,
}: {
  materials: SceneMaterials
  model: Plan3DModel
}) {
  return (
    <>
      {model.stairs.map((stairs) => {
        const stepCount = Math.max(1, stairs.stepCount)
        const stepDepth = stairs.depthM / stepCount
        const bottomY = terrainOverlayY(stairs.terrainY)
        const topY =
          model.elevation.deckFinishedY - PLAN_3D_LAYERS.coplanarClearanceM
        const effectiveHeight = Math.max(0.12, topY - bottomY)
        const stepRise = effectiveHeight / stepCount
        const treadThickness = Math.min(0.09, stepRise * 0.45)
        const stringerY = bottomY + effectiveHeight / 2
        const tangent = {
          x: Math.cos(stairs.angleY),
          z: Math.sin(stairs.angleY),
        }

        return (
          <group key={stairs.id}>
            {Array.from({ length: stepCount }, (_, index) => {
              const distance = stepDepth * (index + 0.5)
              const stepLevel = stepCount - index
              const treadY = bottomY + stepRise * stepLevel - treadThickness / 2
              const center = {
                x: stairs.anchor.x + stairs.normal.x * distance,
                z: stairs.anchor.z + stairs.normal.z * distance,
              }

              return (
                <group key={`${stairs.id}-step-${index}`}>
                  <mesh
                    castShadow
                    receiveShadow
                    position={[center.x, treadY, center.z]}
                    rotation={[0, -stairs.angleY, 0]}
                  >
                    <boxGeometry
                      args={[stairs.widthM, treadThickness, stepDepth * 0.96]}
                    />
                    <meshStandardMaterial
                      color={materials.stairColor}
                      roughness={0.82}
                    />
                  </mesh>
                  <mesh
                    castShadow
                    receiveShadow
                    position={[
                      stairs.anchor.x +
                        stairs.normal.x * (distance + stepDepth / 2),
                      bottomY + stepRise * (stepLevel - 0.5),
                      stairs.anchor.z +
                        stairs.normal.z * (distance + stepDepth / 2),
                    ]}
                    rotation={[0, -stairs.angleY, 0]}
                  >
                    <boxGeometry
                      args={[
                        stairs.widthM,
                        stepRise,
                        Math.min(0.06, stepDepth),
                      ]}
                    />
                    <meshStandardMaterial
                      color={materials.supportColor}
                      roughness={0.84}
                    />
                  </mesh>
                </group>
              )
            })}
            {[-1, 1].map((side) => {
              const sideOffset = side * (stairs.widthM / 2 - 0.04)
              const center = {
                x:
                  stairs.anchor.x +
                  stairs.normal.x * (stairs.depthM / 2) +
                  tangent.x * sideOffset,
                z:
                  stairs.anchor.z +
                  stairs.normal.z * (stairs.depthM / 2) +
                  tangent.z * sideOffset,
              }

              return (
                <mesh
                  key={`${stairs.id}-stringer-${side}`}
                  castShadow
                  receiveShadow
                  position={[center.x, stringerY, center.z]}
                  rotation={[0, -stairs.angleY, 0]}
                >
                  <boxGeometry
                    args={[
                      0.08,
                      Math.max(0.08, effectiveHeight),
                      stairs.depthM,
                    ]}
                  />
                  <meshStandardMaterial
                    color={materials.supportColor}
                    roughness={0.86}
                  />
                </mesh>
              )
            })}
          </group>
        )
      })}
    </>
  )
}
