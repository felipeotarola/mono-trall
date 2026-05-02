"use client"

import {
  getPoolDeckRelationship,
  type ElevationSettings,
} from "@/lib/trall/elevation"

const SVG_WIDTH = 1180
const SVG_HEIGHT = 680
const CHART_TOP = 72
const CHART_BOTTOM = 580
const COLORS = {
  canvas: "#fffdf7",
  grid: "#e6e0d4",
  gridStrong: "#d8d0c2",
  ink: "#1f2933",
  muted: "#687385",
  ground: "#6f6658",
  soil: "#e8dfcf",
  wall: "#f2f0ea",
  foundation: "#d2d6dc",
  deck: "#c7a36f",
  deckDark: "#7b5b31",
  deckEdge: "#8a6a3d",
  timberLine: "#9c7a48",
  poolShell: "#d8e5ed",
  water: "#9fd3e5",
  poolEdge: "#2f6f86",
  dimension: "#344054",
  positive: "#15803d",
  warning: "#b45309",
}

export function ElevationSectionSvg({
  elevation,
  hasPool,
}: {
  elevation: ElevationSettings
  hasPool: boolean
}) {
  const model = getElevationModel(elevation)
  const relationship = getPoolDeckRelationship(elevation)
  const relationshipColor =
    relationship.status === "flush" ? COLORS.positive : COLORS.warning

  return (
    <svg
      aria-label="Architectural side elevation drawing"
      className="h-full min-h-[430px] w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
    >
      <defs>
        <pattern
          id="elevation-fine-grid"
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 32 0 L 0 0 0 32"
            fill="none"
            stroke={COLORS.grid}
            strokeWidth="1"
          />
        </pattern>
        <pattern
          id="ground-hatch"
          width="18"
          height="18"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M -4 18 L 18 -4 M 4 22 L 22 4"
            fill="none"
            stroke="#cfc2ad"
            strokeWidth="1"
          />
        </pattern>
      </defs>

      <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill={COLORS.canvas} />
      <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#elevation-fine-grid)" />
      <GridDatum y={model.yForHeight(0)} label="0 cm datum" />

      <Ground y={model.groundY} />
      <HouseSection floorY={model.houseFloorY} groundY={model.groundY} />
      <DeckSection bottomY={model.deckBottomY} topY={model.deckTopY} />
      {hasPool ? (
        <PoolSection bottomY={model.poolBottomY} topY={model.poolTopY} />
      ) : (
        <NoPoolSection groundY={model.groundY} />
      )}

      <HeightRuler
        label={`House floor ${elevation.houseFloorHeightCm} cm`}
        valueCm={elevation.houseFloorHeightCm}
        x={266}
        y={model.houseFloorY}
        yGround={model.groundY}
      />
      <HeightRuler
        label={`Deck height ${elevation.deckHeightCm} cm`}
        valueCm={elevation.deckHeightCm}
        x={500}
        y={model.deckTopY}
        yGround={model.groundY}
      />
      <VerticalDimension
        bottomY={model.deckBottomY}
        label={`${elevation.deckThicknessCm} cm deck thickness`}
        labelSide="right"
        x={790}
        topY={model.deckTopY}
      />

      {hasPool ? (
        <>
          <HeightRuler
            label={`Pool top ${elevation.poolTopHeightCm} cm`}
            valueCm={elevation.poolTopHeightCm}
            x={1018}
            y={model.poolTopY}
            yGround={model.groundY}
          />
          <VerticalDimension
            bottomY={model.poolBottomY}
            label={`${elevation.poolDepthCm} cm pool depth`}
            labelSide="left"
            x={1096}
            topY={model.poolTopY}
          />
          <PoolDeckDelta
            deckY={model.deckTopY}
            label={
              relationship.status === "flush"
                ? "Flush"
                : `${Math.abs(relationship.deltaCm)} cm`
            }
            poolY={model.poolTopY}
            status={relationship.status}
          />
        </>
      ) : null}

      <g>
        <rect
          x="412"
          y="610"
          width="356"
          height="34"
          rx="17"
          fill="#ffffff"
          stroke={relationshipColor}
        />
        <circle cx="431" cy="627" r="5" fill={relationshipColor} />
        <text
          x="448"
          y="632"
          fill={COLORS.ink}
          fontSize="15"
          fontWeight="700"
        >
          {hasPool
            ? relationship.label
            : "Add a pool in Top view to inspect pool height"}
        </text>
      </g>
    </svg>
  )
}

