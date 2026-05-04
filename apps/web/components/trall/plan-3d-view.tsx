"use client"

/* eslint-disable react/no-unknown-property */

import { useEffect, useMemo, useRef, type ElementRef } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { Html, OrbitControls, PerspectiveCamera } from "@react-three/drei"
import * as THREE from "three"
import { RotateCcwIcon } from "lucide-react"

import type { EdgeConstraint } from "@/lib/trall/edge-model"
import type {
  BoardDirectionSettings,
  DeckFeature,
} from "@/lib/trall/features"
import {
  getPlan3DModel,
  type Plan3DLine,
  type Plan3DModel,
  type Point3D,
} from "@/lib/trall/plan-3d"
import type { HouseBounds, HouseModel, Point } from "@/lib/trall/types"
import { Button } from "@workspace/ui/components/button"
import {
  getTerrainHeightAt,
  mToCm,
  type ElevationSettings,
} from "@/lib/trall/elevation"

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
          near={0.1}
          far={250}
          position={[cameraDistance * 0.6, cameraDistance * 0.6, cameraDistance]}
        />
        <SceneCameraReset controlsRef={controlsRef} model={model} />
        <color attach="background" args={["#e7e5df"]} />
        <fog attach="fog" args={["#e7e5df", cameraDistance * 1.2, cameraDistance * 3]} />
        <ambientLight intensity={0.65} />
        <directionalLight
          castShadow
          intensity={1.6}
          position={[6, 9, 8]}
          shadow-mapSize-height={1024}
          shadow-mapSize-width={1024}
        />
        <group>
          <TerrainMesh model={model} />
          <HouseMass model={model} />
          <DeckSlab model={model} />
          <PoolBody model={model} />
          {model.elevation.settings.visualization.showPoolExcavation ? (
            <PoolExcavation model={model} />
          ) : null}
          <BoardLines
            deckFinishedY={model.elevation.deckFinishedY}
            lines={model.boardLines}
          />
          <Supports model={model} />
          <Railings model={model} />
          <Stairs model={model} />
          <Pergolas model={model} />
          <PrivacyScreens model={model} />
          {model.elevation.settings.visualization.showHeightMarkers ? (
            <HeightMarkers model={model} />
          ) : null}
        </group>
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

function TerrainMesh({ model }: { model: Plan3DModel }) {
  const geometry = useMemo(() => createTerrainGeometry(model), [model])

  return (
    <mesh receiveShadow geometry={geometry}>
      <meshStandardMaterial color="#b9b09f" roughness={0.96} />
    </mesh>
  )
}

