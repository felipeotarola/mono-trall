/* eslint-disable react/no-unknown-property */

import type { Plan3DModel } from "@/lib/trall/plan-3d"
import { PLAN_3D_LAYERS } from "@/lib/trall/plan-3d-layers"

import type {
  SceneMaterials,
  SceneTextureMaps,
} from "@/components/trall/plan-3d-view/materials"
import {
  HouseDoor3D,
  HouseWindow3D,
} from "@/components/trall/plan-3d-view/house-openings"
import { HouseRoof3D } from "@/components/trall/plan-3d-view/house-roof"

export function HouseMass({
  materials,
  model,
  textureMaps,
}: {
  materials: SceneMaterials
  model: Plan3DModel
  textureMaps: SceneTextureMaps
}) {
  const frontZ = model.house.depthM / 2 + PLAN_3D_LAYERS.wallProjectionM

  return (
    <group position={[model.house.center.x, 0, model.house.center.z]}>
      <mesh castShadow receiveShadow position={[0, model.house.heightM / 2, 0]}>
        <boxGeometry
          args={[model.house.widthM, model.house.heightM, model.house.depthM]}
        />
        <meshStandardMaterial
          color={materials.houseWallColor}
          map={textureMaps.houseWall}
          roughness={0.82}
        />
      </mesh>
      <HouseRoof3D
        color={materials.roofColor}
        depthM={model.house.depthM}
        heightM={model.house.heightM}
        materialId={model.elevation.settings.appearance.roofMaterial}
        roofStyle={model.house.roofStyle}
        texture={textureMaps.roof}
        widthM={model.house.widthM}
      />
      {model.house.doors.map((door) => (
        <HouseDoor3D key={door.id} door={door} frontZ={frontZ} />
      ))}
      {model.house.windows.map((window) => (
        <HouseWindow3D key={window.id} frontZ={frontZ} window={window} />
      ))}
    </group>
  )
}
