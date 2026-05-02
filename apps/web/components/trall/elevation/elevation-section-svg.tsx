"use client"

import {
  getPoolDeckRelationship,
  type ElevationSettings,
} from "@/lib/trall/elevation"

const SVG_WIDTH = 900
const SVG_HEIGHT = 430
const TOP_PADDING = 32
const BOTTOM_PADDING = 58

export function ElevationSectionSvg({
  elevation,
  hasPool,
}: {
  elevation: ElevationSettings
  hasPool: boolean
}) {
  const deckSurfaceCm = elevation.groundLevelCm + elevation.deckHeightCm
  const deckBottomCm = deckSurfaceCm - elevation.deckThicknessCm
  const poolTopCm = elevation.groundLevelCm + elevation.poolTopHeightCm
  const poolBottomCm = poolTopCm - elevation.poolDepthCm
  const houseFloorCm = elevation.groundLevelCm + elevation.houseFloorHeightCm
  const relationship = getPoolDeckRelationship(elevation)

  const minHeightCm =
    Math.min(elevation.groundLevelCm, poolBottomCm, deckBottomCm) - 24
  const maxHeightCm = Math.max(deckSurfaceCm, poolTopCm, houseFloorCm) + 40
  const yForHeight = (heightCm: number) =>
    TOP_PADDING +
    ((maxHeightCm - heightCm) / (maxHeightCm - minHeightCm)) *
      (SVG_HEIGHT - TOP_PADDING - BOTTOM_PADDING)

  const groundY = yForHeight(elevation.groundLevelCm)
  const deckTopY = yForHeight(deckSurfaceCm)
  const deckBottomY = yForHeight(deckBottomCm)
  const poolTopY = yForHeight(poolTopCm)
  const poolBottomY = yForHeight(poolBottomCm)
  const houseFloorY = yForHeight(houseFloorCm)

  return (
    <svg
      aria-label="Side elevation drawing"
      className="h-full min-h-[360px] w-full"
      role="img"
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
    >
      <defs>
        <pattern
          id="elevation-grid"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeWidth="1"
          />
        </pattern>
      </defs>

      <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="hsl(var(--background))" />
      <rect
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
        fill="url(#elevation-grid)"
        className="text-foreground"
      />

      <line
        x1="48"
        x2="852"
        y1={groundY}
        y2={groundY}
        stroke="hsl(var(--foreground))"
        strokeWidth="1.5"
      />
      <text
        x="52"
        y={groundY - 10}
        fill="hsl(var(--muted-foreground))"
        fontSize="13"
      >
        Ground {elevation.groundLevelCm} cm
      </text>

      <HouseSection x={88} yTop={54} floorY={houseFloorY} groundY={groundY} />
      <DeckSection
        bottomY={deckBottomY}
        labelY={deckTopY}
        topY={deckTopY}
      />
      {hasPool ? (
        <PoolSection bottomY={poolBottomY} topY={poolTopY} />
      ) : (
        <NoPoolSection groundY={groundY} />
      )}

      <HeightMarker
        label={`House floor ${elevation.houseFloorHeightCm} cm`}
        x={238}
        y={houseFloorY}
      />
      <HeightMarker
        label={`Deck surface ${elevation.deckHeightCm} cm`}
        x={474}
        y={deckTopY}
      />
      <ThicknessMarker
        bottomY={deckBottomY}
        label={`${elevation.deckThicknessCm} cm deck build-up`}
        x={678}
        topY={deckTopY}
      />
      {hasPool ? (
        <>
          <HeightMarker
            label={`Pool top ${elevation.poolTopHeightCm} cm`}
            x={806}
            y={poolTopY}
          />
          <DepthMarker
            bottomY={poolBottomY}
            label={`${elevation.poolDepthCm} cm pool depth`}
            x={840}
            topY={poolTopY}
          />
        </>
      ) : null}

      <text
        x="450"
        y="404"
        fill={
          relationship.status === "flush"
            ? "hsl(var(--foreground))"
            : "hsl(var(--muted-foreground))"
        }
        fontSize="14"
        fontWeight="600"
        textAnchor="middle"
      >
        {hasPool ? relationship.label : "Add a pool in Top view to inspect it here"}
      </text>
    </svg>
  )
}

