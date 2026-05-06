"use client"

/* eslint-disable react/no-unknown-property */

import { Suspense, useEffect, useMemo, useRef, type ElementRef } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import {
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei"
import { RotateCcwIcon } from "lucide-react"

import type { EdgeConstraint } from "@/lib/trall/edge-model"
import type { BoardDirectionSettings, DeckFeature } from "@/lib/trall/features"
import {
  getPlan3DModel,
  type Plan3DModel,
} from "@/lib/trall/plan-3d"
import type { HouseBounds, HouseModel, Point } from "@/lib/trall/types"
import { Button } from "@workspace/ui/components/button"
import type { ElevationSettings } from "@/lib/trall/elevation"
import { PLAN_3D_SCALE } from "@/lib/trall/plan-3d-layers"
import { validatePlan3DPlacement } from "@/components/trall/plan-3d-view/geometry"
import { HouseMass } from "@/components/trall/plan-3d-view/house"
import { Pergolas } from "@/components/trall/plan-3d-view/pergolas"
import { PrivacyScreens } from "@/components/trall/plan-3d-view/privacy-screens"
import { Railings } from "@/components/trall/plan-3d-view/railings"
import { Stairs } from "@/components/trall/plan-3d-view/stairs"
import { BoardLines } from "@/components/trall/plan-3d-view/board-lines"
import { DeckSlab } from "@/components/trall/plan-3d-view/deck-slab"
import { PoolBody } from "@/components/trall/plan-3d-view/pool-body"
import { PoolExcavation } from "@/components/trall/plan-3d-view/pool-excavation"
import { Supports } from "@/components/trall/plan-3d-view/supports"
import { TerrainMesh } from "@/components/trall/plan-3d-view/terrain"
import {
  getSceneMaterials,
  getSceneTextureSelection,
  useSelectedTextureMaps,
  type SceneMaterials,
  type SceneTextureMaps,
} from "@/components/trall/plan-3d-view/materials"
import { SiteObjects } from "@/components/trall/plan-3d-view/site-objects"
import { HeightMarkers } from "@/components/trall/plan-3d-view/height-markers"

export function Plan3DView({
  boardDirection,
  deckEdgeConstraints,
  deckPoints,
  elevationSettings,
  features,
  house,
  houseBounds,
  poolPoints,
}: {
  boardDirection: BoardDirectionSettings
  deckEdgeConstraints: EdgeConstraint[]
  deckPoints: Point[]
  elevationSettings: ElevationSettings
  features: DeckFeature[]
  house: HouseModel
  houseBounds: HouseBounds
  poolPoints: Point[] | null
}) {
  const controlsRef = useRef<ElementRef<typeof OrbitControls> | null>(null)
  const model = useMemo(
    () =>
      getPlan3DModel({
        boardDirection,
        deckEdgeConstraints,
        deckPoints,
        elevationSettings,
        features,
        house,
        houseBounds,
        poolPoints,
      }),
    [
      boardDirection,
      deckEdgeConstraints,
      deckPoints,
      elevationSettings,
      features,
      house,
      houseBounds,
      poolPoints,
    ]
  )
  const cameraDistance = Math.max(7, model.bounds.diagonalM * 0.95)
  const materials = useMemo(
    () => getSceneMaterials(model.elevation.settings.appearance),
    [model.elevation.settings.appearance]
  )

  useEffect(() => {
    validatePlan3DPlacement(model)
  }, [model])

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-md bg-stone-200"
      data-testid="plan-3d-view"
    >
      <Canvas
        className="h-full w-full"
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true,
        }}
        shadows
      >
        <PerspectiveCamera
          makeDefault
          fov={42}
          near={PLAN_3D_SCALE.cameraNearM}
          far={Math.max(
            PLAN_3D_SCALE.cameraFarMinM,
            cameraDistance * PLAN_3D_SCALE.cameraFarMultiplier
          )}
          position={[
            cameraDistance * 0.6,
            cameraDistance * 0.6,
            cameraDistance,
          ]}
        />
        <SceneCameraReset controlsRef={controlsRef} model={model} />
        <color attach="background" args={["#e7e5df"]} />
        <fog
          attach="fog"
          args={["#e7e5df", cameraDistance * 1.2, cameraDistance * 3]}
        />
        <ambientLight intensity={0.65} />
        <directionalLight
          castShadow
          intensity={1.6}
          position={[6, 9, 8]}
          shadow-mapSize-height={1024}
          shadow-mapSize-width={1024}
        />
        <Suspense fallback={null}>
          <Plan3DSceneObjects materials={materials} model={model} />
        </Suspense>
        <OrbitControls
          ref={controlsRef}
          enableDamping
          enablePan
          enableZoom
          makeDefault
          maxDistance={Math.max(18, cameraDistance * 2.4)}
          maxPolarAngle={Math.PI / 2.08}
          minDistance={Math.max(3, cameraDistance * 0.25)}
          target={[0, 0, 0]}
        />
      </Canvas>

      <div className="pointer-events-none absolute top-3 right-3 flex items-center gap-2">
        <Button
          aria-label="Reset 3D camera"
          className="pointer-events-auto size-9 border-stone-300 bg-white/92 shadow-sm backdrop-blur"
          size="icon"
          title="Reset 3D camera"
          variant="outline"
          onClick={() => controlsRef.current?.reset()}
        >
          <RotateCcwIcon />
        </Button>
      </div>
    </div>
  )
}

