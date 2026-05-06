/* eslint-disable react/no-unknown-property */

import * as THREE from "three"

import type { Plan3DModel, Plan3DRailing } from "@/lib/trall/plan-3d"
import { deckAccessoryBaseY } from "@/lib/trall/plan-3d-layers"

import { getMidpoint } from "@/components/trall/plan-3d-view/geometry"

export function Railings({ model }: { model: Plan3DModel }) {
  const baseY = deckAccessoryBaseY(model.elevation.deckFinishedY)

  return (
    <>
      {model.railings.map((railing) => {
        const mid = getMidpoint(railing.edge.start, railing.edge.end)

        return (
          <group
            key={railing.id}
            position={[mid.x, baseY, mid.z]}
            rotation={[0, -railing.edge.angleY, 0]}
          >
            {railing.style === "glass" ? (
              <GlassFence railing={railing} />
            ) : railing.style === "metal" ? (
              <MetalFence railing={railing} />
            ) : (
              <WoodFence railing={railing} />
            )}
          </group>
        )
      })}
    </>
  )
}

function GlassFence({ railing }: { railing: Plan3DRailing }) {
  const postCount = Math.max(2, Math.ceil(railing.edge.lengthM / 1.45) + 1)
  const paneHeight = Math.max(0.55, railing.heightM - 0.14)

  return (
    <>
      <mesh
        castShadow
        receiveShadow
        renderOrder={3}
        position={[0, paneHeight / 2 + 0.04, 0]}
      >
        <boxGeometry args={[railing.edge.lengthM, paneHeight, 0.035]} />
        <meshPhysicalMaterial
          color="#b9e6f2"
          roughness={0.08}
          metalness={0}
          transmission={0.42}
          transparent
          opacity={0.42}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh castShadow position={[0, railing.heightM, 0]}>
        <boxGeometry args={[railing.edge.lengthM + 0.08, 0.045, 0.07]} />
        <meshStandardMaterial color="#59666b" roughness={0.38} metalness={0.35} />
      </mesh>
      {getLocalFencePostXs(railing.edge.lengthM, postCount).map((x, index) => (
        <mesh
          key={`${railing.id}-glass-post-${index}`}
          castShadow
          position={[x, railing.heightM / 2, 0]}
        >
          <boxGeometry args={[0.07, railing.heightM, 0.07]} />
          <meshStandardMaterial
            color="#667176"
            roughness={0.34}
            metalness={0.42}
          />
        </mesh>
      ))}
    </>
  )
}

function MetalFence({ railing }: { railing: Plan3DRailing }) {
  const postCount = Math.max(2, Math.ceil(railing.edge.lengthM / 1.25) + 1)
  const balusterCount = Math.min(
    80,
    Math.max(0, Math.floor(railing.edge.lengthM / 0.32) - 1)
  )
  const color = "#565c61"

  return (
    <>
      <mesh castShadow position={[0, railing.heightM, 0]}>
        <boxGeometry args={[railing.edge.lengthM, 0.06, 0.06]} />
        <meshStandardMaterial color={color} roughness={0.42} metalness={0.35} />
      </mesh>
      <mesh castShadow position={[0, railing.heightM * 0.48, 0]}>
        <boxGeometry args={[railing.edge.lengthM, 0.04, 0.045]} />
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.28} />
      </mesh>
      {getLocalFencePostXs(railing.edge.lengthM, postCount).map((x, index) => (
        <mesh
          key={`${railing.id}-metal-post-${index}`}
          castShadow
          position={[x, railing.heightM / 2, 0]}
        >
          <boxGeometry args={[0.07, railing.heightM, 0.07]} />
          <meshStandardMaterial color={color} roughness={0.42} metalness={0.35} />
        </mesh>
      ))}
      {getLocalFencePostXs(railing.edge.lengthM, balusterCount + 2)
        .slice(1, -1)
        .map((x, index) => (
          <mesh
            key={`${railing.id}-baluster-${index}`}
            castShadow
            position={[x, railing.heightM * 0.5, 0]}
          >
            <boxGeometry args={[0.035, railing.heightM * 0.82, 0.035]} />
            <meshStandardMaterial color={color} roughness={0.45} metalness={0.32} />
          </mesh>
        ))}
    </>
  )
}

function WoodFence({ railing }: { railing: Plan3DRailing }) {
  const postCount = Math.max(2, Math.ceil(railing.edge.lengthM / 1.2) + 1)
  const slatCount = Math.min(
    70,
    Math.max(0, Math.floor(railing.edge.lengthM / 0.28) - 1)
  )
  const color = "#775439"

  return (
    <>
      <mesh castShadow position={[0, railing.heightM, 0]}>
        <boxGeometry args={[railing.edge.lengthM, 0.08, 0.09]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </mesh>
      <mesh castShadow position={[0, railing.heightM * 0.46, 0]}>
        <boxGeometry args={[railing.edge.lengthM, 0.065, 0.08]} />
        <meshStandardMaterial color={color} roughness={0.74} />
      </mesh>
      {getLocalFencePostXs(railing.edge.lengthM, postCount).map((x, index) => (
        <mesh
          key={`${railing.id}-wood-post-${index}`}
          castShadow
          position={[x, railing.heightM / 2, 0]}
        >
          <boxGeometry args={[0.1, railing.heightM, 0.1]} />
          <meshStandardMaterial color={color} roughness={0.76} />
        </mesh>
      ))}
      {getLocalFencePostXs(railing.edge.lengthM, slatCount + 2)
        .slice(1, -1)
        .map((x, index) => (
          <mesh
            key={`${railing.id}-wood-slat-${index}`}
            castShadow
            position={[x, railing.heightM * 0.46, 0.01]}
          >
            <boxGeometry args={[0.055, railing.heightM * 0.78, 0.045]} />
            <meshStandardMaterial color="#8a6040" roughness={0.78} />
          </mesh>
        ))}
    </>
  )
}

function getLocalFencePostXs(lengthM: number, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const t = count === 1 ? 0.5 : index / (count - 1)
    return -lengthM / 2 + lengthM * t
  })
}
