"use client"

/* eslint-disable react/no-unknown-property */

import { useEffect, useMemo, useRef, type ElementRef } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
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
import type { HouseBounds, Point } from "@/lib/trall/types"
import { Button } from "@workspace/ui/components/button"

const DECK_THICKNESS_M = 0.18
const BOARD_LINE_LIMIT = 72

export function Plan3DView({
  boardDirection,
  deckEdgeConstraints,
  deckPoints,
  features,
  houseBounds,
  poolPoints,
}: {
  boardDirection: BoardDirectionSettings
  deckEdgeConstraints: EdgeConstraint[]
  deckPoints: Point[]
  features: DeckFeature[]
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
        features,
        houseBounds,
        poolPoints,
      }),
    [
      boardDirection,
      deckEdgeConstraints,
      deckPoints,
      features,
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
          <GroundPlane model={model} />
          <HouseMass model={model} />
          <DeckSlab model={model} />
          <PoolSurface points={model.poolPoints} />
          <BoardLines lines={model.boardLines} />
          <Railings model={model} />
          <Stairs model={model} />
          <Pergolas model={model} />
          <PrivacyScreens model={model} />
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

function GroundPlane({ model }: { model: Plan3DModel }) {
  const size = Math.max(16, model.bounds.diagonalM * 1.8)

  return (
    <mesh receiveShadow position={[0, -DECK_THICKNESS_M - 0.025, 0]}>
      <boxGeometry args={[size, 0.025, size]} />
      <meshStandardMaterial color="#c9c2b5" roughness={0.94} />
    </mesh>
  )
}

function HouseMass({ model }: { model: Plan3DModel }) {
  return (
    <group position={[model.house.center.x, 0, model.house.center.z]}>
      <mesh castShadow receiveShadow position={[0, 0.9, 0]}>
        <boxGeometry args={[model.house.widthM, 1.8, model.house.depthM]} />
        <meshStandardMaterial color="#d8d3ca" roughness={0.82} />
      </mesh>
      <mesh position={[0, 1.83, 0]}>
        <boxGeometry args={[model.house.widthM + 0.2, 0.12, model.house.depthM + 0.2]} />
        <meshStandardMaterial color="#77736b" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.82, model.house.depthM / 2 + 0.011]}>
        <boxGeometry args={[1.2, 1.35, 0.025]} />
        <meshStandardMaterial color="#8c6f4f" roughness={0.7} />
      </mesh>
    </group>
  )
}

function DeckSlab({ model }: { model: Plan3DModel }) {
  const geometry = useMemo(
    () => createPolygonSlabGeometry(model.deckPoints, DECK_THICKNESS_M),
    [model.deckPoints]
  )

  return (
    <mesh castShadow receiveShadow geometry={geometry}>
      <meshStandardMaterial
        color="#a87948"
        roughness={0.78}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function PoolSurface({ points }: { points: Point3D[] | null }) {
  const geometry = useMemo(
    () => (points ? createFlatPolygonGeometry(points) : null),
    [points]
  )
  const borderGeometry = useMemo(
    () => (points ? createLineLoopGeometry(points, 0.016) : null),
    [points]
  )

  if (!geometry || !borderGeometry) {
    return null
  }

  return (
    <group position={[0, 0.012, 0]}>
      <mesh receiveShadow geometry={geometry}>
        <meshStandardMaterial
          color="#2b8fd6"
          metalness={0.05}
          roughness={0.28}
          side={THREE.DoubleSide}
        />
      </mesh>
      <lineSegments geometry={borderGeometry}>
        <lineBasicMaterial color="#d7eefb" linewidth={1} />
      </lineSegments>
    </group>
  )
}

function BoardLines({ lines }: { lines: Plan3DLine[] }) {
  const visibleLines = lines.slice(0, BOARD_LINE_LIMIT)
  const geometry = useMemo(() => createLineSegmentsGeometry(visibleLines, 0.026), [visibleLines])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#6f4b2f" transparent opacity={0.32} />
    </lineSegments>
  )
}

function Railings({ model }: { model: Plan3DModel }) {
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
              position={[mid.x, railing.heightM, mid.z]}
              rotation={[0, -railing.edge.angleY, 0]}
            >
              <boxGeometry args={[railing.edge.lengthM, 0.08, 0.08]} />
              <meshStandardMaterial color={railColor} roughness={0.66} transparent={railing.style === "glass"} opacity={railing.style === "glass" ? 0.58 : 1} />
            </mesh>
            <mesh
              castShadow
              position={[mid.x, railing.heightM * 0.55, mid.z]}
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
                  position={[point.x, railing.heightM / 2, point.z]}
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
  return (
    <>
      {model.stairs.map((stairs) => {
        const stepDepth = stairs.depthM / Math.max(1, stairs.stepCount)
        const stepHeight = DECK_THICKNESS_M / Math.max(1, stairs.stepCount)

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
                  position={[center.x, -DECK_THICKNESS_M + height / 2, center.z]}
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
            position={[pergola.center.x, 0, pergola.center.z]}
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
                  <mesh key={`${screen.id}-slat-${index}`} castShadow position={[point.x, screen.heightM / 2, point.z]} rotation={[0, -screen.angleY, 0]}>
                    <boxGeometry args={[0.06, screen.heightM, 0.08]} />
                    <meshStandardMaterial color={color} roughness={0.76} />
                  </mesh>
                )
              })
            ) : (
              <mesh castShadow position={[mid.x, screen.heightM / 2, mid.z]} rotation={[0, -screen.angleY, 0]}>
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

function createPolygonSlabGeometry(points: Point3D[], thickness: number) {
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

  for (const triangle of triangles) {
    for (const index of [...triangle].reverse()) {
      const point = points[index]
      if (point) {
        positions.push(point.x, -thickness, point.z)
      }
    }
  }

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

function getHorizontalVector(a: Point3D, b: Point3D) {
  const length = Math.hypot(b.x - a.x, b.z - a.z) || 1

  return {
    x: (b.x - a.x) / length,
    z: (b.z - a.z) / length,
  }
}
