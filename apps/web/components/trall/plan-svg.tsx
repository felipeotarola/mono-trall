"use client"

import type {
  Dispatch,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent,
  PointerEvent as ReactPointerEvent,
  SetStateAction,
} from "react"
import { useRef, useState } from "react"

import { HouseLayer } from "@/components/trall/svg/house-layer"
import { DeckLayer } from "@/components/trall/plan-svg/deck-pool-layers"
import { MeasurementLayer } from "@/components/trall/plan-svg/measurement-layer"
import {
  clamp,
  formatLengthInput,
  getPolygonPoints,
  getSiteObjectKindFromPlacementMode,
  isTypingTarget,
  noopSetActivePointIndex,
  noopSetPoolPoints,
  setMeasurementLength,
} from "@/components/trall/plan-svg/utils"
import { useCanvasViewport } from "@/hooks/trall/use-canvas-viewport"
import { isInteractiveTarget } from "@/hooks/trall/use-canvas-viewport"
import { useDeckEditor } from "@/hooks/trall/use-deck-editor"
import {
  initialPoolPoints,
  PIXELS_PER_METER,
} from "@/lib/trall/constants"
import { distance } from "@/lib/trall/geometry"
import {
  createDefaultPergola,
  createDefaultPrivacyScreen,
  createDefaultRailing,
  createDefaultSiteObject,
  createDefaultStairs,
  pointInPolygon,
  type BoardDirectionSettings,
  type DeckFeature,
  type FeaturePlacementType,
  type PergolaFeature,
  type RailingFeature,
  type SiteObjectFeature,
  type StairFeature,
} from "@/lib/trall/features"
import { getHouseDoors, getHouseRoofStyle, getHouseWindows } from "@/lib/trall/house"
import { clientPointToSvgPoint } from "@/lib/trall/svg"
import type { SupportSegment } from "@/lib/trall/supports"
import type { EdgeConstraint, GeometryEdge } from "@/lib/trall/edge-model"
import type {
  ActiveTool,
  HouseModel,
  HouseDoor,
  HouseBounds,
  MeasurementLine,
  Point,
  ViewBox,
  HouseWindow,
} from "@/lib/trall/types"
import { getPlanContentBounds, getPointBounds } from "@/lib/trall/view"

type MeasurementDrag =
  | {
      type: "create"
      id: string
    }
  | {
      type: "move" | "start" | "end"
      id: string
      pointerStart: Point
      lineStart: MeasurementLine
    }

