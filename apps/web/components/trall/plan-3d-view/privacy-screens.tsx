/* eslint-disable react/no-unknown-property */

import type { Plan3DModel } from "@/lib/trall/plan-3d"
import { deckAccessoryBaseY } from "@/lib/trall/plan-3d-layers"

import { getMidpoint } from "@/components/trall/plan-3d-view/geometry"

export function PrivacyScreens({ model }: { model: Plan3DModel }) {
  const baseY = deckAccessoryBaseY(model.elevation.deckFinishedY)

  return (
    <>
      {model.privacyScreens.map((screen) => {
        const mid = getMidpoint(screen.start, screen.end)
        const color =
          screen.style === "greenery"
            ? "#5f7a48"
            : screen.style === "solid"
              ? "#816447"
              : "#8c6b48"
        const slatCount =
          screen.style === "slatted"
            ? Math.max(3, Math.floor(screen.lengthM / 0.22))
            : 1

        return (
          <group key={screen.id}>
            {screen.style === "slatted" ? (
              Array.from({ length: slatCount }, (_, index) => {
                const t = slatCount === 1 ? 0.5 : index / (slatCount - 1)
                const point = {
                  x: screen.start.x + (screen.end.x - screen.start.x) * t,
                  z: screen.start.z + (screen.end.z - screen.start.z) * t,
                }

                return (
                  <mesh
                    key={`${screen.id}-slat-${index}`}
                    castShadow
                    position={[point.x, baseY + screen.heightM / 2, point.z]}
                    rotation={[0, -screen.angleY, 0]}
                  >
                    <boxGeometry args={[0.06, screen.heightM, 0.08]} />
                    <meshStandardMaterial color={color} roughness={0.76} />
                  </mesh>
                )
              })
            ) : (
              <mesh
                castShadow
                position={[mid.x, baseY + screen.heightM / 2, mid.z]}
                rotation={[0, -screen.angleY, 0]}
              >
                <boxGeometry args={[screen.lengthM, screen.heightM, 0.08]} />
                <meshStandardMaterial color={color} roughness={0.78} />
              </mesh>
            )}
          </group>
        )
      })}
    </>
  )
}