function HouseMass({ model }: { model: Plan3DModel }) {
  const frontZ = model.house.depthM / 2 + 0.018

  return (
    <group position={[model.house.center.x, 0, model.house.center.z]}>
      <mesh castShadow receiveShadow position={[0, model.house.heightM / 2, 0]}>
        <boxGeometry
          args={[model.house.widthM, model.house.heightM, model.house.depthM]}
        />
        <meshStandardMaterial color="#d8d3ca" roughness={0.82} />
      </mesh>
      <mesh position={[0, model.house.heightM + 0.06, 0]}>
        <boxGeometry
          args={[model.house.widthM + 0.2, 0.12, model.house.depthM + 0.2]}
        />
        <meshStandardMaterial color="#77736b" roughness={0.75} />
      </mesh>
      {model.house.doors.map((door) => (
        <HouseDoor3D key={door.id} door={door} frontZ={frontZ} />
      ))}
      {model.house.windows.map((window) => (
        <HouseWindow3D key={window.id} frontZ={frontZ} window={window} />
      ))}
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
        <meshStandardMaterial color="#d8b56c" metalness={0.45} roughness={0.4} />
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
    <group position={[window.centerX, window.centerY, frontZ + 0.006]}>
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

function DeckSlab({ model }: { model: Plan3DModel }) {
  const geometry = useMemo(
    () =>
      createPolygonSlabGeometry(
        model.deckPoints,
        model.elevation.deckThicknessM,
        model.poolPoints ? [model.poolPoints] : []
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
        color="#a87948"
        roughness={0.78}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function PoolBody({ model }: { model: Plan3DModel }) {
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
  const borderGeometry = useMemo(
    () =>
      points
        ? createLineLoopGeometry(points, model.elevation.poolTopY + 0.018)
        : null,
    [model.elevation.poolTopY, points]
  )

  if (!geometry || !waterGeometry || !borderGeometry) {
    return null
  }

  return (
    <group position={[0, model.elevation.poolTopY, 0]}>
      <mesh castShadow receiveShadow geometry={geometry}>
        <meshStandardMaterial
          color="#d8e3e7"
          roughness={0.72}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={waterGeometry} position={[0, -0.045, 0]}>
        <meshStandardMaterial
          color="#2b8fd6"
          metalness={0.05}
          roughness={0.24}
          side={THREE.DoubleSide}
          transparent
          opacity={0.88}
        />
      </mesh>
      <lineSegments geometry={borderGeometry} position={[0, -model.elevation.poolTopY, 0]}>
        <lineBasicMaterial color="#e7f8ff" linewidth={1} />
      </lineSegments>
    </group>
  )
}

function PoolExcavation({ model }: { model: Plan3DModel }) {
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
          color="#7d674c"
          polygonOffset
          polygonOffsetFactor={-1}
          roughness={0.98}
          side={THREE.DoubleSide}
        />
      </mesh>
      <lineSegments geometry={rimGeometry}>
        <lineBasicMaterial color="#594733" transparent opacity={0.86} />
      </lineSegments>
    </>
  )
}

function Supports({ model }: { model: Plan3DModel }) {
  return (
    <>
      {model.supportPosts.map((post) => (
        <mesh
          key={post.id}
          castShadow
          receiveShadow
          position={[
            post.point.x,
            post.terrainY + post.heightM / 2,
            post.point.z,
          ]}
        >
          <boxGeometry args={[0.11, post.heightM, 0.11]} />
          <meshStandardMaterial color="#6f5437" roughness={0.84} />
        </mesh>
      ))}
    </>
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
        y={model.elevation.deckFinishedY + 0.08}
      />
      {poolPoint ? (
        <HeightMarker
          baseY={model.elevation.poolTopY - model.elevation.poolBodyHeightM}
          color="#1d79b7"
          label={`Pool top ${formatHeightCm(model.elevation.poolTopY)}`}
          point={poolPoint}
          y={model.elevation.poolTopY + 0.1}
        />
      ) : null}
      <HeightMarker
        baseY={groundPoint.y - 0.22}
        color="#645846"
        label={`Ground ${formatHeightCm(groundPoint.y)}`}
        point={groundPoint}
        y={groundPoint.y + 0.12}
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
  deckFinishedY,
  lines,
}: {
  deckFinishedY: number
  lines: Plan3DLine[]
}) {
  const visibleLines = lines.slice(0, BOARD_LINE_LIMIT)
  const geometry = useMemo(
    () => createLineSegmentsGeometry(visibleLines, deckFinishedY + 0.026),
    [deckFinishedY, visibleLines]
  )

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#6f4b2f" transparent opacity={0.32} />
    </lineSegments>
  )
}

function Railings({ model }: { model: Plan3DModel }) {
  const deckY = model.elevation.deckFinishedY

  return (
    <>
      {model.railings.map((railing) => {
        const mid = getMidpoint(railing.edge.start, railing.edge.end)
        const railColor = railing.style === "metal" ? "#5f6468" : railing.style === "glass" ? "#9fc9d5" : "#775439"
        const postCount = Math.max(2, Math.ceil(railing.edge.lengthM / 1.2) + 1)
        const tangent = getHorizontalVector(railing.edge.start, railing.edge.end)

        return (
          <group key={railing.id}>
            <mesh
              castShadow
              position={[mid.x, deckY + railing.heightM, mid.z]}
              rotation={[0, -railing.edge.angleY, 0]}
            >
              <boxGeometry args={[railing.edge.lengthM, 0.08, 0.08]} />
              <meshStandardMaterial color={railColor} roughness={0.66} transparent={railing.style === "glass"} opacity={railing.style === "glass" ? 0.58 : 1} />
            </mesh>
            <mesh
              castShadow
              position={[mid.x, deckY + railing.heightM * 0.55, mid.z]}
              rotation={[0, -railing.edge.angleY, 0]}
            >
              <boxGeometry args={[railing.edge.lengthM, 0.055, 0.055]} />
              <meshStandardMaterial color={railColor} roughness={0.7} transparent={railing.style === "glass"} opacity={railing.style === "glass" ? 0.32 : 1} />
            </mesh>
            {Array.from({ length: postCount }, (_, index) => {
              const t = postCount === 1 ? 0 : index / (postCount - 1)
              const point = {
                x: railing.edge.start.x + tangent.x * railing.edge.lengthM * t,
                z: railing.edge.start.z + tangent.z * railing.edge.lengthM * t,
              }

              return (
                <mesh
                  key={`${railing.id}-post-${index}`}
                  castShadow
                  position={[point.x, deckY + railing.heightM / 2, point.z]}
                >
                  <boxGeometry args={[0.09, railing.heightM, 0.09]} />
                  <meshStandardMaterial color={railColor} roughness={0.72} />
                </mesh>
              )
            })}
          </group>
        )
      })}
    </>
  )
}

function Stairs({ model }: { model: Plan3DModel }) {
  const deckBottomY =
    model.elevation.deckFinishedY - model.elevation.deckThicknessM

  return (
    <>
      {model.stairs.map((stairs) => {
        const stepDepth = stairs.depthM / Math.max(1, stairs.stepCount)
        const stepHeight =
          model.elevation.deckThicknessM / Math.max(1, stairs.stepCount)

        return (
          <group key={stairs.id}>
            {Array.from({ length: Math.max(1, stairs.stepCount) }, (_, index) => {
              const depth = stepDepth * (index + 1)
              const height = stepHeight * (index + 1)
              const center = {
                x: stairs.anchor.x + stairs.normal.x * (depth / 2),
                z: stairs.anchor.z + stairs.normal.z * (depth / 2),
              }

              return (
                <mesh
                  key={`${stairs.id}-step-${index}`}
                  castShadow
                  receiveShadow
                  position={[center.x, deckBottomY + height / 2, center.z]}
                  rotation={[0, -stairs.angleY, 0]}
                >
                  <boxGeometry args={[stairs.widthM, height, depth]} />
                  <meshStandardMaterial color="#b58a5d" roughness={0.82} />
                </mesh>
              )
            })}
          </group>
        )
      })}
    </>
  )
}

function Pergolas({ model }: { model: Plan3DModel }) {
  const deckY = model.elevation.deckFinishedY

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
            position={[pergola.center.x, deckY, pergola.center.z]}
            rotation={[0, -pergola.rotationRad, 0]}
          >
            {postPositions.map(([postX, postZ], index) => (
              <mesh key={`${pergola.id}-post-${index}`} castShadow position={[postX ?? 0, 1.15, postZ ?? 0]}>
                <boxGeometry args={[0.12, 2.3, 0.12]} />
                <meshStandardMaterial color="#7c5a39" roughness={0.78} />
              </mesh>
            ))}
            <mesh castShadow position={[0, 2.35, -z]}>
              <boxGeometry args={[pergola.widthM + 0.18, 0.12, 0.16]} />
              <meshStandardMaterial color="#6f4d31" roughness={0.74} />
            </mesh>
            <mesh castShadow position={[0, 2.35, z]}>
              <boxGeometry args={[pergola.widthM + 0.18, 0.12, 0.16]} />
              <meshStandardMaterial color="#6f4d31" roughness={0.74} />
            </mesh>
            {[-0.36, 0, 0.36].map((offset) => (
              <mesh key={`${pergola.id}-beam-${offset}`} castShadow position={[offset * pergola.widthM, 2.52, 0]}>
                <boxGeometry args={[0.1, 0.1, pergola.depthM + 0.36]} />
                <meshStandardMaterial color="#8b663f" roughness={0.74} />
              </mesh>
            ))}
          </group>
        )
      })}
    </>
  )
}

