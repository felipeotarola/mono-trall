"use client"

import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react"

import { PIXELS_PER_METER } from "@/lib/trall/constants"
import type { GeometryEdge } from "@/lib/trall/edge-model"
import {
  getBoardLineSegments,
  getEdgeNormal,
  getEdgeTangent,
  getFeatureLabel,
  getPointAtT,
  type BoardDirectionSettings,
  type DeckFeature,
  type PergolaFeature,
  type PrivacyScreenFeature,
  type RailingFeature,
  type StairFeature,
} from "@/lib/trall/features"
import { degreesToRadians, distance } from "@/lib/trall/geometry"
import type { Point } from "@/lib/trall/types"
import { trallPlanClasses } from "@/lib/trall/visual-style"

export function BoardDirectionLayer({
  boardDirection,
  deckPoints,
}: {
  boardDirection: BoardDirectionSettings
  deckPoints: Point[]
}) {
  const lines = getBoardLineSegments({
    angleDeg: boardDirection.boardDirectionDeg,
    points: deckPoints,
  })

  return (
    <g clipPath="url(#deck-clip)" className="pointer-events-none">
      {lines.map((line, index) => (
        <line
          key={`board-line-${index}`}
          x1={line.start.x}
          y1={line.start.y}
          x2={line.end.x}
          y2={line.end.y}
          className={trallPlanClasses.deckBoardLine}
          strokeWidth="3"
        />
      ))}
    </g>
  )
}

export function FeatureRenderer({
  deckPoints,
  edges,
  features,
  onPergolaPointerDown,
  onStairPointerDown,
  onSelectFeature,
  selectedFeatureId,
}: {
  deckPoints: Point[]
  edges: GeometryEdge[]
  features: DeckFeature[]
  onPergolaPointerDown?: (
    event: ReactPointerEvent<SVGGElement>,
    feature: PergolaFeature
  ) => void
  onStairPointerDown?: (
    event: ReactPointerEvent<SVGGElement>,
    feature: StairFeature
  ) => void
  onSelectFeature: (featureId: string) => void
  selectedFeatureId: string | null
}) {
  return (
    <g>
      {features.map((feature) => (
        <FeatureSymbol
          key={feature.id}
          deckPoints={deckPoints}
          edges={edges}
          feature={feature}
          selected={feature.id === selectedFeatureId}
          onPergolaPointerDown={onPergolaPointerDown}
          onStairPointerDown={onStairPointerDown}
          onSelect={() => onSelectFeature(feature.id)}
        />
      ))}
    </g>
  )
}

function FeatureSymbol({
  deckPoints,
  edges,
  feature,
  onPergolaPointerDown,
  onStairPointerDown,
  onSelect,
  selected,
}: {
  deckPoints: Point[]
  edges: GeometryEdge[]
  feature: DeckFeature
  onPergolaPointerDown?: (
    event: ReactPointerEvent<SVGGElement>,
    feature: PergolaFeature
  ) => void
  onStairPointerDown?: (
    event: ReactPointerEvent<SVGGElement>,
    feature: StairFeature
  ) => void
  onSelect: () => void
  selected: boolean
}) {
  if (feature.type === "stairs") {
    return (
      <StairsSymbol
        deckPoints={deckPoints}
        edges={edges}
        feature={feature}
        selected={selected}
        onPointerDown={onStairPointerDown}
        onSelect={onSelect}
      />
    )
  }

  if (feature.type === "railing") {
    return (
      <RailingSymbol
        deckPoints={deckPoints}
        edges={edges}
        feature={feature}
        selected={selected}
        onSelect={onSelect}
      />
    )
  }

  if (feature.type === "pergola") {
    return (
      <PergolaSymbol
        feature={feature}
        onPointerDown={onPergolaPointerDown}
        selected={selected}
        onSelect={onSelect}
      />
    )
  }

  return (
    <PrivacyScreenSymbol
      deckPoints={deckPoints}
      edges={edges}
      feature={feature}
      selected={selected}
      onSelect={onSelect}
    />
  )
}

