/* eslint-disable react/no-unknown-property */

import type { Plan3DModel, Plan3DSiteObject } from "@/lib/trall/plan-3d"
import { deckOverlayY } from "@/lib/trall/plan-3d-layers"

export function SiteObjects({ model }: { model: Plan3DModel }) {
  return (
    <>
      {model.siteObjects.map((object) => (
        <group
          key={object.id}
          position={[
            object.center.x,
            deckOverlayY(object.baseY),
            object.center.z,
          ]}
          rotation={[0, -object.rotationRad, 0]}
        >
          {object.kind === "tree" ? (
            <TreeObject object={object} />
          ) : object.kind === "bush" ? (
            <BushObject object={object} />
          ) : object.kind === "planter" ? (
            <PlanterObject object={object} />
          ) : (
            <OutdoorLightObject object={object} />
          )}
        </group>
      ))}
    </>
  )
}

function TreeObject({ object }: { object: Plan3DSiteObject }) {
  const height = object.sizeM
  const crownRadius = Math.max(0.28, object.sizeM * 0.28)

  return (
    <>
      <mesh castShadow position={[0, height * 0.22, 0]}>
        <cylinderGeometry args={[0.08, 0.12, height * 0.44, 8]} />
        <meshStandardMaterial color="#6f482a" roughness={0.82} />
      </mesh>
      <mesh castShadow position={[0, height * 0.62, 0]}>
        <sphereGeometry args={[crownRadius, 18, 12]} />
        <meshStandardMaterial color="#2f6b3a" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[-crownRadius * 0.42, height * 0.55, 0.04]}>
        <sphereGeometry args={[crownRadius * 0.78, 16, 10]} />
        <meshStandardMaterial color="#3f7b43" roughness={0.92} />
      </mesh>
      <mesh castShadow position={[crownRadius * 0.45, height * 0.58, -0.06]}>
        <sphereGeometry args={[crownRadius * 0.74, 16, 10]} />
        <meshStandardMaterial color="#346f3d" roughness={0.92} />
      </mesh>
    </>
  )
}

function BushObject({ object }: { object: Plan3DSiteObject }) {
  const radius = object.sizeM * 0.38
  const lobes = [
    { color: "#4f8a3b", position: [0, radius * 0.55, 0], size: radius },
    {
      color: "#5f9b45",
      position: [-radius * 0.55, radius * 0.42, 0.05],
      size: radius * 0.72,
    },
    {
      color: "#5f9b45",
      position: [radius * 0.5, radius * 0.45, -0.08],
      size: radius * 0.78,
    },
  ] as const

  return (
    <>
      {lobes.map((lobe, index) => (
        <mesh key={index} castShadow position={lobe.position}>
          <sphereGeometry args={[lobe.size, 16, 10]} />
          <meshStandardMaterial color={lobe.color} roughness={0.94} />
        </mesh>
      ))}
    </>
  )
}

function PlanterObject({ object }: { object: Plan3DSiteObject }) {
  const width = object.sizeM
  const depth = object.sizeM * 0.55

  return (
    <>
      <mesh castShadow receiveShadow position={[0, 0.18, 0]}>
        <boxGeometry args={[width, 0.36, depth]} />
        <meshStandardMaterial color="#8a6a45" roughness={0.84} />
      </mesh>
      <mesh position={[0, 0.39, 0]}>
        <boxGeometry args={[width * 0.86, 0.05, depth * 0.72]} />
        <meshStandardMaterial color="#3f2f23" roughness={0.95} />
      </mesh>
      {[-0.28, 0.22].map((offset, index) => (
        <mesh
          key={offset}
          castShadow
          position={[offset * width, 0.62, index === 0 ? -0.03 : 0.04]}
        >
          <sphereGeometry args={[object.sizeM * 0.22, 14, 8]} />
          <meshStandardMaterial color="#4f8c45" roughness={0.92} />
        </mesh>
      ))}
    </>
  )
}

function OutdoorLightObject({ object }: { object: Plan3DSiteObject }) {
  const height = object.sizeM

  return (
    <>
      <mesh castShadow position={[0, height * 0.45, 0]}>
        <cylinderGeometry args={[0.035, 0.045, height * 0.9, 10]} />
        <meshStandardMaterial
          color="#34383b"
          metalness={0.35}
          roughness={0.45}
        />
      </mesh>
      <mesh castShadow position={[0, height * 0.92, 0]}>
        <sphereGeometry args={[0.12, 16, 10]} />
        <meshStandardMaterial
          color="#fff1b8"
          emissive="#f6c85f"
          emissiveIntensity={0.9}
          roughness={0.34}
        />
      </mesh>
      <pointLight
        color="#ffe2a3"
        distance={3.2}
        intensity={0.55}
        position={[0, height * 0.95, 0]}
      />
    </>
  )
}
