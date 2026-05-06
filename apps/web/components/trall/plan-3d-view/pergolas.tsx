/* eslint-disable react/no-unknown-property */

import type { Plan3DModel } from "@/lib/trall/plan-3d"
import { deckAccessoryBaseY } from "@/lib/trall/plan-3d-layers"

import type { SceneMaterials } from "@/components/trall/plan-3d-view/materials"

export function Pergolas({
  materials,
  model,
}: {
  materials: SceneMaterials
  model: Plan3DModel
}) {
  const baseY = deckAccessoryBaseY(model.elevation.deckFinishedY)

  return (
    <>
      {model.pergolas.map((pergola) => {
        const x = pergola.widthM / 2
        const z = pergola.depthM / 2
        const postPositions = [
          [-x, -z],
          [x, -z],
          [x, z],
          [-x, z],
        ]

        return (
          <group
            key={pergola.id}
            position={[pergola.center.x, baseY, pergola.center.z]}
            rotation={[0, -pergola.rotationRad, 0]}
          >
            {postPositions.map(([postX, postZ], index) => (
              <mesh
                key={`${pergola.id}-post-${index}`}
                castShadow
                position={[postX ?? 0, 1.15, postZ ?? 0]}
              >
                <boxGeometry args={[0.12, 2.3, 0.12]} />
                <meshStandardMaterial
                  color={materials.supportColor}
                  roughness={0.78}
                />
              </mesh>
            ))}
            <mesh castShadow position={[0, 2.35, -z]}>
              <boxGeometry args={[pergola.widthM + 0.18, 0.12, 0.16]} />
              <meshStandardMaterial
                color={materials.supportColor}
                roughness={0.74}
              />
            </mesh>
            <mesh castShadow position={[0, 2.35, z]}>
              <boxGeometry args={[pergola.widthM + 0.18, 0.12, 0.16]} />
              <meshStandardMaterial
                color={materials.supportColor}
                roughness={0.74}
              />
            </mesh>
            {[-0.36, 0, 0.36].map((offset) => (
              <mesh
                key={`${pergola.id}-beam-${offset}`}
                castShadow
                position={[offset * pergola.widthM, 2.52, 0]}
              >
                <boxGeometry args={[0.1, 0.1, pergola.depthM + 0.36]} />
                <meshStandardMaterial
                  color={materials.deckColor}
                  roughness={0.74}
                />
              </mesh>
            ))}
          </group>
        )
      })}
    </>
  )
}
