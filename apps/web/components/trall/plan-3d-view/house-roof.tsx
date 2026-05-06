/* eslint-disable react/no-unknown-property */

import { useMemo } from "react"
import * as THREE from "three"

import type { Plan3DModel } from "@/lib/trall/plan-3d"

import {
  createHouseRoofGeometry,
  getHouseRoofDimensions,
  getRoofTileRows,
  type HouseRoofDimensions,
} from "@/components/trall/plan-3d-view/roof-geometry"

export function HouseRoof3D({
  color,
  depthM,
  heightM,
  materialId,
  roofStyle,
  texture,
  widthM,
}: {
  color: string
  depthM: number
  heightM: number
  materialId: Plan3DModel["elevation"]["settings"]["appearance"]["roofMaterial"]
  roofStyle: Plan3DModel["house"]["roofStyle"]
  texture?: THREE.Texture
  widthM: number
}) {
  const geometry = useMemo(
    () => createHouseRoofGeometry({ depthM, roofStyle, widthM }),
    [depthM, roofStyle, widthM]
  )
  const dimensions = getHouseRoofDimensions(widthM, depthM)

  return (
    <group position={[0, heightM, 0]}>
      <mesh castShadow receiveShadow geometry={geometry}>
        <meshStandardMaterial
          color={texture ? "#ffffff" : color}
          map={texture}
          roughness={0.72}
          side={THREE.DoubleSide}
        />
      </mesh>
      <RoofDetailLines dimensions={dimensions} roofStyle={roofStyle} />
      <RoofTilePattern
        dimensions={dimensions}
        materialId={materialId}
        roofStyle={roofStyle}
      />
    </group>
  )
}

function RoofTilePattern({
  dimensions,
  materialId,
  roofStyle,
}: {
  dimensions: HouseRoofDimensions
  materialId: Plan3DModel["elevation"]["settings"]["appearance"]["roofMaterial"]
  roofStyle: Plan3DModel["house"]["roofStyle"]
}) {
  if (materialId !== "red_tile" || roofStyle === "flat") {
    return null
  }

  const rows = getRoofTileRows(dimensions, roofStyle)
  const rowColor = "#8f3426"
  const shadowColor = "#5d211a"

  return (
    <group>
      {rows.map((row) => (
        <group key={row.id} position={row.position} rotation={row.rotation}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={row.args} />
            <meshStandardMaterial color={rowColor} roughness={0.82} />
          </mesh>
          <mesh position={row.shadowPosition}>
            <boxGeometry args={row.shadowArgs} />
            <meshStandardMaterial color={shadowColor} roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function RoofDetailLines({
  dimensions,
  roofStyle,
}: {
  dimensions: HouseRoofDimensions
  roofStyle: Plan3DModel["house"]["roofStyle"]
}) {
  const lineColor = "#f5f1e6"
  const fasciaColor = "#403832"

  if (roofStyle === "flat") {
    return (
      <group>
        <mesh position={[0, dimensions.thickness + 0.01, dimensions.halfDepth]}>
          <boxGeometry args={[dimensions.halfWidth * 2, 0.035, 0.035]} />
          <meshStandardMaterial color={lineColor} roughness={0.55} />
        </mesh>
        <mesh
          position={[0, dimensions.thickness + 0.01, -dimensions.halfDepth]}
        >
          <boxGeometry args={[dimensions.halfWidth * 2, 0.035, 0.035]} />
          <meshStandardMaterial color={lineColor} roughness={0.55} />
        </mesh>
      </group>
    )
  }

  if (roofStyle === "shed") {
    return (
      <group>
        <mesh
          position={[
            0,
            dimensions.shedRise + dimensions.thickness + 0.035,
            -dimensions.halfDepth,
          ]}
        >
          <boxGeometry args={[dimensions.halfWidth * 2, 0.07, 0.07]} />
          <meshStandardMaterial color={lineColor} roughness={0.5} />
        </mesh>
        <mesh position={[0, dimensions.thickness + 0.02, dimensions.halfDepth]}>
          <boxGeometry args={[dimensions.halfWidth * 2, 0.08, 0.09]} />
          <meshStandardMaterial color={fasciaColor} roughness={0.7} />
        </mesh>
        <mesh
          rotation={[dimensions.shedAngleRad, 0, 0]}
          position={[
            -dimensions.halfWidth * 0.45,
            dimensions.shedRise / 2 + dimensions.thickness + 0.03,
            0,
          ]}
        >
          <boxGeometry args={[0.04, 0.035, dimensions.slopeLength]} />
          <meshStandardMaterial color={lineColor} roughness={0.5} />
        </mesh>
        <mesh
          rotation={[dimensions.shedAngleRad, 0, 0]}
          position={[
            dimensions.halfWidth * 0.45,
            dimensions.shedRise / 2 + dimensions.thickness + 0.03,
            0,
          ]}
        >
          <boxGeometry args={[0.04, 0.035, dimensions.slopeLength]} />
          <meshStandardMaterial color={lineColor} roughness={0.5} />
        </mesh>
      </group>
    )
  }

  return (
    <group>
      <mesh position={[0, dimensions.gableRise + 0.055, 0]}>
        <boxGeometry args={[0.08, 0.08, dimensions.halfDepth * 2]} />
        <meshStandardMaterial color={lineColor} roughness={0.5} />
      </mesh>
      <mesh
        rotation={[0, 0, dimensions.gableAngleRad]}
        position={[
          -dimensions.halfWidth / 2,
          dimensions.gableRise / 2 + 0.035,
          0,
        ]}
      >
        <boxGeometry args={[dimensions.rafterLength, 0.04, 0.035]} />
        <meshStandardMaterial color={lineColor} roughness={0.5} />
      </mesh>
      <mesh
        rotation={[0, 0, -dimensions.gableAngleRad]}
        position={[
          dimensions.halfWidth / 2,
          dimensions.gableRise / 2 + 0.035,
          0,
        ]}
      >
        <boxGeometry args={[dimensions.rafterLength, 0.04, 0.035]} />
        <meshStandardMaterial color={lineColor} roughness={0.5} />
      </mesh>
    </group>
  )
}