function HouseSection({
  floorY,
  groundY,
  x,
  yTop,
}: {
  floorY: number
  groundY: number
  x: number
  yTop: number
}) {
  return (
    <g>
      <rect
        x={x}
        y={yTop}
        width="128"
        height={groundY - yTop}
        fill="hsl(var(--muted))"
        stroke="hsl(var(--border))"
      />
      <line
        x1={x}
        x2={x + 128}
        y1={floorY}
        y2={floorY}
        stroke="hsl(var(--foreground))"
        strokeWidth="2"
      />
      <text
        x={x + 64}
        y={yTop + 24}
        fill="hsl(var(--muted-foreground))"
        fontSize="13"
        fontWeight="600"
        textAnchor="middle"
      >
        House
      </text>
    </g>
  )
}

function DeckSection({
  bottomY,
  labelY,
  topY,
}: {
  bottomY: number
  labelY: number
  topY: number
}) {
  return (
    <g>
      <rect
        x="304"
        y={topY}
        width="330"
        height={Math.max(6, bottomY - topY)}
        fill="hsl(35 30% 72%)"
        stroke="hsl(35 22% 42%)"
      />
      <line
        x1="304"
        x2="634"
        y1={topY}
        y2={topY}
        stroke="hsl(35 28% 28%)"
        strokeWidth="2"
      />
      <text
        x="469"
        y={labelY - 12}
        fill="hsl(var(--foreground))"
        fontSize="13"
        fontWeight="600"
        textAnchor="middle"
      >
        Deck
      </text>
    </g>
  )
}

function PoolSection({ bottomY, topY }: { bottomY: number; topY: number }) {
  return (
    <g>
      <rect
        x="700"
        y={topY}
        width="86"
        height={Math.max(10, bottomY - topY)}
        fill="hsl(199 70% 88%)"
        stroke="hsl(199 42% 46%)"
      />
      <line
        x1="690"
        x2="796"
        y1={topY}
        y2={topY}
        stroke="hsl(199 48% 30%)"
        strokeWidth="2"
      />
      <text
        x="743"
        y={topY - 12}
        fill="hsl(var(--foreground))"
        fontSize="13"
        fontWeight="600"
        textAnchor="middle"
      >
        Pool
      </text>
    </g>
  )
}

function NoPoolSection({ groundY }: { groundY: number }) {
  return (
    <g opacity="0.65">
      <rect
        x="700"
        y={groundY - 70}
        width="86"
        height="70"
        fill="none"
        stroke="hsl(var(--border))"
        strokeDasharray="6 6"
      />
      <text
        x="743"
        y={groundY - 82}
        fill="hsl(var(--muted-foreground))"
        fontSize="13"
        fontWeight="600"
        textAnchor="middle"
      >
        No pool
      </text>
    </g>
  )
}

function HeightMarker({
  label,
  x,
  y,
}: {
  label: string
  x: number
  y: number
}) {
  return (
    <g>
      <line
        x1={x - 36}
        x2={x + 36}
        y1={y}
        y2={y}
        stroke="hsl(var(--foreground))"
        strokeDasharray="3 4"
        strokeOpacity="0.7"
      />
      <text
        x={x}
        y={y - 8}
        fill="hsl(var(--muted-foreground))"
        fontSize="12"
        textAnchor="middle"
      >
        {label}
      </text>
    </g>
  )
}

function ThicknessMarker({
  bottomY,
  label,
  topY,
  x,
}: {
  bottomY: number
  label: string
  topY: number
  x: number
}) {
  return (
    <g>
      <MeasurementLine bottomY={bottomY} topY={topY} x={x} />
      <text
        x={x + 8}
        y={(topY + bottomY) / 2 + 4}
        fill="hsl(var(--muted-foreground))"
        fontSize="12"
      >
        {label}
      </text>
    </g>
  )
}

function DepthMarker({
  bottomY,
  label,
  topY,
  x,
}: {
  bottomY: number
  label: string
  topY: number
  x: number
}) {
  return (
    <g>
      <MeasurementLine bottomY={bottomY} topY={topY} x={x} />
      <text
        x={x - 8}
        y={(topY + bottomY) / 2 + 4}
        fill="hsl(var(--muted-foreground))"
        fontSize="12"
        textAnchor="end"
      >
        {label}
      </text>
    </g>
  )
}

function MeasurementLine({
  bottomY,
  topY,
  x,
}: {
  bottomY: number
  topY: number
  x: number
}) {
  return (
    <g>
      <line
        x1={x}
        x2={x}
        y1={topY}
        y2={bottomY}
        stroke="hsl(var(--foreground))"
        strokeWidth="1"
      />
      <line
        x1={x - 5}
        x2={x + 5}
        y1={topY}
        y2={topY}
        stroke="hsl(var(--foreground))"
      />
      <line
        x1={x - 5}
        x2={x + 5}
        y1={bottomY}
        y2={bottomY}
        stroke="hsl(var(--foreground))"
      />
    </g>
  )
}
