"use client"

import type {
  Dispatch,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
  SetStateAction,
} from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { ZOOM_STEP } from "@/lib/trall/constants"
import { clientPointToSvgPoint } from "@/lib/trall/svg"
import type { PlanContentBounds, Point, ViewBox } from "@/lib/trall/types"
import {
  clampPanViewBox,
  clampViewBoxToContent,
  zoomViewBox,
} from "@/lib/trall/view"

type ViewportPointer = {
  clientX: number
  clientY: number
  svgPoint: Point
}

type PanStart = {
  pointerId: number
  clientX: number
  clientY: number
  viewBox: ViewBox
}

type PinchStart = {
  distance: number
  center: Point
  viewBox: ViewBox
}

export function useCanvasViewport({
  contentBounds,
  onResetView,
  setViewBox,
  svgRef,
  viewBox,
}: {
  contentBounds: PlanContentBounds
  onResetView: () => void
  setViewBox: Dispatch<SetStateAction<ViewBox>>
  svgRef: RefObject<SVGSVGElement | null>
  viewBox: ViewBox
}) {
  const [spacePressed, setSpacePressed] = useState(false)
  const [panStart, setPanStart] = useState<PanStart | null>(null)
  const [pinchActive, setPinchActive] = useState(false)
  const activePointersRef = useRef(new Map<number, ViewportPointer>())
  const pinchStartRef = useRef<PinchStart | null>(null)
  const viewBoxRef = useRef(viewBox)
  const contentBoundsRef = useRef(contentBounds)

  useEffect(() => {
    viewBoxRef.current = viewBox
  }, [viewBox])

  useEffect(() => {
    contentBoundsRef.current = contentBounds
  }, [contentBounds])

  useEffect(() => {
    function handleWindowKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space" || isTypingTarget(event.target)) {
        return
      }

      event.preventDefault()
      setSpacePressed(true)
    }

    function handleWindowKeyUp(event: KeyboardEvent) {
      if (event.code === "Space") {
        setSpacePressed(false)
      }
    }

    window.addEventListener("keydown", handleWindowKeyDown)
    window.addEventListener("keyup", handleWindowKeyUp)

    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown)
      window.removeEventListener("keyup", handleWindowKeyUp)
    }
  }, [])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) {
      return
    }

    function handleWheel(event: WheelEvent) {
      if (!svg || (!event.ctrlKey && !event.metaKey)) {
        return
      }

      event.preventDefault()
      const center = clientPointToSvgPoint(event, svg)
      const factor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP

      setViewBox((currentViewBox) =>
        clampViewBoxToContent(
          zoomViewBox(currentViewBox, factor, center),
          contentBoundsRef.current
        )
      )
    }

    svg.addEventListener("wheel", handleWheel, { passive: false })

    return () => svg.removeEventListener("wheel", handleWheel)
  }, [setViewBox, svgRef])

  const zoomBy = useCallback(
    (factor: number, center?: Point) => {
      setViewBox((currentViewBox) =>
        clampViewBoxToContent(
          zoomViewBox(currentViewBox, factor, center),
          contentBoundsRef.current
        )
      )
    },
    [setViewBox]
  )

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<SVGSVGElement>) => {
      if (event.key === "+" || event.key === "=") {
        event.preventDefault()
        zoomBy(ZOOM_STEP)
        return true
      }

      if (event.key === "-") {
        event.preventDefault()
        zoomBy(1 / ZOOM_STEP)
        return true
      }

      if (event.key === "0") {
        event.preventDefault()
        onResetView()
        return true
      }

      return false
    },
    [onResetView, zoomBy]
  )

  const startPointer = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>, canPan: boolean) => {
      const svg = svgRef.current
      if (!svg || isInteractiveTarget(event.target)) {
        return false
      }

      const isTouchPointer = event.pointerType === "touch"
      if (!canPan && !isTouchPointer) {
        return false
      }

      event.preventDefault()
      svg.focus()
      const captured = setPointerCaptureIfPossible(svg, event.pointerId)
      if (!captured && !event.isTrusted) {
        return false
      }

      activePointersRef.current.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
        svgPoint: clientPointToSvgPoint(event, svg),
      })

      if (activePointersRef.current.size >= 2) {
        const pointers = Array.from(activePointersRef.current.values()).slice(
          0,
          2
        )
        pinchStartRef.current = getPinchStart(pointers, viewBoxRef.current)
        setPinchActive(true)
        setPanStart(null)
        return true
      }

      setPanStart({
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
        viewBox: viewBoxRef.current,
      })
      return true
    },
    [svgRef]
  )

  const movePointer = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      const svg = svgRef.current
      if (!svg) {
        return false
      }

      const currentPointer = activePointersRef.current.get(event.pointerId)
      if (currentPointer) {
        activePointersRef.current.set(event.pointerId, {
          clientX: event.clientX,
          clientY: event.clientY,
          svgPoint: clientPointToSvgPoint(event, svg),
        })
      }

      if (pinchStartRef.current && activePointersRef.current.size >= 2) {
        const pointers = Array.from(activePointersRef.current.values()).slice(
          0,
          2
        )
        const currentDistance = getClientDistance(pointers)
        if (currentDistance <= 0 || pinchStartRef.current.distance <= 0) {
          return true
        }

        const factor = pinchStartRef.current.distance / currentDistance
        const zoomed = zoomViewBox(
          pinchStartRef.current.viewBox,
          factor,
          pinchStartRef.current.center
        )
        const currentCenter = getSvgCenter(pointers)
        const moved = {
          ...zoomed,
          x: zoomed.x + pinchStartRef.current.center.x - currentCenter.x,
          y: zoomed.y + pinchStartRef.current.center.y - currentCenter.y,
        }

        setViewBox(clampPanViewBox(moved, contentBoundsRef.current))
        return true
      }

      if (panStart?.pointerId === event.pointerId) {
        const scaleX = panStart.viewBox.width / svg.clientWidth
        const scaleY = panStart.viewBox.height / svg.clientHeight
        const dxSvg = (event.clientX - panStart.clientX) * scaleX
        const dySvg = (event.clientY - panStart.clientY) * scaleY

        setViewBox(
          clampPanViewBox(
            {
              ...panStart.viewBox,
              x: panStart.viewBox.x - dxSvg,
              y: panStart.viewBox.y - dySvg,
            },
            contentBoundsRef.current
          )
        )
        return true
      }

      return false
    },
    [panStart, setViewBox, svgRef]
  )

  const stopPointer = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      const svg = svgRef.current
      if (svg?.hasPointerCapture(event.pointerId)) {
        svg.releasePointerCapture(event.pointerId)
      }

      activePointersRef.current.delete(event.pointerId)
      pinchStartRef.current = null
      setPinchActive(false)

      if (panStart?.pointerId === event.pointerId) {
        setPanStart(null)
        return true
      }

      if (activePointersRef.current.size === 1) {
        const remainingPointer = Array.from(
          activePointersRef.current.entries()
        )[0]
        if (!remainingPointer) {
          return false
        }

        const [pointerId, pointer] = remainingPointer
        setPanStart({
          pointerId,
          clientX: pointer.clientX,
          clientY: pointer.clientY,
          viewBox: viewBoxRef.current,
        })
      }

      return false
    },
    [panStart?.pointerId, svgRef]
  )

  return useMemo(
    () => ({
      handleKeyDown,
      movePointer,
      panActive: Boolean(panStart) || pinchActive,
      spacePressed,
      startPointer,
      stopPointer,
      zoomBy,
    }),
    [
      handleKeyDown,
      movePointer,
      panStart,
      pinchActive,
      spacePressed,
      startPointer,
      stopPointer,
      zoomBy,
    ]
  )
}

export function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    Boolean(target.closest("[data-interactive='true']"))
  )
}

function getPinchStart(
  pointers: ViewportPointer[],
  viewBox: ViewBox
): PinchStart {
  return {
    center: getSvgCenter(pointers),
    distance: getClientDistance(pointers),
    viewBox,
  }
}

function getClientDistance(pointers: ViewportPointer[]): number {
  const [a, b] = pointers
  if (!a || !b) {
    return 0
  }

  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY)
}

function getSvgCenter(pointers: ViewportPointer[]): Point {
  const [a, b] = pointers
  if (!a || !b) {
    return a?.svgPoint ?? { x: 0, y: 0 }
  }

  return {
    x: (a.svgPoint.x + b.svgPoint.x) / 2,
    y: (a.svgPoint.y + b.svgPoint.y) / 2,
  }
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable)
  )
}

function setPointerCaptureIfPossible(
  element: SVGSVGElement,
  pointerId: number
): boolean {
  try {
    element.setPointerCapture(pointerId)
    return true
  } catch {
    return false
  }
}