function SceneCameraReset({
  controlsRef,
  model,
}: {
  controlsRef: React.MutableRefObject<ElementRef<typeof OrbitControls> | null>
  model: Plan3DModel
}) {
  const { camera } = useThree()
  const cameraDistance = Math.max(7, model.bounds.diagonalM * 0.95)

  useEffect(() => {
    camera.position.set(
      cameraDistance * 0.6,
      cameraDistance * 0.6,
      cameraDistance
    )
    camera.lookAt(0, 0, 0)
    controlsRef.current?.target.set(0, 0, 0)
    controlsRef.current?.saveState()
    controlsRef.current?.update()
  }, [camera, cameraDistance, controlsRef])

  return null
}

function Plan3DSceneObjects({
  materials,
  model,
}: {
  materials: SceneMaterials
  model: Plan3DModel
}) {
  if (model.elevation.settings.appearance.renderMode === "realistic") {
    return <TexturedPlan3DSceneObjects materials={materials} model={model} />
  }

  return (
    <Plan3DSceneContent materials={materials} model={model} textureMaps={{}} />
  )
}

function TexturedPlan3DSceneObjects({
  materials,
  model,
}: {
  materials: SceneMaterials
  model: Plan3DModel
}) {
  const textureSelection = useMemo(
    () => getSceneTextureSelection(model.elevation.settings.appearance),
    [model.elevation.settings.appearance]
  )
  const textureMaps = useSelectedTextureMaps(textureSelection)

  return (
    <Plan3DSceneContent
      materials={materials}
      model={model}
      textureMaps={textureMaps}
    />
  )
}

function Plan3DSceneContent({
  materials,
  model,
  textureMaps,
}: {
  materials: SceneMaterials
  model: Plan3DModel
  textureMaps: SceneTextureMaps
}) {
  return (
    <group>
      <TerrainMesh
        materials={materials}
        model={model}
        textureMaps={textureMaps}
      />
      <HouseMass
        materials={materials}
        model={model}
        textureMaps={textureMaps}
      />
      <DeckSlab materials={materials} model={model} textureMaps={textureMaps} />
      <PoolBody materials={materials} model={model} textureMaps={textureMaps} />
      {model.elevation.settings.visualization.showPoolExcavation ? (
        <PoolExcavation materials={materials} model={model} />
      ) : null}
      <BoardLines
        color={materials.boardLineColor}
        deckFinishedY={model.elevation.deckFinishedY}
        lines={model.boardLines}
      />
      <Supports materials={materials} model={model} />
      <Railings model={model} />
      <Stairs materials={materials} model={model} />
      <Pergolas materials={materials} model={model} />
      <PrivacyScreens model={model} />
      <SiteObjects model={model} />
      {model.elevation.settings.visualization.showHeightMarkers ? (
        <HeightMarkers model={model} />
      ) : null}
    </group>
  )
}
