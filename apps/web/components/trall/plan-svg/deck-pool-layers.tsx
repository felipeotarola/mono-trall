import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"

import { AngleSnapGuide } from "@/components/trall/svg/angle-snap-guide"
import {
  BoardDirectionLayer,
  FeatureRenderer,
} from "@/components/trall/features/feature-renderer"
import { DeckHandle } from "@/components/trall/svg/deck-handle"
import { DeletePointHint } from "@/components/trall/svg/delete-point-hint"
import { DimensionLine } from "@/components/trall/svg/dimension-line"
import { EdgeHoverLabel } from "@/components/trall/svg/edge-hover-label"
import { ParallelHintLabel } from "@/components/trall/svg/parallel-hint-label"
import { SnapIndicator } from "@/components/trall/svg/snap-indicator"
import { useDeckEditor } from "@/hooks/trall/use-deck-editor"
import { initialDeckPoints } from "@/lib/trall/constants"
import { lineAngle } from "@/lib/trall/geometry"
import {
  type BoardDirectionSettings,
  type DeckFeature,
  type FeaturePlacementType,
  type PergolaFeature,
  type SiteObjectFeature,
  type StairFeature,
} from "@/lib/trall/features"
import { getHouseAttachEdge } from "@/lib/trall/house"
import type { SupportSegment } from "@/lib/trall/supports"
import { trallPlanClasses } from "@/lib/trall/visual-style"
import type { GeometryEdge } from "@/lib/trall/edge-model"
import type { ActiveTool, HouseBounds, Point } from "@/lib/trall/types"

import {
  getDimensionLabelPoint,
  getPointsCenter,
  getPolygonPoints,
} from "./utils"

