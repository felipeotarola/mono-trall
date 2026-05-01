import type { Point } from "./types"

type ClientPointEvent = {
  clientX: number
  clientY: number
}

export function clientPointToSvgPoint(
  event: ClientPointEvent,
  svg: SVGSVGElement
): Point {
  const point = svg.createSVGPoint()
  point.x = event.clientX
  point.y = event.clientY

  const screenCtm = svg.getScreenCTM()
  if (!screenCtm) {
    return { x: point.x, y: point.y }
  }

  const svgPoint = point.matrixTransform(screenCtm.inverse())
  return { x: svgPoint.x, y: svgPoint.y }
}