function StairsSymbol({
  deckPoints,
  edges,
  feature,
  onPointerDown,
  onSelect,
  selected,
}: {
  deckPoints: Point[]
  edges: GeometryEdge[]
  feature: StairFeature
  onPointerDown?: (
    event: ReactPointerEvent<SVGGElement>,
    feature: StairFeature
  ) => void
  onSelect: () => void
  selected: boolean
}) {
  const edge = edges.find((item) => item.id === feature.edgeId)
  if (!edge) {
    return null
  }

  const normalBase = getEdgeNormal(edge, deckPoints)
  const normal =
    feature.direction === "inward"
      ? { x: -normalBase.x, y: -normalBase.y }
      : normalBase
  const tangent = getEdgeTangent(edge)
  const width = feature.widthM * PIXELS_PER_METER
  const depth = feature.depthM * PIXELS_PER_METER
  const anchor = getPointAtT(edge, feature.positionT)
  const a = {
    x: anchor.x - tangent.x * (width / 2),
    y: anchor.y - tangent.y * (width / 2),
  }
  const b = {
    x: anchor.x + tangent.x * (width / 2),
    y: anchor.y + tangent.y * (width / 2),
  }
  const c = { x: b.x + normal.x * depth, y: b.y + normal.y * depth }
  const d = { x: a.x + normal.x * depth, y: a.y + normal.y * depth }
  const steps = Array.from(
    { length: Math.max(1, feature.stepCount - 1) },
    (_, index) => (index + 1) / feature.stepCount
  )

  return (
    <g
      data-interactive="true"
      className="cursor-grab active:cursor-grabbing"
      onClick={stopAnd(onSelect)}
      onPointerDown={(event) => onPointerDown?.(event, feature)}
    >
      <polygon
        points={toPoints([a, b, c, d])}
        className={
          selected
            ? "fill-amber-100/85 stroke-amber-800"
            : "fill-amber-100/70 stroke-amber-700/70"
        }
        strokeLinejoin="round"
        strokeWidth={selected ? "4" : "3"}
      />
      {steps.map((t) => {
        const start = {
          x: a.x + normal.x * depth * t,
          y: a.y + normal.y * depth * t,
        }
        const end = {
          x: b.x + normal.x * depth * t,
          y: b.y + normal.y * depth * t,
        }

        return (
          <line
            key={t}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            className="pointer-events-none stroke-amber-900/45"
            strokeWidth="2"
          />
        )
      })}
      {selected ? (
        <>
          <DragHandle point={anchor} />
          <FeatureLabel
            point={{
              x: anchor.x + normal.x * (depth + 22),
              y: anchor.y + normal.y * (depth + 22),
            }}
            text={getFeatureLabel(feature)}
          />
        </>
      ) : null}
    </g>
  )
}

function RailingSymbol({
  deckPoints,
  edges,
  feature,
  onSelect,
  selected,
}: {
  deckPoints: Point[]
  edges: GeometryEdge[]
  feature: RailingFeature
  onSelect: () => void
  selected: boolean
}) {
  const featureEdges = feature.edgeIds
    .map((edgeId) => edges.find((edge) => edge.id === edgeId))
    .filter((edge): edge is GeometryEdge => Boolean(edge))

  if (featureEdges.length === 0) {
    return null
  }

  return (
    <g data-interactive="true" onClick={stopAnd(onSelect)}>
      {featureEdges.map((edge) => {
        const normal = getEdgeNormal(edge, deckPoints)
        const start = {
          x: edge.start.x + normal.x * 13,
          y: edge.start.y + normal.y * 13,
        }
        const end = {
          x: edge.end.x + normal.x * 13,
          y: edge.end.y + normal.y * 13,
        }
        const postCount = Math.max(2, Math.ceil(edge.length / 0.8) + 1)
        const posts = Array.from({ length: postCount }, (_, index) => {
          const t = postCount === 1 ? 0 : index / (postCount - 1)
          return {
            x: start.x + (end.x - start.x) * t,
            y: start.y + (end.y - start.y) * t,
          }
        })
        const strokeClass =
          feature.style === "glass"
            ? "stroke-sky-500/80"
            : feature.style === "metal"
              ? "stroke-zinc-700"
              : "stroke-amber-900"

        return (
          <g key={edge.id}>
            <line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              className={`cursor-pointer ${strokeClass}`}
              strokeLinecap="round"
              strokeWidth={selected ? "6" : "4"}
            />
            {posts.map((post, index) => (
              <circle
                key={`${edge.id}-post-${index}`}
                cx={post.x}
                cy={post.y}
                r={selected ? "5" : "4"}
                className="fill-white stroke-zinc-800"
                strokeWidth="2"
              />
            ))}
          </g>
        )
      })}
      {selected ? (
        <FeatureLabel
          point={getFeatureLabelPoint(featureEdges[0], deckPoints, 26)}
          text={getFeatureLabel(feature)}
        />
      ) : null}
    </g>
  )
}