export function DeckLayer({
  activeTool,
  activePointIndex,
  activePoolPointIndex,
  boardDirection,
  deckPoints,
  editor,
  features,
  houseBounds,
  placementMode,
  poolEditor,
  poolPoints,
  selectedFeatureId,
  supportSegments,
  onDeckEdgeClick,
  onPergolaPointerDown,
  onSelectFeature,
  onSiteObjectPointerDown,
  onStairPointerDown,
}: {
  activeTool: ActiveTool
  activePointIndex: number | null
  activePoolPointIndex: number | null
  boardDirection: BoardDirectionSettings
  deckPoints: Point[]
  editor: ReturnType<typeof useDeckEditor>
  features: DeckFeature[]
  houseBounds: HouseBounds
  placementMode: FeaturePlacementType | null
  poolEditor: ReturnType<typeof useDeckEditor>
  poolPoints: Point[] | null
  selectedFeatureId: string | null
  supportSegments: SupportSegment[]
  onDeckEdgeClick: (edgeIndex: number) => boolean
  onPergolaPointerDown: (
    event: ReactPointerEvent<SVGGElement>,
    feature: PergolaFeature
  ) => void
  onSelectFeature: (featureId: string) => void
  onSiteObjectPointerDown: (
    event: ReactPointerEvent<SVGGElement>,
    feature: SiteObjectFeature
  ) => void
  onStairPointerDown: (
    event: ReactPointerEvent<SVGGElement>,
    feature: StairFeature
  ) => void
}) {
  const polygonPoints = getPolygonPoints(deckPoints)
  const p1 = deckPoints[0] ?? initialDeckPoints[0]
  const p2 = deckPoints[1] ?? initialDeckPoints[1]
  const selectedEdgeIndex = editor.selectedEdgeIndex ?? activePointIndex ?? 0
  const selectedEdgeStart = deckPoints[selectedEdgeIndex] ?? p1
  const selectedEdgeEnd =
    deckPoints[(selectedEdgeIndex + 1) % deckPoints.length] ?? p2
  const hoveredEdgeStart =
    editor.hoveredEdgeIndex !== null
      ? deckPoints[editor.hoveredEdgeIndex]
      : null
  const hoveredEdgeEnd =
    editor.hoveredEdgeIndex !== null
      ? deckPoints[(editor.hoveredEdgeIndex + 1) % deckPoints.length]
      : null
  const hoveredEdgeLabelPoint =
    hoveredEdgeStart && hoveredEdgeEnd
      ? {
          x: (hoveredEdgeStart.x + hoveredEdgeEnd.x) / 2,
          y: (hoveredEdgeStart.y + hoveredEdgeEnd.y) / 2,
        }
      : null
  const activePoint =
    activePointIndex !== null ? deckPoints[activePointIndex] : null
  const houseAttachEdge = getHouseAttachEdge(houseBounds)
  const selectedEdgeAttached = editor.attachedEdgeIndexes.has(selectedEdgeIndex)
  const dimensions = editor.dimensionEditing
  const center = getPointsCenter(deckPoints)
  const edgeControls = useEdgeControlHover(editor)
  const controlsEdge =
    edgeControls.edgeIndex !== null
      ? editor.edges[edgeControls.edgeIndex]
      : null

  return (
    <>
      {editor.snapState.type === "house" ? (
        <line
          x1={houseAttachEdge.x1}
          y1={houseAttachEdge.y}
          x2={houseAttachEdge.x2}
          y2={houseAttachEdge.y}
          className="stroke-sky-500"
          strokeLinecap="round"
          strokeWidth="8"
          opacity="0.5"
        />
      ) : null}

      <polygon
        points={polygonPoints}
        className={trallPlanClasses.deckPolygon}
        strokeLinejoin="round"
        strokeWidth="5"
      />
      <BoardDirectionLayer
        boardDirection={boardDirection}
        deckPoints={deckPoints}
      />
      <g clipPath="url(#deck-clip)" className="pointer-events-none">
        {supportSegments.map((segment, index) => (
          <line
            key={`support-segment-${index}`}
            x1={segment.x1}
            y1={segment.y1}
            x2={segment.x2}
            y2={segment.y2}
            className={trallPlanClasses.deckSupport}
            strokeDasharray="7 5"
            strokeLinecap="round"
            strokeWidth="4"
          />
        ))}
      </g>

      {poolPoints ? (
        <PoolLayer
          activePointIndex={activePoolPointIndex}
          canMovePlane={activeTool === "select" && !placementMode}
          editor={poolEditor}
          points={poolPoints}
        />
      ) : null}

      {editor.attachedEdges.map((edge) => {
        if (!edge.attached) {
          return null
        }

        const start = deckPoints[edge.edgeIndex]
        const end = deckPoints[(edge.edgeIndex + 1) % deckPoints.length]
        if (!start || !end) {
          return null
        }

        const labelPoint = {
          x: (start.x + end.x) / 2,
          y: houseAttachEdge.y - 18,
        }

        return (
          <g
            key={`attached-edge-${edge.edgeIndex}`}
            className="pointer-events-none"
          >
            <line
              x1={start.x}
              y1={houseAttachEdge.y}
              x2={end.x}
              y2={houseAttachEdge.y}
              className={trallPlanClasses.deckAttachedEdge}
              strokeLinecap="round"
              strokeWidth="8"
              opacity="0.82"
            />
            <rect
              x={labelPoint.x - 38}
              y={labelPoint.y - 21}
              width="76"
              height="24"
              rx="6"
              className="fill-background/90 stroke-border"
            />
            <text
              x={labelPoint.x}
              y={labelPoint.y - 5}
              textAnchor="middle"
              className="fill-muted-foreground text-[12px] font-semibold"
            >
              Attached
            </text>
          </g>
        )
      })}

      <path
        d={`M${selectedEdgeStart.x} ${selectedEdgeStart.y} L${selectedEdgeEnd.x} ${selectedEdgeEnd.y}`}
        className={
          selectedEdgeAttached
            ? `pointer-events-none ${trallPlanClasses.deckAttachedEdge}`
            : `pointer-events-none ${trallPlanClasses.deckSelectedEdge}`
        }
        strokeLinecap="round"
        strokeWidth={selectedEdgeAttached ? "11" : "9"}
      />
      <path
        d={`M${selectedEdgeStart.x} ${selectedEdgeStart.y} L${selectedEdgeEnd.x} ${selectedEdgeEnd.y}`}
        className={`pointer-events-none ${trallPlanClasses.deckSelectedEdgeInner}`}
        strokeLinecap="round"
        strokeWidth="3"
      />

      {editor.parallelHint.active &&
      p1 &&
      p2 &&
      editor.parallelHint.start &&
      editor.parallelHint.end ? (
        <g className="pointer-events-none">
          <line
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            className="stroke-violet-500"
            strokeLinecap="round"
            strokeWidth="7"
            opacity="0.32"
          />
          <line
            x1={editor.parallelHint.start.x}
            y1={editor.parallelHint.start.y}
            x2={editor.parallelHint.end.x}
            y2={editor.parallelHint.end.y}
            className="stroke-violet-500"
            strokeLinecap="round"
            strokeWidth="7"
            opacity="0.45"
          />
          <ParallelHintLabel
            point={{
              x: (editor.parallelHint.start.x + editor.parallelHint.end.x) / 2,
              y: (editor.parallelHint.start.y + editor.parallelHint.end.y) / 2,
            }}
          />
        </g>
      ) : null}

      {editor.angleSnapState.active &&
      editor.angleSnapState.anchor &&
      editor.angleSnapState.point &&
      editor.angleSnapState.angle !== null ? (
        <AngleSnapGuide
          anchor={editor.angleSnapState.anchor}
          angle={editor.angleSnapState.angle}
          point={editor.angleSnapState.point}
        />
      ) : null}

      {hoveredEdgeStart && hoveredEdgeEnd ? (
        <line
          x1={hoveredEdgeStart.x}
          y1={hoveredEdgeStart.y}
          x2={hoveredEdgeEnd.x}
          y2={hoveredEdgeEnd.y}
          className={
            placementMode && placementMode !== "pergola"
              ? "pointer-events-none stroke-amber-500"
              : "pointer-events-none stroke-sky-500"
          }
          strokeLinecap="round"
          strokeWidth="6"
          opacity="0.7"
        />
      ) : null}

      {deckPoints.map((point, index) => {
        const nextPoint = deckPoints[(index + 1) % deckPoints.length]
        if (!nextPoint) {
          return null
        }

        return (
          <line
            key={`edge-hit-${index}`}
            x1={point.x}
            y1={point.y}
            x2={nextPoint.x}
            y2={nextPoint.y}
            data-edge-index={index}
            data-interactive="true"
            className={
              placementMode && placementMode !== "pergola"
                ? "cursor-crosshair stroke-transparent"
                : "cursor-pointer stroke-transparent"
            }
            strokeWidth="30"
            pointerEvents="stroke"
            onDoubleClick={(event) =>
              editor.handleEdgeDoubleClick(event, index)
            }
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              if (onDeckEdgeClick(index)) {
                return
              }
              editor.selectEdge(index)
            }}
            onPointerEnter={() => edgeControls.show(index)}
            onPointerLeave={() => edgeControls.hide(index)}
          />
        )
      })}

      <FeatureRenderer
        deckPoints={deckPoints}
        edges={editor.edges}
        features={features}
        selectedFeatureId={selectedFeatureId}
        onPergolaPointerDown={onPergolaPointerDown}
        onSelectFeature={onSelectFeature}
        onSiteObjectPointerDown={onSiteObjectPointerDown}
        onStairPointerDown={onStairPointerDown}
      />

      {hoveredEdgeLabelPoint ? (
        <EdgeHoverLabel point={hoveredEdgeLabelPoint} />
      ) : null}

      {editor.edges.map((edge) => {
        const labelPoint = getDimensionLabelPoint(edge.start, edge.end, center)

        return (
          <DimensionLine
            key={edge.id}
            edgeIndex={edge.index}
            x1={edge.start.x}
            y1={edge.start.y}
            x2={edge.end.x}
            y2={edge.end.y}
            valueMeters={edge.length}
            labelX={labelPoint.x}
            labelY={labelPoint.y}
            rotate={lineAngle(edge.start, edge.end)}
            editingDimension={editor.editingDimension}
            readonly={edge.locked}
            onCancelEdit={dimensions.cancelEditingDimension}
            onCommitEdit={dimensions.commitEditingDimension}
            onEditValueChange={dimensions.updateEditingDimension}
            onStartEdit={dimensions.startEditingDimension}
          />
        )
      })}

      {controlsEdge ? (
        <EdgeConstraintControls
          edge={controlsEdge}
          point={getDimensionLabelPoint(
            controlsEdge.start,
            controlsEdge.end,
            center
          )}
          onAddNode={() => dimensions.addNodeToEdge(controlsEdge.index)}
          onEdit={() =>
            dimensions.startEditingDimension(
              controlsEdge.index,
              controlsEdge.length
            )
          }
          onLink={() => dimensions.linkEdgeToOpposite(controlsEdge.index)}
          onLock={() => dimensions.toggleEdgeLockByIndex(controlsEdge.index)}
          onPointerEnter={() => edgeControls.show(controlsEdge.index)}
          onPointerLeave={() => edgeControls.hide(controlsEdge.index)}
          onRemoveNode={() => dimensions.removeEdgeEndPoint(controlsEdge.index)}
          onUnlink={() => dimensions.unlinkEdgeByIndex(controlsEdge.index)}
        />
      ) : null}

      {deckPoints.map((point, index) => (
        <DeckHandle
          key={index}
          x={point.x}
          y={point.y}
          label={`P${index + 1}`}
          selected={index === activePointIndex}
          dragging={editor.dragStart?.pointIndex === index}
          emphasized={activeTool === "select"}
          snappedToHouse={
            editor.snapState.type === "house" &&
            editor.snapState.pointIndex === index
          }
          onPointerDown={(event) => editor.handlePointPointerDown(event, index)}
        />
      ))}

      {editor.snapState.point ? (
        <SnapIndicator
          point={editor.snapState.point}
          type={editor.snapState.type}
        />
      ) : null}
      {activePoint && deckPoints.length > 3 ? (
        <DeletePointHint point={activePoint} />
      ) : null}
    </>
  )
}

