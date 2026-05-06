"use client"

/* eslint-disable react/no-unknown-property */

import { Suspense, useEffect, useMemo, useRef, type ElementRef } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import {
  Html,
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei"
import * as THREE from "three"
import { RotateCcwIcon } from "lucide-react"

import type { EdgeConstraint } from "@/lib/trall/edge-model"
import type { BoardDirectionSettings, DeckFeature } from "@/lib/trall/features"
import {
  getPlan3DModel,
  type Plan3DLine,
  type Plan3DModel,
  type Plan3DRailing,
  type Plan3DSiteObject,
  type Point3D,
} from "@/lib/trall/plan-3d"
import type { HouseBounds, HouseModel, Point } from "@/lib/trall/types"
import { Button } from "@workspace/ui/components/button"
import {
  getTerrainHeightAt,
  type ElevationSettings,
} from "@/lib/trall/elevation"
import {
  centerYFromBottom,
  deckAccessoryBaseY,
  deckOverlayY,
  PLAN_3D_LAYERS,
  PLAN_3D_SCALE,
  terrainOverlayY,
} from "@/lib/trall/plan-3d-layers"
import {
  createFlatPolygonGeometry,
  createLineLoopGeometry,
  createLineSegmentsGeometry,
  createPolygonSlabGeometry,
  createPoolBodyGeometry,
  createPoolExcavationGeometry,
  createPoolExcavationRimGeometry,
  createTerrainGeometry,
  formatHeightCm,
  getGroundLabelPoint,
  getLabelPoint,
  getMidpoint,
  validatePlan3DPlacement,
} from "@/components/trall/plan-3d-view/geometry"
import {
  createHouseRoofGeometry,
  getHouseRoofDimensions,
  getRoofTileRows,
  type HouseRoofDimensions,
} from "@/components/trall/plan-3d-view/roof-geometry"
import {
  getSceneMaterials,
  getSceneTextureSelection,
  useSelectedTextureMaps,
  type SceneMaterials,
  type SceneTextureMaps,
} from "@/components/trall/plan-3d-view/materials"

const BOARD_LINE_LIMIT = 72

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

function TerrainMesh({
  materials,
  model,
  textureMaps,
}: {
  materials: SceneMaterials
  model: Plan3DModel
  textureMaps: SceneTextureMaps
}) {
  const geometry = useMemo(() => createTerrainGeometry(model), [model])

  return (
    <mesh receiveShadow geometry={geometry}>
      <meshStandardMaterial
        color={textureMaps.terrain ? "#ffffff" : materials.terrainColor}
        map={textureMaps.terrain}
        roughness={materials.terrainRoughness}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function HouseMass({
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

function HouseRoof3D({
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

function HouseDoor3D({
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

function HouseWindow3D({
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

function DeckSlab({
  materials,
  model,
  textureMaps,
}: {
  materials: SceneMaterials
  model: Plan3DModel
  textureMaps: SceneTextureMaps
}) {
  const geometry = useMemo(
    () =>
      createPolygonSlabGeometry(
        model.deckPoints,
        model.elevation.deckThicknessM,
        model.poolPoints ? [model.poolPoints] : [],
        { includeHoleSideFaces: false }
      ),
    [model.deckPoints, model.elevation.deckThicknessM, model.poolPoints]
  )

  return (
    <mesh
      castShadow
      receiveShadow
      geometry={geometry}
      position={[0, model.elevation.deckFinishedY, 0]}
    >
      <meshStandardMaterial
        color={textureMaps.deck ? "#ffffff" : materials.deckColor}
        map={textureMaps.deck}
        roughness={materials.deckRoughness}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function PoolBody({
  materials,
  model,
  textureMaps,
}: {
  materials: SceneMaterials
  model: Plan3DModel
  textureMaps: SceneTextureMaps
}) {
  const points = model.poolPoints
  const geometry = useMemo(
    () =>
      points
        ? createPoolBodyGeometry(points, model.elevation.poolBodyHeightM)
        : null,
    [model.elevation.poolBodyHeightM, points]
  )
  const waterGeometry = useMemo(
    () => (points ? createFlatPolygonGeometry(points) : null),
    [points]
  )
  const poolBorderY = model.elevation.poolTopY + PLAN_3D_LAYERS.trimLiftM
  const borderGeometry = useMemo(
    () => (points ? createLineLoopGeometry(points, poolBorderY) : null),
    [points, poolBorderY]
  )

  if (!geometry || !waterGeometry || !borderGeometry) {
    return null
  }

  return (
    <group position={[0, model.elevation.poolTopY, 0]}>
      <mesh castShadow receiveShadow geometry={geometry}>
        <meshStandardMaterial
          color={textureMaps.poolWall ? "#ffffff" : materials.poolWallColor}
          map={textureMaps.poolWall}
          roughness={0.72}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh
        geometry={waterGeometry}
        position={[0, -PLAN_3D_LAYERS.waterBelowPoolTopM, 0]}
      >
        <meshStandardMaterial
          color={materials.poolWaterColor}
          metalness={0.05}
          roughness={0.24}
          side={THREE.DoubleSide}
          transparent
          opacity={0.88}
        />
      </mesh>
      <lineSegments
        geometry={borderGeometry}
        position={[0, -model.elevation.poolTopY, 0]}
        renderOrder={2}
      >
        <lineBasicMaterial color={materials.poolBorderColor} linewidth={1} />
      </lineSegments>
    </group>
  )
}

function PoolExcavation({
  materials,
  model,
}: {
  materials: SceneMaterials
  model: Plan3DModel
}) {
  const geometry = useMemo(() => createPoolExcavationGeometry(model), [model])
  const rimGeometry = useMemo(
    () => createPoolExcavationRimGeometry(model),
    [model]
  )

  if (!geometry || !rimGeometry) {
    return null
  }

  return (
    <>
      <mesh receiveShadow geometry={geometry}>
        <meshStandardMaterial
          color={materials.excavationColor}
          polygonOffset
          polygonOffsetFactor={-1}
          roughness={0.98}
          side={THREE.DoubleSide}
        />
      </mesh>
      <lineSegments geometry={rimGeometry}>
        <lineBasicMaterial
          color={materials.excavationRimColor}
          transparent
          opacity={0.86}
        />
      </lineSegments>
    </>
  )
}

function Supports({
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

function HeightMarkers({ model }: { model: Plan3DModel }) {
  const deckPoint = getLabelPoint(model.deckPoints)
  const poolPoint = model.poolPoints ? getLabelPoint(model.poolPoints) : null
  const groundPoint = getGroundLabelPoint(model)

  return (
    <>
      <HeightMarker
        baseY={getTerrainHeightAt(
          deckPoint,
          model.elevation.settings.terrain,
          model.elevation.terrainBounds
        )}
        color="#6f4b2f"
        label={`Deck ${formatHeightCm(model.elevation.deckFinishedY)}`}
        point={deckPoint}
        y={model.elevation.deckFinishedY + PLAN_3D_LAYERS.labelLiftM}
      />
      {poolPoint ? (
        <HeightMarker
          baseY={model.elevation.poolTopY - model.elevation.poolBodyHeightM}
          color="#1d79b7"
          label={`Pool top ${formatHeightCm(model.elevation.poolTopY)}`}
          point={poolPoint}
          y={model.elevation.poolTopY + PLAN_3D_LAYERS.labelLiftM}
        />
      ) : null}
      <HeightMarker
        baseY={groundPoint.y - 0.22}
        color="#645846"
        label={`Ground ${formatHeightCm(groundPoint.y)}`}
        point={groundPoint}
        y={groundPoint.y + PLAN_3D_LAYERS.labelLiftM}
      />
    </>
  )
}

function HeightMarker({
  baseY,
  color,
  label,
  point,
  y,
}: {
  baseY: number
  color: string
  label: string
  point: Point3D
  y: number
}) {
  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [point.x, baseY, point.z, point.x, y, point.z],
        3
      )
    )

    return geometry
  }, [baseY, point, y])

  return (
    <group>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color={color} transparent opacity={0.72} />
      </lineSegments>
      <mesh position={[point.x, y, point.z]}>
        <sphereGeometry args={[0.055, 14, 10]} />
        <meshStandardMaterial color={color} roughness={0.42} />
      </mesh>
      <Html
        center
        distanceFactor={5}
        position={[point.x, y + 0.22, point.z]}
        style={{ pointerEvents: "none" }}
        zIndexRange={[20, 0]}
      >
        <span
          className="rounded border border-stone-300 bg-white/95 px-2.5 py-1 text-xs font-semibold text-stone-800 shadow-sm"
          style={{ whiteSpace: "nowrap" }}
        >
          {label}
        </span>
      </Html>
    </group>
  )
}

function BoardLines({
  color,
  deckFinishedY,
  lines,
}: {
  color: string
  deckFinishedY: number
  lines: Plan3DLine[]
}) {
  const visibleLines = lines.slice(0, BOARD_LINE_LIMIT)
  const geometry = useMemo(
    () => createLineSegmentsGeometry(visibleLines, deckOverlayY(deckFinishedY)),
    [deckFinishedY, visibleLines]
  )

  return (
    <lineSegments geometry={geometry} renderOrder={2}>
      <lineBasicMaterial color={color} transparent opacity={0.36} />
    </lineSegments>
  )
}

function Railings({ model }: { model: Plan3DModel }) {
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

function Stairs({
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

function Pergolas({
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

function PrivacyScreens({ model }: { model: Plan3DModel }) {
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

function SiteObjects({ model }: { model: Plan3DModel }) {
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