export function PlanSvg({
  activeTool,
  activePointIndex,
  activePoolPointIndex = null,
  boardDirection,
  deckEdgeConstraints,
  deckPoints,
  features,
  house,
  houseBounds,
  measurements,
  placementMode,
  poolEdgeConstraints,
  poolPoints = null,
  selectedFeatureId,
  setActivePointIndex,
  setDeckEdgeConstraints,
  setDeckPoints,
  setActivePoolPointIndex = noopSetActivePointIndex,
  setFeatures,
  setHouse,
  setMeasurements,
  setPoolEdgeConstraints,
  setPoolPoints = noopSetPoolPoints,
  setSelectedFeatureId,
  setViewBox,
  supportSegments,
  onDeleteFeature,
  onFeaturePlaced,
  onResetView,
  viewBox,
}: {
  activeTool: ActiveTool
  activePointIndex: number | null
  activePoolPointIndex?: number | null
  boardDirection: BoardDirectionSettings
  deckEdgeConstraints: EdgeConstraint[]
  deckPoints: Point[]
  features: DeckFeature[]
  house: HouseModel
  houseBounds: HouseBounds
  measurements: MeasurementLine[]
  placementMode: FeaturePlacementType | null
  poolEdgeConstraints: EdgeConstraint[]
  poolPoints?: Point[] | null
  selectedFeatureId: string | null
  setActivePointIndex: (index: number | null) => void
  setDeckEdgeConstraints: Dispatch<SetStateAction<EdgeConstraint[]>>
  setDeckPoints: Dispatch<SetStateAction<Point[]>>
  setActivePoolPointIndex?: (index: number | null) => void
  setFeatures: Dispatch<SetStateAction<DeckFeature[]>>
  setHouse: Dispatch<SetStateAction<HouseModel>>
  setMeasurements: Dispatch<SetStateAction<MeasurementLine[]>>
  setPoolEdgeConstraints: Dispatch<SetStateAction<EdgeConstraint[]>>
  setPoolPoints?: Dispatch<SetStateAction<Point[] | null>>
  setSelectedFeatureId: (featureId: string | null) => void
  setViewBox: Dispatch<SetStateAction<ViewBox>>
  supportSegments: SupportSegment[]
  onDeleteFeature: (featureId: string) => void
  onFeaturePlaced: (featureId: string, keepPlacement?: boolean) => void
  onResetView: () => void
  viewBox: ViewBox
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<
    string | null
  >(null)
  const [editingMeasurement, setEditingMeasurement] = useState<{
    id: string
    value: string
  } | null>(null)
  const [measurementDrag, setMeasurementDrag] =
    useState<MeasurementDrag | null>(null)
  const [doorDrag, setDoorDrag] = useState<{
    doorId: string
    pointerStartX: number
    startOffsetM: number
  } | null>(null)
  const [windowDrag, setWindowDrag] = useState<{
    pointerStartX: number
    startOffsetM: number
    windowId: string
  } | null>(null)
  const [stairDrag, setStairDrag] = useState<{
    edge: GeometryEdge
    pointerStart: Point
    stairId: string
    startPositionT: number
  } | null>(null)
  const [pergolaDrag, setPergolaDrag] = useState<{
    pergolaId: string
    pointerStart: Point
    startPoint: Point
  } | null>(null)
  const [siteObjectDrag, setSiteObjectDrag] = useState<{
    objectId: string
    pointerStart: Point
    startPoint: Point
  } | null>(null)
  const houseDoors = getHouseDoors(house)
  const houseWindows = getHouseWindows(house)
  const pointBounds = getPointBounds(houseBounds)
  const contentBounds = getPlanContentBounds(
    houseBounds,
    deckPoints,
    poolPoints ?? []
  )
  const editor = useDeckEditor({
    activePointIndex,
    deckPoints,
    edgeConstraints: deckEdgeConstraints,
    edgePrefix: "deck",
    houseBounds,
    pointBounds,
    setActivePointIndex: (index) => {
      setActivePointIndex(index)
      if (index !== null) {
        setActivePoolPointIndex(null)
        setSelectedFeatureId(null)
      }
    },
    setDeckPoints,
    setEdgeConstraints: setDeckEdgeConstraints,
    svgRef,
  })
  const poolEditor = useDeckEditor({
    activePointIndex: activePoolPointIndex,
    deckPoints: poolPoints ?? initialPoolPoints,
    edgeConstraints: poolEdgeConstraints,
    edgePrefix: "pool",
    houseBounds,
    pointBounds,
    setActivePointIndex: (index) => {
      setActivePoolPointIndex(index)
      if (index !== null) {
        setActivePointIndex(null)
        setSelectedFeatureId(null)
      }
    },
    setDeckPoints: (nextPoints) => {
      setPoolPoints((currentPoints) => {
        const sourcePoints = currentPoints ?? initialPoolPoints
        return typeof nextPoints === "function"
          ? nextPoints(sourcePoints)
          : nextPoints
      })
    },
    setEdgeConstraints: setPoolEdgeConstraints,
    snapToHouse: false,
    svgRef,
  })
  const viewport = useCanvasViewport({
    contentBounds,
    onResetView,
    setViewBox,
    svgRef,
    viewBox,
  })
  const canPan =
    activeTool === "pan" ||
    viewport.spacePressed ||
    (activeTool === "select" && !placementMode)
  const svgCursorClass = viewport.panActive
    ? "cursor-grabbing"
    : canPan
      ? "cursor-grab"
      : ""
  const dimensions = editor.dimensionEditing

  function handleKeyDown(event: ReactKeyboardEvent<SVGSVGElement>) {
    if (!editor.editingDimension && viewport.handleKeyDown(event)) {
      return
    }

    if (editor.editingDimension) {
      return
    }

    if (event.key !== "Backspace" && event.key !== "Delete") {
      return
    }

    if (selectedMeasurementId && !isTypingTarget(event.target)) {
      event.preventDefault()
      setMeasurements((current) =>
        current.filter((line) => line.id !== selectedMeasurementId)
      )
      setEditingMeasurement((current) =>
        current?.id === selectedMeasurementId ? null : current
      )
      setMeasurementDrag((current) =>
        current?.id === selectedMeasurementId ? null : current
      )
      setSelectedMeasurementId(null)
      return
    }

    if (selectedFeatureId && !isTypingTarget(event.target)) {
      event.preventDefault()
      onDeleteFeature(selectedFeatureId)
      return
    }

    if (activePoolPointIndex !== null) {
      if (!poolPoints || poolPoints.length <= 3) {
        return
      }

      event.preventDefault()
      poolEditor.removeActivePoint()
      return
    }

    if (activePointIndex === null || deckPoints.length <= 3) {
      return
    }

    event.preventDefault()
    editor.removeActivePoint()
  }

  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    const targetIsInteractive = isInteractiveTarget(event.target)

    if (placeSiteObjectFromCanvas(event)) {
      return
    }

    if (placePergolaFromCanvas(event)) {
      return
    }

    if (startMeasurementCreate(event)) {
      return
    }

    if (activeTool === "select" && !targetIsInteractive) {
      setSelectedFeatureId(null)
    }

    if (viewport.startPointer(event, canPan)) {
      return
    }
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (updateSiteObjectDrag(event)) {
      return
    }

    if (updatePergolaDrag(event)) {
      return
    }

    if (updateStairDrag(event)) {
      return
    }

    if (updateDoorDrag(event)) {
      return
    }

    if (updateWindowDrag(event)) {
      return
    }

    if (updateMeasurementDrag(event)) {
      return
    }

    if (viewport.movePointer(event)) {
      return
    }

    if (editor.handlePointerMove(event)) {
      return
    }

    poolEditor.handlePointerMove(event)
  }

  function handlePointerEnd(event: ReactPointerEvent<SVGSVGElement>) {
    if (finishSiteObjectDrag(event)) {
      return
    }

    if (finishPergolaDrag(event)) {
      return
    }

    if (finishStairDrag(event)) {
      return
    }

    if (finishDoorDrag(event)) {
      return
    }

    if (finishWindowDrag(event)) {
      return
    }

    if (finishMeasurementDrag(event)) {
      return
    }

    if (viewport.stopPointer(event)) {
      return
    }

    editor.stopDragging(event)
    poolEditor.stopDragging(event)
  }

  function startDoorDrag(
    event: ReactPointerEvent<SVGElement>,
    door: HouseDoor
  ) {
    if (activeTool !== "select" || !svgRef.current) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    svgRef.current.focus()
    svgRef.current.setPointerCapture(event.pointerId)
    setActivePointIndex(null)
    setActivePoolPointIndex(null)
    setSelectedFeatureId(null)
    setSelectedMeasurementId(null)
    setEditingMeasurement(null)
    setDoorDrag({
      doorId: door.id,
      pointerStartX: clientPointToSvgPoint(event, svgRef.current).x,
      startOffsetM: door.offsetM,
    })
  }

  function updateDoorDrag(event: ReactPointerEvent<SVGSVGElement>) {
    if (!doorDrag || !svgRef.current) {
      return false
    }

    event.preventDefault()
    const point = clientPointToSvgPoint(event, svgRef.current)
    const deltaM = (point.x - doorDrag.pointerStartX) / PIXELS_PER_METER
    const draggedDoor = getHouseDoors(house).find(
      (door) => door.id === doorDrag.doorId
    )
    const doorWidthM = (draggedDoor?.widthCm ?? 90) / 100
    const maxOffsetM = Math.max(0, house.widthM / 2 - doorWidthM / 2)
    const nextOffsetM = clamp(
      doorDrag.startOffsetM + deltaM,
      -maxOffsetM,
      maxOffsetM
    )

    setHouse((currentHouse) => ({
      ...currentHouse,
      doorOffsetM:
        doorDrag.doorId === "door-1"
          ? nextOffsetM
          : (currentHouse.doorOffsetM ?? 0),
      doors: getHouseDoors(currentHouse).map((door) =>
        door.id === doorDrag.doorId ? { ...door, offsetM: nextOffsetM } : door
      ),
    }))

    return true
  }

  function finishDoorDrag(event: ReactPointerEvent<SVGSVGElement>) {
    if (!doorDrag) {
      return false
    }

    if (svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId)
    }

    setDoorDrag(null)
    return true
  }

  function startWindowDrag(
    event: ReactPointerEvent<SVGElement>,
    window: HouseWindow
  ) {
    if (activeTool !== "select" || !svgRef.current) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    svgRef.current.focus()
    svgRef.current.setPointerCapture(event.pointerId)
    setActivePointIndex(null)
    setActivePoolPointIndex(null)
    setSelectedFeatureId(null)
    setSelectedMeasurementId(null)
    setEditingMeasurement(null)
    setWindowDrag({
      pointerStartX: clientPointToSvgPoint(event, svgRef.current).x,
      startOffsetM: window.offsetM,
      windowId: window.id,
    })
  }

  function updateWindowDrag(event: ReactPointerEvent<SVGSVGElement>) {
    if (!windowDrag || !svgRef.current) {
      return false
    }

    event.preventDefault()
    const point = clientPointToSvgPoint(event, svgRef.current)
    const deltaM = (point.x - windowDrag.pointerStartX) / PIXELS_PER_METER
    const draggedWindow = getHouseWindows(house).find(
      (window) => window.id === windowDrag.windowId
    )
    const windowWidthM = (draggedWindow?.widthCm ?? 120) / 100
    const maxOffsetM = Math.max(0, house.widthM / 2 - windowWidthM / 2)
    const nextOffsetM = clamp(
      windowDrag.startOffsetM + deltaM,
      -maxOffsetM,
      maxOffsetM
    )

    setHouse((currentHouse) => ({
      ...currentHouse,
      windows: getHouseWindows(currentHouse).map((window) =>
        window.id === windowDrag.windowId
          ? { ...window, offsetM: nextOffsetM }
          : window
      ),
    }))

    return true
  }

  function finishWindowDrag(event: ReactPointerEvent<SVGSVGElement>) {
    if (!windowDrag) {
      return false
    }

    if (svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId)
    }

    setWindowDrag(null)
    return true
  }

  function startStairDrag(
    event: ReactPointerEvent<SVGGElement>,
    stair: StairFeature
  ) {
    if (activeTool !== "select" || !svgRef.current) {
      return
    }

    const edge = editor.edges.find((item) => item.id === stair.edgeId)
    if (!edge) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    svgRef.current.focus()
    svgRef.current.setPointerCapture(event.pointerId)
    setActivePointIndex(null)
    setActivePoolPointIndex(null)
    setSelectedMeasurementId(null)
    setEditingMeasurement(null)
    setSelectedFeatureId(stair.id)
    setStairDrag({
      edge,
      pointerStart: clientPointToSvgPoint(event, svgRef.current),
      stairId: stair.id,
      startPositionT: stair.positionT,
    })
  }

  function updateStairDrag(event: ReactPointerEvent<SVGSVGElement>) {
    if (!stairDrag || !svgRef.current) {
      return false
    }

    event.preventDefault()
    const point = clientPointToSvgPoint(event, svgRef.current)
    const tangent = {
      x: stairDrag.edge.end.x - stairDrag.edge.start.x,
      y: stairDrag.edge.end.y - stairDrag.edge.start.y,
    }
    const edgeLengthPx = Math.hypot(tangent.x, tangent.y) || 1
    const deltaPx = {
      x: point.x - stairDrag.pointerStart.x,
      y: point.y - stairDrag.pointerStart.y,
    }
    const deltaAlongEdgeT =
      (deltaPx.x * tangent.x + deltaPx.y * tangent.y) /
      (edgeLengthPx * edgeLengthPx)

    setFeatures((currentFeatures) =>
      currentFeatures.map((feature) => {
        if (feature.id !== stairDrag.stairId || feature.type !== "stairs") {
          return feature
        }

        const halfWidthT = Math.min(
          0.49,
          (feature.widthM * PIXELS_PER_METER) / 2 / edgeLengthPx
        )

        return {
          ...feature,
          positionT: clamp(
            stairDrag.startPositionT + deltaAlongEdgeT,
            halfWidthT,
            1 - halfWidthT
          ),
        }
      })
    )

    return true
  }

  function finishStairDrag(event: ReactPointerEvent<SVGSVGElement>) {
    if (!stairDrag) {
      return false
    }

    if (svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId)
    }

    setStairDrag(null)
    return true
  }

  function startPergolaDrag(
    event: ReactPointerEvent<SVGGElement>,
    pergola: PergolaFeature
  ) {
    if (activeTool !== "select" || !svgRef.current) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    svgRef.current.focus()
    svgRef.current.setPointerCapture(event.pointerId)
    setActivePointIndex(null)
    setActivePoolPointIndex(null)
    setSelectedMeasurementId(null)
    setEditingMeasurement(null)
    setSelectedFeatureId(pergola.id)
    setPergolaDrag({
      pergolaId: pergola.id,
      pointerStart: clientPointToSvgPoint(event, svgRef.current),
      startPoint: { x: pergola.x, y: pergola.y },
    })
  }

  function updatePergolaDrag(event: ReactPointerEvent<SVGSVGElement>) {
    if (!pergolaDrag || !svgRef.current) {
      return false
    }

    event.preventDefault()
    const point = clientPointToSvgPoint(event, svgRef.current)
    const nextPoint = {
      x: pergolaDrag.startPoint.x + point.x - pergolaDrag.pointerStart.x,
      y: pergolaDrag.startPoint.y + point.y - pergolaDrag.pointerStart.y,
    }

    if (!pointInPolygon(nextPoint, deckPoints)) {
      return true
    }

    setFeatures((currentFeatures) =>
      currentFeatures.map((feature) =>
        feature.id === pergolaDrag.pergolaId && feature.type === "pergola"
          ? { ...feature, x: nextPoint.x, y: nextPoint.y }
          : feature
      )
    )

    return true
  }

  function finishPergolaDrag(event: ReactPointerEvent<SVGSVGElement>) {
    if (!pergolaDrag) {
      return false
    }

    if (svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId)
    }

    setPergolaDrag(null)
    return true
  }

  function startSiteObjectDrag(
    event: ReactPointerEvent<SVGGElement>,
    object: SiteObjectFeature
  ) {
    if (activeTool !== "select" || !svgRef.current) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    svgRef.current.focus()
    svgRef.current.setPointerCapture(event.pointerId)
    setActivePointIndex(null)
    setActivePoolPointIndex(null)
    setSelectedMeasurementId(null)
    setEditingMeasurement(null)
    setSelectedFeatureId(object.id)
    setSiteObjectDrag({
      objectId: object.id,
      pointerStart: clientPointToSvgPoint(event, svgRef.current),
      startPoint: { x: object.x, y: object.y },
    })
  }

  function updateSiteObjectDrag(event: ReactPointerEvent<SVGSVGElement>) {
    if (!siteObjectDrag || !svgRef.current) {
      return false
    }

    event.preventDefault()
    const point = clientPointToSvgPoint(event, svgRef.current)
    const nextPoint = clampSitePointToBounds({
      x: siteObjectDrag.startPoint.x + point.x - siteObjectDrag.pointerStart.x,
      y: siteObjectDrag.startPoint.y + point.y - siteObjectDrag.pointerStart.y,
    })

    setFeatures((currentFeatures) =>
      currentFeatures.map((feature) =>
        feature.id === siteObjectDrag.objectId && feature.type === "siteObject"
          ? { ...feature, x: nextPoint.x, y: nextPoint.y }
          : feature
      )
    )

    return true
  }

  function finishSiteObjectDrag(event: ReactPointerEvent<SVGSVGElement>) {
    if (!siteObjectDrag) {
      return false
    }

    if (svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId)
    }

    setSiteObjectDrag(null)
    return true
  }

  function startMeasurementCreate(event: ReactPointerEvent<SVGSVGElement>) {
    if (
      activeTool !== "measure" ||
      !svgRef.current ||
      isInteractiveTarget(event.target)
    ) {
      return false
    }

    event.preventDefault()
    svgRef.current.focus()
    svgRef.current.setPointerCapture(event.pointerId)
    const point = clientPointToSvgPoint(event, svgRef.current)
    const id = `measurement-${Date.now()}`
    setMeasurements((current) => [...current, { id, start: point, end: point }])
    setSelectedFeatureId(null)
    setSelectedMeasurementId(id)
    setEditingMeasurement(null)
    setMeasurementDrag({ type: "create", id })
    return true
  }

  function updateMeasurementDrag(event: ReactPointerEvent<SVGSVGElement>) {
    if (!measurementDrag || !svgRef.current) {
      return false
    }

    event.preventDefault()
    const point = clientPointToSvgPoint(event, svgRef.current)
    setMeasurements((current) =>
      current.map((line) => {
        if (line.id !== measurementDrag.id) {
          return line
        }

        if (measurementDrag.type === "create") {
          return { ...line, end: point }
        }

        if (measurementDrag.type === "start") {
          return { ...line, start: point }
        }

        if (measurementDrag.type === "end") {
          return { ...line, end: point }
        }

        const delta = {
          x: point.x - measurementDrag.pointerStart.x,
          y: point.y - measurementDrag.pointerStart.y,
        }

        return {
          ...line,
          start: {
            x: measurementDrag.lineStart.start.x + delta.x,
            y: measurementDrag.lineStart.start.y + delta.y,
          },
          end: {
            x: measurementDrag.lineStart.end.x + delta.x,
            y: measurementDrag.lineStart.end.y + delta.y,
          },
        }
      })
    )
    return true
  }

  function finishMeasurementDrag(event: ReactPointerEvent<SVGSVGElement>) {
    if (!measurementDrag) {
      return false
    }

    if (svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId)
    }

    const drag = measurementDrag
    setMeasurementDrag(null)
    if (drag.type === "create") {
      setMeasurements((current) =>
        current.filter(
          (line) => line.id !== drag.id || distance(line.start, line.end) >= 8
        )
      )
    }

    return true
  }

  function startMeasurementDrag(
    event: PointerEvent<SVGElement>,
    line: MeasurementLine,
    type: MeasurementDrag["type"]
  ) {
    if (type === "create" || !svgRef.current) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    svgRef.current.focus()
    svgRef.current.setPointerCapture(event.pointerId)
    setSelectedMeasurementId(line.id)
    setSelectedFeatureId(null)
    setActivePointIndex(null)
    setActivePoolPointIndex(null)
    setEditingMeasurement(null)
    setMeasurementDrag({
      type,
      id: line.id,
      pointerStart: clientPointToSvgPoint(event, svgRef.current),
      lineStart: line,
    })
  }

  function commitMeasurementLength() {
    if (!editingMeasurement) {
      return
    }

    const newLengthMeters = Number.parseFloat(
      editingMeasurement.value.replace(",", ".")
    )

    if (!Number.isFinite(newLengthMeters) || newLengthMeters <= 0) {
      setEditingMeasurement(null)
      return
    }

    setMeasurements((current) =>
      current.map((line) =>
        line.id === editingMeasurement.id
          ? setMeasurementLength(line, newLengthMeters)
          : line
      )
    )
    setEditingMeasurement(null)
  }

  function selectFeature(featureId: string) {
    setSelectedFeatureId(featureId)
    setActivePointIndex(null)
    setActivePoolPointIndex(null)
    setSelectedMeasurementId(null)
    setEditingMeasurement(null)
  }

  function placePergolaFromCanvas(event: ReactPointerEvent<SVGSVGElement>) {
    if (
      placementMode !== "pergola" ||
      !svgRef.current ||
      isInteractiveTarget(event.target)
    ) {
      return false
    }

    const point = clientPointToSvgPoint(event, svgRef.current)
    if (!pointInPolygon(point, deckPoints)) {
      return false
    }

    event.preventDefault()
    svgRef.current.focus()
    const feature = createDefaultPergola({
      point,
      rotationDeg: boardDirection.boardDirectionDeg,
    })
    setFeatures((currentFeatures) => [...currentFeatures, feature])
    setActivePointIndex(null)
    setActivePoolPointIndex(null)
    setSelectedMeasurementId(null)
    setEditingMeasurement(null)
    onFeaturePlaced(feature.id)
    return true
  }

  function placeSiteObjectFromCanvas(event: ReactPointerEvent<SVGSVGElement>) {
    const kind = getSiteObjectKindFromPlacementMode(placementMode)
    if (!kind || !svgRef.current || isInteractiveTarget(event.target)) {
      return false
    }

    event.preventDefault()
    svgRef.current.focus()
    const point = clampSitePointToBounds(
      clientPointToSvgPoint(event, svgRef.current)
    )
    const feature = createDefaultSiteObject({
      kind,
      point,
      rotationDeg: boardDirection.boardDirectionDeg,
    })
    setFeatures((currentFeatures) => [...currentFeatures, feature])
    setActivePointIndex(null)
    setActivePoolPointIndex(null)
    setSelectedMeasurementId(null)
    setEditingMeasurement(null)
    onFeaturePlaced(feature.id)
    return true
  }

  function clampSitePointToBounds(point: Point): Point {
    const padding = 220
    return {
      x: clamp(
        point.x,
        contentBounds.left - padding,
        contentBounds.right + padding
      ),
      y: clamp(
        point.y,
        contentBounds.top - padding,
        contentBounds.bottom + padding
      ),
    }
  }

  function placeFeatureOnDeckEdge(edgeIndex: number) {
    if (
      !placementMode ||
      placementMode === "pergola" ||
      getSiteObjectKindFromPlacementMode(placementMode) ||
      placementMode === "boardDirection"
    ) {
      return false
    }

    const edge = editor.edges[edgeIndex]
    if (!edge) {
      return false
    }

    if (placementMode === "railing") {
      if (editor.attachedEdgeIndexes.has(edgeIndex)) {
        return true
      }

      const existingRailing = features.find(
        (feature): feature is RailingFeature =>
          feature.type === "railing" && feature.edgeIds.includes(edge.id)
      )

      if (existingRailing) {
        const nextEdgeIds = existingRailing.edgeIds.filter(
          (edgeId) => edgeId !== edge.id
        )
        if (nextEdgeIds.length === 0) {
          setFeatures((currentFeatures) =>
            currentFeatures.filter(
              (feature) => feature.id !== existingRailing.id
            )
          )
          setSelectedFeatureId(null)
          return true
        }

        setFeatures((currentFeatures) =>
          currentFeatures.map((feature) =>
            feature.id === existingRailing.id
              ? { ...existingRailing, edgeIds: nextEdgeIds }
              : feature
          )
        )
        onFeaturePlaced(existingRailing.id, true)
        return true
      }

      const selectedRailing = features.find(
        (feature): feature is RailingFeature =>
          feature.id === selectedFeatureId && feature.type === "railing"
      )

      if (selectedRailing) {
        const nextRailing = {
          ...selectedRailing,
          edgeIds: Array.from(new Set([...selectedRailing.edgeIds, edge.id])),
        }
        setFeatures((currentFeatures) =>
          currentFeatures.map((feature) =>
            feature.id === selectedRailing.id ? nextRailing : feature
          )
        )
        onFeaturePlaced(nextRailing.id, true)
        return true
      }

      const feature = createDefaultRailing(edge)
      setFeatures((currentFeatures) => [...currentFeatures, feature])
      onFeaturePlaced(feature.id, true)
      return true
    }

    const feature =
      placementMode === "stairs"
        ? createDefaultStairs({ edge })
        : createDefaultPrivacyScreen(edge)
    setFeatures((currentFeatures) => [...currentFeatures, feature])
    setActivePointIndex(null)
    setActivePoolPointIndex(null)
    setSelectedMeasurementId(null)
    setEditingMeasurement(null)
    onFeaturePlaced(feature.id)
    return true
  }

  return (
    <svg
      ref={svgRef}
      tabIndex={0}
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      className={`h-full w-full touch-none drop-shadow-sm outline-none select-none ${svgCursorClass}`}
      onKeyDown={handleKeyDown}
      onPointerCancel={handlePointerEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      role="img"
      aria-label="Deck plan with house outline, deck polygon, dimensions, and draggable corner handles"
    >
      <defs>
        <clipPath id="deck-clip">
          <polygon points={getPolygonPoints(deckPoints)} />
        </clipPath>
      </defs>

      <HouseLayer
        doors={houseDoors}
        editingDimension={editor.editingDimension}
        houseBounds={houseBounds}
        onCancelEdit={dimensions.cancelEditingDimension}
        onCommitEdit={dimensions.commitEditingDimension}
        onDoorPointerDown={startDoorDrag}
        onEditValueChange={dimensions.updateEditingDimension}
        onWindowPointerDown={startWindowDrag}
        roofStyle={getHouseRoofStyle(house)}
        windows={houseWindows}
      />
      <DeckLayer
        activeTool={activeTool}
        activePointIndex={activePointIndex}
        activePoolPointIndex={activePoolPointIndex}
        boardDirection={boardDirection}
        deckPoints={deckPoints}
        editor={editor}
        features={features}
        houseBounds={houseBounds}
        placementMode={placementMode}
        poolEditor={poolEditor}
        poolPoints={poolPoints}
        selectedFeatureId={selectedFeatureId}
        supportSegments={supportSegments}
        onDeckEdgeClick={placeFeatureOnDeckEdge}
        onPergolaPointerDown={startPergolaDrag}
        onSelectFeature={selectFeature}
        onSiteObjectPointerDown={startSiteObjectDrag}
        onStairPointerDown={startStairDrag}
      />
      <MeasurementLayer
        editingMeasurement={editingMeasurement}
        measurements={measurements}
        selectedMeasurementId={selectedMeasurementId}
        onCommitMeasurementLength={commitMeasurementLength}
        onEditMeasurementValueChange={(value) =>
          setEditingMeasurement((current) =>
            current ? { ...current, value } : current
          )
        }
        onSelectMeasurement={(id) => {
          setSelectedMeasurementId(id)
          setSelectedFeatureId(null)
          setActivePointIndex(null)
          setActivePoolPointIndex(null)
        }}
        onStartEdit={(line) =>
          setEditingMeasurement({
            id: line.id,
            value: formatLengthInput(
              distance(line.start, line.end) / PIXELS_PER_METER
            ),
          })
        }
        onStartDrag={startMeasurementDrag}
      />
    </svg>
  )
}
