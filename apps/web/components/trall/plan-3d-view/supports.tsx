/* eslint-disable react/no-unknown-property */

import type { Plan3DModel } from "@/lib/trall/plan-3d"
import {
  centerYFromBottom,
  PLAN_3D_LAYERS,
  terrainOverlayY,
} from "@/lib/trall/plan-3d-layers"

import type { SceneMaterials } from "@/components/trall/plan-3d-view/materials"

export function Supports({
  materials,
  model,
}: {
  materials: SceneMaterials
  model: Plan3DModel
}) {
  return (
    <>
      {model.supportPosts.map((post) => (
        <SupportPost key={post.id} materials={materials} post={post} />
      ))}
    </>
  )
}

function SupportPost({
  materials,
  post,
}: {
  materials: SceneMaterials
  post: Plan3DModel["supportPosts"][number]
}) {
  const bottomY = terrainOverlayY(post.terrainY)
  const heightM = Math.max(
    0.02,
    post.deckBottomY - bottomY - PLAN_3D_LAYERS.supportClearanceM
  )

  return (
    <mesh
      castShadow
      receiveShadow
      position={[
        post.point.x,
        centerYFromBottom(bottomY, heightM),
        post.point.z,
      ]}
    >
      <boxGeometry args={[0.11, heightM, 0.11]} />
      <meshStandardMaterial color={materials.supportColor} roughness={0.84} />
    </mesh>
  )
}
