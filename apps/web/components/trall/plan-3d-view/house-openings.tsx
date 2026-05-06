/* eslint-disable react/no-unknown-property */

import type { Plan3DModel } from "@/lib/trall/plan-3d"
import { PLAN_3D_LAYERS } from "@/lib/trall/plan-3d-layers"

export function HouseDoor3D({
  door,
  frontZ,
}: {
  door: Plan3DModel["house"]["doors"][number]
  frontZ: number
}) {
  return (
    <group position={[door.centerX, door.heightM / 2, frontZ]}>
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[door.widthM, door.heightM, 0.04]} />
        <meshStandardMaterial color="#7a5534" roughness={0.68} />
      </mesh>
      <mesh position={[0, door.heightM / 2 + 0.035, 0.018]}>
        <boxGeometry args={[door.widthM + 0.16, 0.07, 0.055]} />
        <meshStandardMaterial color="#f2eee7" roughness={0.72} />
      </mesh>
      <mesh position={[-door.widthM / 2 - 0.045, 0, 0.018]}>
        <boxGeometry args={[0.07, door.heightM + 0.08, 0.055]} />
        <meshStandardMaterial color="#f2eee7" roughness={0.72} />
      </mesh>
      <mesh position={[door.widthM / 2 + 0.045, 0, 0.018]}>
        <boxGeometry args={[0.07, door.heightM + 0.08, 0.055]} />
        <meshStandardMaterial color="#f2eee7" roughness={0.72} />
      </mesh>
      <mesh position={[door.widthM * 0.32, 0.05, 0.04]}>
        <sphereGeometry args={[0.035, 12, 8]} />
        <meshStandardMaterial
          color="#d8b56c"
          metalness={0.45}
          roughness={0.4}
        />
      </mesh>
    </group>
  )
}

export function HouseWindow3D({
  frontZ,
  window,
}: {
  frontZ: number
  window: Plan3DModel["house"]["windows"][number]
}) {
  const frameColor = window.row === "upper" ? "#eef5f8" : "#edf1f1"

  return (
    <group
      position={[
        window.centerX,
        window.centerY,
        frontZ + PLAN_3D_LAYERS.renderEpsilonM,
      ]}
    >
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[window.widthM, window.heightM, 0.035]} />
        <meshStandardMaterial
          color="#86b8c7"
          metalness={0.05}
          roughness={0.22}
        />
      </mesh>
      <mesh position={[0, 0, 0.022]}>
        <boxGeometry args={[window.widthM + 0.14, 0.055, 0.045]} />
        <meshStandardMaterial color={frameColor} roughness={0.64} />
      </mesh>
      <mesh position={[0, window.heightM / 2 + 0.045, 0.022]}>
        <boxGeometry args={[window.widthM + 0.16, 0.07, 0.05]} />
        <meshStandardMaterial color={frameColor} roughness={0.64} />
      </mesh>
      <mesh position={[0, -window.heightM / 2 - 0.045, 0.022]}>
        <boxGeometry args={[window.widthM + 0.16, 0.07, 0.05]} />
        <meshStandardMaterial color={frameColor} roughness={0.64} />
      </mesh>
      <mesh position={[-window.widthM / 2 - 0.045, 0, 0.022]}>
        <boxGeometry args={[0.07, window.heightM + 0.16, 0.05]} />
        <meshStandardMaterial color={frameColor} roughness={0.64} />
      </mesh>
      <mesh position={[window.widthM / 2 + 0.045, 0, 0.022]}>
        <boxGeometry args={[0.07, window.heightM + 0.16, 0.05]} />
        <meshStandardMaterial color={frameColor} roughness={0.64} />
      </mesh>
      <mesh position={[0, 0, 0.045]}>
        <boxGeometry args={[0.045, window.heightM, 0.035]} />
        <meshStandardMaterial color={frameColor} roughness={0.64} />
      </mesh>
      <mesh position={[0, 0, 0.046]}>
        <boxGeometry args={[window.widthM, 0.04, 0.035]} />
        <meshStandardMaterial color={frameColor} roughness={0.64} />
      </mesh>
    </group>
  )
}