function PrivacyScreens({ model }: { model: Plan3DModel }) {
  const deckY = model.elevation.deckFinishedY

  return (
    <>
      {model.privacyScreens.map((screen) => {
        const mid = getMidpoint(screen.start, screen.end)
        const color = screen.style === "greenery" ? "#5f7a48" : screen.style === "solid" ? "#816447" : "#8c6b48"
        const slatCount = screen.style === "slatted" ? Math.max(3, Math.floor(screen.lengthM / 0.22)) : 1

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
                  <mesh key={`${screen.id}-slat-${index}`} castShadow position={[point.x, deckY + screen.heightM / 2, point.z]} rotation={[0, -screen.angleY, 0]}>
                    <boxGeometry args={[0.06, screen.heightM, 0.08]} />
                    <meshStandardMaterial color={color} roughness={0.76} />
                  </mesh>
                )
              })
            ) : (
              <mesh castShadow position={[mid.x, deckY + screen.heightM / 2, mid.z]} rotation={[0, -screen.angleY, 0]}>
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

function createPoolExcavationGeometry(model: Plan3DModel) {
  const points = model.poolPoints
  if (!points || points.length < 3) {
    return null
  }

  const terrain = model.elevation.settings.terrain
  const terrainBounds = model.elevation.terrainBounds
  const poolBottomY =
    model.elevation.poolTopY - model.elevation.poolBodyHeightM - 0.015
  const center = getLabelPoint(points)
  const positions: number[] = []

  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length]
    if (!next) {
      return
    }

    const start = offsetFromCenter(point, center, 0.045)
    const end = offsetFromCenter(next, center, 0.045)
    const startTerrainY = getTerrainHeightAt(start, terrain, terrainBounds)
    const endTerrainY = getTerrainHeightAt(end, terrain, terrainBounds)

    if (
      startTerrainY <= poolBottomY + 0.05 &&
      endTerrainY <= poolBottomY + 0.05
    ) {
      return
    }

    positions.push(
      start.x,
      startTerrainY + 0.01,
      start.z,
      end.x,
      endTerrainY + 0.01,
      end.z,
      end.x,
      poolBottomY,
      end.z,
      start.x,
      startTerrainY + 0.01,
      start.z,
      end.x,
      poolBottomY,
      end.z,
      start.x,
      poolBottomY,
      start.z
    )
  })

  if (positions.length === 0) {
    return null
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()

  return geometry
}

