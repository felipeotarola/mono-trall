/* eslint-disable react/no-unknown-property */

import { useMemo } from "react"

import type { Plan3DLine } from "@/lib/trall/plan-3d"
import { deckOverlayY } from "@/lib/trall/plan-3d-layers"

import { createLineSegmentsGeometry } from "@/components/trall/plan-3d-view/geometry"

const BOARD_LINE_LIMIT = 72

export function BoardLines({
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