function PergolaSymbol({
  feature,
  onPointerDown,
  onSelect,
  selected,
}: {
  feature: PergolaFeature
  onPointerDown?: (
    event: ReactPointerEvent<SVGGElement>,
    feature: PergolaFeature
  ) => void
  onSelect: () => void
  selected: boolean
}) {
  const width = feature.widthM * PIXELS_PER_METER
  const depth = feature.depthM * PIXELS_PER_METER
  const rad = degreesToRadians(feature.rotationDeg)
  const corners = [
    rotatePoint({ x: -width / 2, y: -depth / 2 }, rad, feature),
    rotatePoint({ x: width / 2, y: -depth / 2 }, rad, feature),
    rotatePoint({ x: width / 2, y: depth / 2 }, rad, feature),
    rotatePoint({ x: -width / 2, y: depth / 2 }, rad, feature),
  ]
  const posts = getPergolaPosts(corners, feature.postCount)
  const slats = Array.from({ length: 5 }, (_, index) => {
    const y = -depth / 2 + (depth * (index + 1)) / 6
    return {
      start: rotatePoint({ x: -width / 2, y }, rad, feature),
      end: rotatePoint({ x: width / 2, y }, rad, feature),
    }
  })

  return (
    <g
      data-interactive="true"
      className="cursor-grab active:cursor-grabbing"
      onClick={stopAnd(onSelect)}
      onPointerDown={(event) => onPointerDown?.(event, feature)}
    >
      <polygon
        points={toPoints(corners)}
        className={
          selected
            ? "fill-orange-100/35 stroke-orange-700"
            : "fill-orange-100/25 stroke-orange-700/70"
        }
        strokeDasharray="10 6"
        strokeLinejoin="round"
        strokeWidth={selected ? "4" : "3"}
      />
      {slats.map((slat, index) => (
        <line
          key={`pergola-slat-${index}`}
          x1={slat.start.x}
          y1={slat.start.y}
          x2={slat.end.x}
          y2={slat.end.y}
          className="pointer-events-none stroke-orange-800/45"
          strokeWidth="2"
        />
      ))}
      {posts.map((corner, index) => (
        <rect
          key={`pergola-post-${index}`}
          x={corner.x - 6}
          y={corner.y - 6}
          width="12"
          height="12"
          rx="2"
          className="fill-white stroke-orange-800"
          strokeWidth="2"
        />
      ))}
      {selected ? (
        <>
          <DragHandle point={feature} />
          <FeatureLabel
            point={{ x: feature.x, y: feature.y - depth / 2 - 22 }}
            text={getFeatureLabel(feature)}
          />
        </>
      ) : null}
    </g>
  )
}

function DragHandle({ point }: { point: Point }) {
  return (
    <g className="pointer-events-none">
      <circle
        cx={point.x}
        cy={point.y}
        r="14"
        className="fill-white/95 stroke-stone-700"
        strokeWidth="2"
      />
      <line
        x1={point.x - 6}
        x2={point.x + 6}
        y1={point.y - 4}
        y2={point.y - 4}
        className="stroke-stone-700"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1={point.x - 6}
        x2={point.x + 6}
        y1={point.y}
        y2={point.y}
        className="stroke-stone-700"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1={point.x - 6}
        x2={point.x + 6}
        y1={point.y + 4}
        y2={point.y + 4}
        className="stroke-stone-700"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
  )
}