function createPoolExcavationRimGeometry(model: Plan3DModel) {
  const points = model.poolPoints
  if (!points || points.length < 3) {
    return null
  }

  const center = getLabelPoint(points)
  const terrain = model.elevation.settings.terrain
  const terrainBounds = model.elevation.terrainBounds
  const positions: number[] = []

  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length]
    if (!next) {
      return
    }

    const start = offsetFromCenter(point, center, 0.07)
    const end = offsetFromCenter(next, center, 0.07)

    positions.push(
      start.x,
      getTerrainHeightAt(start, terrain, terrainBounds) + 0.035,
      start.z,
      end.x,
      getTerrainHeightAt(end, terrain, terrainBounds) + 0.035,
      end.z
    )
  })

  if (positions.length === 0) {
    return null
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))

  return geometry
}

function createTerrainGeometry(model: Plan3DModel) {
  const bounds = model.elevation.terrainBounds
  const terrain = model.elevation.settings.terrain
  const corners = [
    { x: bounds.minX, z: bounds.minZ },
    { x: bounds.maxX, z: bounds.minZ },
    { x: bounds.maxX, z: bounds.maxZ },
    { x: bounds.minX, z: bounds.maxZ },
  ]
  const top = corners.map((point) => ({
    ...point,
    y: getTerrainHeightAt(point, terrain, bounds),
  }))
  const positions = [
    top[0]?.x ?? 0,
    top[0]?.y ?? 0,
    top[0]?.z ?? 0,
    top[1]?.x ?? 0,
    top[1]?.y ?? 0,
    top[1]?.z ?? 0,
    top[2]?.x ?? 0,
    top[2]?.y ?? 0,
    top[2]?.z ?? 0,
    top[0]?.x ?? 0,
    top[0]?.y ?? 0,
    top[0]?.z ?? 0,
    top[2]?.x ?? 0,
    top[2]?.y ?? 0,
    top[2]?.z ?? 0,
    top[3]?.x ?? 0,
    top[3]?.y ?? 0,
    top[3]?.z ?? 0,
  ]

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()

  return geometry
}

function createPolygonSlabGeometry(
  points: Point3D[],
  thickness: number,
  holes: Point3D[][] = []
) {
  const contour = points.map((point) => new THREE.Vector2(point.x, point.z))
  const holeContours = holes.map((hole) =>
    hole.map((point) => new THREE.Vector2(point.x, point.z))
  )
  const vertices = [...points, ...holes.flat()]
  const triangles = THREE.ShapeUtils.triangulateShape(contour, holeContours)
  const positions: number[] = []

  for (const triangle of triangles) {
    for (const index of triangle) {
      const point = vertices[index]
      if (point) {
        positions.push(point.x, 0, point.z)
      }
    }
  }

  for (const triangle of triangles) {
    for (const index of [...triangle].reverse()) {
      const point = vertices[index]
      if (point) {
        positions.push(point.x, -thickness, point.z)
      }
    }
  }

  addSlabSideFaces(positions, points, thickness)
  holes.forEach((hole) => addSlabSideFaces(positions, hole, thickness))

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()

  return geometry
}