function PoolLayer({
  activePointIndex,
  canMovePlane,
  editor,
  points,
}: {
  activePointIndex: number | null
  canMovePlane: boolean
  editor: ReturnType<typeof useDeckEditor>
  points: Point[]
}) {
  const polygonPoints = getPolygonPoints(points)
  const center = getPointsCenter(points)
  const activePoint =
    activePointIndex !== null ? points[activePointIndex] : null
  const hoveredEdgeStart =
    editor.hoveredEdgeIndex !== null ? points[editor.hoveredEdgeIndex] : null
  const hoveredEdgeEnd =
    editor.hoveredEdgeIndex !== null
      ? points[(editor.hoveredEdgeIndex + 1) % points.length]
      : null
  const hoveredEdgeLabelPoint =
    hoveredEdgeStart && hoveredEdgeEnd
      ? {
          x: (hoveredEdgeStart.x + hoveredEdgeEnd.x) / 2,
          y: (hoveredEdgeStart.y + hoveredEdgeEnd.y) / 2,
        }
      : null
  const dimensions = editor.dimensionEditing
  const edgeControls = useEdgeControlHover(editor)
  const controlsEdge =
    edgeControls.edgeIndex !== null
      ? editor.edges[edgeControls.edgeIndex]
      : null

  return (
    <>
      <polygon
        points={polygonPoints}
        className={
          canMovePlane
            ? `cursor-grab active:cursor-grabbing ${trallPlanClasses.poolPolygon}`
            : trallPlanClasses.poolPolygon
        }
        strokeLinejoin="round"
        strokeWidth="4"
        onPointerDown={canMovePlane ? editor.handleShapePointerDown : undefined}
      />
      <polygon
        points={polygonPoints}
        className={`pointer-events-none fill-transparent ${trallPlanClasses.poolHighlight}`}
        strokeDasharray="10 8"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <text
        x={center.x}
        y={center.y + 5}
        textAnchor="middle"
        className={`pointer-events-none text-[18px] font-semibold ${trallPlanClasses.poolLabel}`}
      >
        Pool
      </text>

      {hoveredEdgeStart && hoveredEdgeEnd ? (
        <line
          x1={hoveredEdgeStart.x}
          y1={hoveredEdgeStart.y}
          x2={hoveredEdgeEnd.x}
          y2={hoveredEdgeEnd.y}
          className="pointer-events-none stroke-cyan-500"
          strokeLinecap="round"
          strokeWidth="6"
          opacity="0.75"
        />
      ) : null}

      {points.map((point, index) => {
        const nextPoint = points[(index + 1) % points.length]
        if (!nextPoint) {
          return null
        }

        return (
          <line
            key={`pool-edge-hit-${index}`}
            x1={point.x}
            y1={point.y}
            x2={nextPoint.x}
            y2={nextPoint.y}
            data-edge-index={index}
            data-interactive="true"
            className="cursor-pointer stroke-transparent"
            strokeWidth="26"
            pointerEvents="stroke"
            onDoubleClick={(event) =>
              editor.handleEdgeDoubleClick(event, index)
            }
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              editor.selectEdge(index)
            }}
            onPointerEnter={() => edgeControls.show(index)}
            onPointerLeave={() => edgeControls.hide(index)}
          />
        )
      })}

      {hoveredEdgeLabelPoint ? (
        <EdgeHoverLabel point={hoveredEdgeLabelPoint} />
      ) : null}

      {editor.edges.map((edge) => {
        const labelPoint = getDimensionLabelPoint(edge.start, edge.end, center)

        return (
          <DimensionLine
            key={`pool-dimension-${edge.id}`}
            edgeIndex={edge.index}
            x1={edge.start.x}
            y1={edge.start.y}
            x2={edge.end.x}
            y2={edge.end.y}
            valueMeters={edge.length}
            labelX={labelPoint.x}
            labelY={labelPoint.y}
            rotate={lineAngle(edge.start, edge.end)}
            editingDimension={editor.editingDimension}
            readonly={edge.locked}
            onCancelEdit={dimensions.cancelEditingDimension}
            onCommitEdit={dimensions.commitEditingDimension}
            onEditValueChange={dimensions.updateEditingDimension}
            onStartEdit={dimensions.startEditingDimension}
          />
        )
      })}

      {controlsEdge ? (
        <EdgeConstraintControls
          edge={controlsEdge}
          point={getDimensionLabelPoint(
            controlsEdge.start,
            controlsEdge.end,
            center
          )}
          onAddNode={() => dimensions.addNodeToEdge(controlsEdge.index)}
          onEdit={() =>
            dimensions.startEditingDimension(
              controlsEdge.index,
              controlsEdge.length
            )
          }
          onLink={() => dimensions.linkEdgeToOpposite(controlsEdge.index)}
          onLock={() => dimensions.toggleEdgeLockByIndex(controlsEdge.index)}
          onPointerEnter={() => edgeControls.show(controlsEdge.index)}
          onPointerLeave={() => edgeControls.hide(controlsEdge.index)}
          onRemoveNode={() => dimensions.removeEdgeEndPoint(controlsEdge.index)}
          onUnlink={() => dimensions.unlinkEdgeByIndex(controlsEdge.index)}
        />
      ) : null}

      {points.map((point, index) => (
        <DeckHandle
          key={`pool-point-${index}`}
          x={point.x}
          y={point.y}
          label={`W${index + 1}`}
          selected={index === activePointIndex}
          dragging={editor.dragStart?.pointIndex === index}
          emphasized={canMovePlane}
          variant="pool"
          onPointerDown={(event) => editor.handlePointPointerDown(event, index)}
        />
      ))}

      {editor.snapState.point ? (
        <SnapIndicator point={editor.snapState.point} type="grid" />
      ) : null}
      {activePoint && points.length > 3 ? (
        <DeletePointHint point={activePoint} />
      ) : null}
    </>
  )
}