function PrivacyScreenSymbol({
  deckPoints,
  edges,
  feature,
  onSelect,
  selected,
}: {
  deckPoints: Point[]
  edges: GeometryEdge[]
  feature: PrivacyScreenFeature
  onSelect: () => void
  selected: boolean
}) {
  const edge = edges.find((item) => item.id === feature.edgeId)
  if (!edge) {
    return null
  }

  const normal = getEdgeNormal(edge, deckPoints)
  const start = getPointAtT(edge, feature.startT)
  const end = getPointAtT(edge, feature.endT)
  const offsetStart = {
    x: start.x + normal.x * 18,
    y: start.y + normal.y * 18,
  }
  const offsetEnd = {
    x: end.x + normal.x * 18,
    y: end.y + normal.y * 18,
  }
  const hatchCount = Math.max(3, Math.ceil(distance(start, end) / 38))
  const hatches = Array.from({ length: hatchCount }, (_, index) => {
    const t = hatchCount === 1 ? 0 : index / (hatchCount - 1)
    const point = {
      x: offsetStart.x + (offsetEnd.x - offsetStart.x) * t,
      y: offsetStart.y + (offsetEnd.y - offsetStart.y) * t,
    }
    return {
      start: {
        x: point.x - normal.x * 9,
        y: point.y - normal.y * 9,
      },
      end: {
        x: point.x + normal.x * 9,
        y: point.y + normal.y * 9,
      },
    }
  })
  const strokeClass =
    feature.style === "greenery"
      ? "stroke-emerald-700"
      : feature.style === "solid"
        ? "stroke-zinc-800"
        : "stroke-stone-700"

  return (
    <g data-interactive="true" onClick={stopAnd(onSelect)}>
      <line
        x1={offsetStart.x}
        y1={offsetStart.y}
        x2={offsetEnd.x}
        y2={offsetEnd.y}
        className={`cursor-pointer ${strokeClass}`}
        strokeLinecap="round"
        strokeWidth={selected ? "12" : "9"}
        opacity="0.9"
      />
      {hatches.map((hatch, index) => (
        <line
          key={`privacy-hatch-${index}`}
          x1={hatch.start.x}
          y1={hatch.start.y}
          x2={hatch.end.x}
          y2={hatch.end.y}
          className="pointer-events-none stroke-white"
          strokeLinecap="round"
          strokeWidth="2"
          opacity="0.9"
        />
      ))}
      {selected ? (
        <FeatureLabel
          point={getFeatureLabelPoint(edge, deckPoints, 34)}
          text={getFeatureLabel(feature)}
        />
      ) : null}
    </g>
  )
}

function FeatureLabel({ point, text }: { point: Point; text: string }) {
  return (
    <g className="pointer-events-none">
      <rect
        x={point.x - 52}
        y={point.y - 17}
        width="104"
        height="24"
        rx="6"
        className="fill-white/95 stroke-stone-300"
      />
      <text
        x={point.x}
        y={point.y}
        textAnchor="middle"
        className="fill-stone-800 text-[12px] font-semibold"
      >
        {text}
      </text>
    </g>
  )
}

function getFeatureLabelPoint(
  edge: GeometryEdge | undefined,
  deckPoints: Point[],
  offset: number
) {
  if (!edge) {
    return { x: 0, y: 0 }
  }

  const normal = getEdgeNormal(edge, deckPoints)
  const midpoint = getPointAtT(edge, 0.5)
  return {
    x: midpoint.x + normal.x * offset,
    y: midpoint.y + normal.y * offset,
  }
}

function getPergolaPosts(corners: Point[], postCount: number) {
  const clampedPostCount = Math.max(4, Math.min(12, Math.round(postCount)))
  if (clampedPostCount <= 4) {
    return corners
  }

  const extraPosts = clampedPostCount - 4
  const posts = [...corners]
  const divisionsPerSide = Math.ceil(extraPosts / 4) + 1

  for (let index = 0; index < extraPosts; index += 1) {
    const sideIndex = index % 4
    const sequence = Math.floor(index / 4) + 1
    const start = corners[sideIndex]
    const end = corners[(sideIndex + 1) % corners.length]
    if (!start || !end) {
      continue
    }

    posts.push({
      x: start.x + (end.x - start.x) * (sequence / divisionsPerSide),
      y: start.y + (end.y - start.y) * (sequence / divisionsPerSide),
    })
  }

  return posts
}

function rotatePoint(
  point: Point,
  rad: number,
  center: { x: number; y: number }
): Point {
  return {
    x: center.x + point.x * Math.cos(rad) - point.y * Math.sin(rad),
    y: center.y + point.x * Math.sin(rad) + point.y * Math.cos(rad),
  }
}

function toPoints(points: Point[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ")
}

function stopAnd(handler: () => void) {
  return (event: ReactMouseEvent<SVGGElement>) => {
    event.preventDefault()
    event.stopPropagation()
    handler()
  }
}