function getElevationModel(elevation: ElevationSettings) {
  const deckTopCm = elevation.groundLevelCm + elevation.deckHeightCm
  const deckBottomCm = deckTopCm - elevation.deckThicknessCm
  const poolTopCm = elevation.groundLevelCm + elevation.poolTopHeightCm
  const poolBottomCm = poolTopCm - elevation.poolDepthCm
  const houseFloorCm = elevation.groundLevelCm + elevation.houseFloorHeightCm
  const minCm =
    Math.min(elevation.groundLevelCm, deckBottomCm, poolBottomCm) - 28
  const maxCm = Math.max(deckTopCm, poolTopCm, houseFloorCm) + 48
  const yForHeight = (heightCm: number) =>
    CHART_TOP +
    ((maxCm - heightCm) / (maxCm - minCm)) * (CHART_BOTTOM - CHART_TOP)

  return {
    deckBottomY: yForHeight(deckBottomCm),
    deckTopY: yForHeight(deckTopCm),
    groundY: yForHeight(elevation.groundLevelCm),
    houseFloorY: yForHeight(houseFloorCm),
    poolBottomY: yForHeight(poolBottomCm),
    poolTopY: yForHeight(poolTopCm),
    yForHeight,
  }
}

function GridDatum({ label, y }: { label: string; y: number }) {
  return (
    <g opacity="0.72">
      <line
        x1="48"
        x2="1132"
        y1={y}
        y2={y}
        stroke={COLORS.gridStrong}
        strokeDasharray="6 8"
      />
      <text x="58" y={y - 8} fill={COLORS.muted} fontSize="12">
        {label}
      </text>
    </g>
  )
}

function Ground({ y }: { y: number }) {
  return (
    <g>
      <rect
        x="48"
        y={y}
        width="1084"
        height={CHART_BOTTOM - y + 36}
        fill={COLORS.soil}
      />
      <rect
        x="48"
        y={y + 10}
        width="1084"
        height={CHART_BOTTOM - y + 26}
        fill="url(#ground-hatch)"
        opacity="0.55"
      />
      <line
        x1="48"
        x2="1132"
        y1={y}
        y2={y}
        stroke={COLORS.ground}
        strokeWidth="2.5"
      />
      <text x="58" y={y - 14} fill={COLORS.ground} fontSize="14" fontWeight="700">
        Ground level
      </text>
    </g>
  )
}

function HouseSection({
  floorY,
  groundY,
}: {
  floorY: number
  groundY: number
}) {
  const wallTop = 82

  return (
    <g>
      <rect
        x="82"
        y={wallTop}
        width="170"
        height={groundY - wallTop}
        fill={COLORS.wall}
        stroke="#c9c5bd"
        strokeWidth="1.5"
      />
      <rect
        x="82"
        y={groundY - 46}
        width="170"
        height="46"
        fill={COLORS.foundation}
        stroke="#a9b0bb"
      />
      <line
        x1="82"
        x2="252"
        y1={floorY}
        y2={floorY}
        stroke={COLORS.ink}
        strokeWidth="3"
      />
      <text x="106" y="116" fill={COLORS.ink} fontSize="18" fontWeight="800">
        House
      </text>
      <text x="106" y="138" fill={COLORS.muted} fontSize="13">
        wall and floor datum
      </text>
    </g>
  )
}

function DeckSection({ bottomY, topY }: { bottomY: number; topY: number }) {
  const height = Math.max(16, bottomY - topY)

  return (
    <g>
      <rect
        x="330"
        y={topY}
        width="438"
        height={height}
        fill={COLORS.deck}
        stroke={COLORS.deckEdge}
        strokeWidth="1.5"
      />
      {Array.from({ length: 8 }).map((_, index) => {
        const y = topY + ((index + 1) / 9) * height

        return (
          <line
            key={index}
            x1="330"
            x2="768"
            y1={y}
            y2={y}
            stroke={COLORS.timberLine}
            strokeOpacity="0.45"
          />
        )
      })}
      <line
        x1="316"
        x2="782"
        y1={topY}
        y2={topY}
        stroke={COLORS.deckDark}
        strokeLinecap="round"
        strokeWidth="5"
      />
      <rect
        x="382"
        y={bottomY}
        width="18"
        height={Math.max(0, 552 - bottomY)}
        fill="#9b7441"
        opacity="0.5"
      />
      <rect
        x="690"
        y={bottomY}
        width="18"
        height={Math.max(0, 552 - bottomY)}
        fill="#9b7441"
        opacity="0.5"
      />
      <text
        x="548"
        y={topY - 18}
        fill={COLORS.ink}
        fontSize="18"
        fontWeight="800"
        textAnchor="middle"
      >
        Deck platform
      </text>
    </g>
  )
}