function useEdgeControlHover(editor: ReturnType<typeof useDeckEditor>) {
  const [edgeIndex, setEdgeIndex] = useState<number | null>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [])

  function clearHideTimeout() {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }

  function show(nextEdgeIndex: number) {
    clearHideTimeout()
    setEdgeIndex(nextEdgeIndex)
    editor.setHoveredEdgeIndex(nextEdgeIndex)
  }

  function hide(nextEdgeIndex: number) {
    clearHideTimeout()
    hideTimeoutRef.current = setTimeout(() => {
      setEdgeIndex((currentIndex) =>
        currentIndex === nextEdgeIndex ? null : currentIndex
      )
      editor.setHoveredEdgeIndex((currentIndex) =>
        currentIndex === nextEdgeIndex ? null : currentIndex
      )
    }, 180)
  }

  return { edgeIndex, hide, show }
}

function EdgeConstraintControls({
  edge,
  onAddNode,
  onEdit,
  onLink,
  onLock,
  onPointerEnter,
  onPointerLeave,
  onRemoveNode,
  onUnlink,
  point,
}: {
  edge: GeometryEdge
  onAddNode: () => void
  onEdit: () => void
  onLink: () => void
  onLock: () => void
  onPointerEnter: () => void
  onPointerLeave: () => void
  onRemoveNode: () => void
  onUnlink: () => void
  point: Point
}) {
  return (
    <foreignObject
      data-interactive="true"
      pointerEvents="auto"
      x={point.x - 210}
      y={point.y + 12}
      width="420"
      height="48"
    >
      <div
        className="flex h-10 items-center justify-center gap-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-white shadow-lg shadow-black/30"
        onClick={(event) => event.stopPropagation()}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <button
          className="h-7 rounded-md px-3 text-xs font-semibold text-white hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
          type="button"
          onClick={onEdit}
        >
          Edit
        </button>
        <button
          className="h-7 rounded-md px-3 text-xs font-semibold text-white hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
          type="button"
          onClick={onAddNode}
        >
          Add node
        </button>
        <button
          className="h-7 rounded-md px-3 text-xs font-semibold text-white hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
          type="button"
          onClick={onRemoveNode}
        >
          Remove node
        </button>
        <button
          className="h-7 rounded-md px-3 text-xs font-semibold text-white hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
          type="button"
          onClick={onLock}
        >
          {edge.locked ? "Unlock" : "Lock"}
        </button>
        {edge.linkedEdgeId ? (
          <button
            className="h-7 rounded-md px-3 text-xs font-semibold text-white hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
            type="button"
            onClick={onUnlink}
          >
            Unlink
          </button>
        ) : (
          <button
            className="h-7 rounded-md px-3 text-xs font-semibold text-white hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
            type="button"
            onClick={onLink}
          >
            Link opposite
          </button>
        )}
      </div>
    </foreignObject>
  )
}