function addSlabSideFaces(
  positions: number[],
  points: Point3D[],
  thickness: number
) {
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length]
    if (!next) {
      return
    }

    positions.push(
      point.x,
      0,
      point.z,
      next.x,
      0,
      next.z,
      next.x,
      -thickness,
      next.z,
      point.x,
      0,
      point.z,
      next.x,
      -thickness,
      next.z,
      point.x,
      -thickness,
      point.z
    )
  })
}

function createPoolBodyGeometry(points: Point3D[], depthM: number) {
  const contour = points.map((point) => new THREE.Vector2(point.x, point.z))
  const triangles = THREE.ShapeUtils.triangulateShape(contour, [])
  const positions: number[] = []

  for (const triangle of triangles) {
    for (const index of [...triangle].reverse()) {
      const point = points[index]
      if (point) {
        positions.push(point.x, -depthM, point.z)
      }
    }
  }

  addSlabSideFaces(positions, points, depthM)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()

  return geometry
}

function createFlatPolygonGeometry(points: Point3D[]) {
  const contour = points.map((point) => new THREE.Vector2(point.x, point.z))
  const triangles = THREE.ShapeUtils.triangulateShape(contour, [])
  const positions: number[] = []

  for (const triangle of triangles) {
    for (const index of triangle) {
      const point = points[index]
      if (point) {
        positions.push(point.x, 0, point.z)
      }
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()

  return geometry
}

function createLineSegmentsGeometry(lines: Plan3DLine[], y: number) {
  const positions = lines.flatMap((line) => [
    line.start.x,
    y,
    line.start.z,
    line.end.x,
    y,
    line.end.z,
  ])
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))

  return geometry
}

function createLineLoopGeometry(points: Point3D[], y: number) {
  const positions: number[] = []

  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length]
    if (next) {
      positions.push(point.x, y, point.z, next.x, y, next.z)
    }
  })

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))

  return geometry
}

function getMidpoint(a: Point3D, b: Point3D) {
  return {
    x: (a.x + b.x) / 2,
    z: (a.z + b.z) / 2,
  }
}

function getLabelPoint(points: Point3D[]) {
  const total = points.reduce(
    (sum, point) => ({
      x: sum.x + point.x,
      z: sum.z + point.z,
    }),
    { x: 0, z: 0 }
  )
  const count = Math.max(1, points.length)

  return {
    x: total.x / count,
    z: total.z / count,
  }
}

function getGroundLabelPoint(model: Plan3DModel) {
  const bounds = model.elevation.terrainBounds
  const angleRad =
    (model.elevation.settings.terrain.slopeDirectionDeg * Math.PI) / 180
  const direction = {
    x: Math.sin(angleRad),
    z: Math.cos(angleRad),
  }
  const corners = [
    { x: bounds.minX + 0.7, z: bounds.minZ + 0.7 },
    { x: bounds.maxX - 0.7, z: bounds.minZ + 0.7 },
    { x: bounds.maxX - 0.7, z: bounds.maxZ - 0.7 },
    { x: bounds.minX + 0.7, z: bounds.maxZ - 0.7 },
  ]
  const point = corners.reduce((best, candidate) =>
    candidate.x * direction.x + candidate.z * direction.z >
    best.x * direction.x + best.z * direction.z
      ? candidate
      : best
  )

  return {
    ...point,
    y: getTerrainHeightAt(
      point,
      model.elevation.settings.terrain,
      model.elevation.terrainBounds
    ),
  }
}

function offsetFromCenter(point: Point3D, center: Point3D, distance: number) {
  const x = point.x - center.x
  const z = point.z - center.z
  const length = Math.hypot(x, z) || 1

  return {
    x: point.x + (x / length) * distance,
    z: point.z + (z / length) * distance,
  }
}

function formatHeightCm(valueM: number) {
  const valueCm = Math.round(mToCm(valueM))

  return `${valueCm > 0 ? "+" : ""}${valueCm} cm`
}

function getHorizontalVector(a: Point3D, b: Point3D) {
  const length = Math.hypot(b.x - a.x, b.z - a.z) || 1

  return {
    x: (b.x - a.x) / length,
    z: (b.z - a.z) / length,
  }
}