function PoolSection({ bottomY, topY }: { bottomY: number; topY: number }) {
  const height = Math.max(26, bottomY - topY)

  return (
    <g>
      <rect
        x="874"
        y={topY}
        width="130"
        height={height}
        fill={COLORS.poolShell}
        stroke={COLORS.poolEdge}
        strokeWidth="2"
      />
      <rect
        x="886"
        y={topY + 18}
        width="106"
        height={Math.max(0, height - 30)}
        fill={COLORS.water}
        opacity="0.8"
      />
      <line
        x1="856"
        x2="1022"
        y1={topY}
        y2={topY}
        stroke={COLORS.poolEdge}
        strokeLinecap="round"
        strokeWidth="5"
      />
      <line
        x1="886"
        x2="992"
        y1={topY + 28}
        y2={topY + 28}
        stroke="#ffffff"
        strokeOpacity="0.72"
        strokeWidth="2"
      />
      <text
        x="939"
        y={topY - 18}
        fill={COLORS.ink}
        fontSize="18"
        fontWeight="800"
        textAnchor="middle"
      >
        Pool section
      </text>
    </g>
  )
}

function NoPoolSection({ groundY }: { groundY: number }) {
  return (
    <g opacity="0.72">
      <rect
        x="874"
        y={groundY - 120}
        width="130"
        height="120"
        fill="#ffffff"
        stroke={COLORS.gridStrong}
        strokeDasharray="8 8"
        strokeWidth="2"
      />
      <text
        x="939"
        y={groundY - 140}
        fill={COLORS.muted}
        fontSize="16"
        fontWeight="700"
        textAnchor="middle"
      >
        No pool
      </text>
    </g>
  )
}

function HeightRuler({
  label,
  valueCm,
  x,
  y,
  yGround,
}: {
  label: string
  valueCm: number
  x: number
  y: number
  yGround: number
}) {
  return (
    <g>
      <VerticalDimension bottomY={yGround} label={`${valueCm} cm`} x={x} topY={y} />
      <Callout label={label} x={x - 78} y={y - 38} />
    </g>
  )
}

function PoolDeckDelta({
  deckY,
  label,
  poolY,
  status,
}: {
  deckY: number
  label: string
  poolY: number
  status: "above" | "below" | "flush"
}) {
  const color = status === "flush" ? COLORS.positive : COLORS.warning
  const midY = (deckY + poolY) / 2

  if (status === "flush") {
    return (
      <g>
        <line
          x1="792"
          x2="852"
          y1={deckY}
          y2={deckY}
          stroke={color}
          strokeWidth="3"
        />
        <Callout label="Pool flush with deck" tone="positive" x={798} y={deckY - 42} />
      </g>
    )
  }

  return (
    <g>
      <line
        x1="824"
        x2="824"
        y1={deckY}
        y2={poolY}
        stroke={color}
        strokeDasharray="4 5"
        strokeWidth="2"
      />
      <line x1="812" x2="836" y1={deckY} y2={deckY} stroke={color} />
      <line x1="812" x2="836" y1={poolY} y2={poolY} stroke={color} />
      <rect
        x="792"
        y={midY - 15}
        width="64"
        height="30"
        rx="15"
        fill="#ffffff"
        stroke={color}
      />
      <text
        x="824"
        y={midY + 5}
        fill={color}
        fontSize="13"
        fontWeight="800"
        textAnchor="middle"
      >
        {label}
      </text>
    </g>
  )
}

function VerticalDimension({
  bottomY,
  label,
  labelSide = "right",
  topY,
  x,
}: {
  bottomY: number
  label: string
  labelSide?: "left" | "right"
  topY: number
  x: number
}) {
  const labelX = labelSide === "left" ? x - 10 : x + 10
  const textAnchor = labelSide === "left" ? "end" : "start"

  return (
    <g>
      <line
        x1={x}
        x2={x}
        y1={topY}
        y2={bottomY}
        stroke={COLORS.dimension}
        strokeWidth="1.5"
      />
      <line x1={x - 7} x2={x + 7} y1={topY} y2={topY} stroke={COLORS.dimension} />
      <line
        x1={x - 7}
        x2={x + 7}
        y1={bottomY}
        y2={bottomY}
        stroke={COLORS.dimension}
      />
      <text
        x={labelX}
        y={(topY + bottomY) / 2 + 5}
        fill={COLORS.dimension}
        fontSize="13"
        fontWeight="700"
        textAnchor={textAnchor}
      >
        {label}
      </text>
    </g>
  )
}

function Callout({
  label,
  tone = "default",
  x,
  y,
}: {
  label: string
  tone?: "default" | "positive"
  x: number
  y: number
}) {
  const width = Math.max(116, label.length * 7.1 + 22)
  const stroke = tone === "positive" ? COLORS.positive : "#cbd5df"

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height="28"
        rx="14"
        fill="#ffffff"
        stroke={stroke}
      />
      <text
        x={x + 12}
        y={y + 18}
        fill={tone === "positive" ? COLORS.positive : COLORS.ink}
        fontSize="12.5"
        fontWeight="700"
      >
        {label}
      </text>
    </g>
  )
}
