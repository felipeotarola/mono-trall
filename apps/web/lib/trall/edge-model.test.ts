import assert from "node:assert/strict"
import test from "node:test"

import {
  getPolygonEdges,
  linkEdges,
  setEdgeAndLinkedLengths,
  setEdgeLength,
  type EdgeConstraint,
} from "./edge-model.ts"

const bounds = {
  minX: -1000,
  maxX: 1000,
  minY: -1000,
  maxY: 1000,
}

test("builds explicit edge model from polygon points", () => {
  const points = [
    { x: 0, y: 0 },
    { x: 160, y: 0 },
    { x: 160, y: 80 },
    { x: 0, y: 80 },
  ]
  const edges = getPolygonEdges({ constraints: [], points, prefix: "deck" })

  assert.deepEqual(edges[0], {
    id: "deck-edge-0",
    startPointId: "deck-point-0",
    endPointId: "deck-point-1",
    index: 0,
    start: points[0],
    end: points[1],
    length: 4,
    locked: false,
    linkedEdgeId: null,
  })
})

test("sets manual edge length exactly without grid snapping", () => {
  const points = [
    { x: 0, y: 0 },
    { x: 160, y: 0 },
    { x: 160, y: 80 },
  ]
  const nextPoints = setEdgeLength({
    edgeIndex: 0,
    lengthM: 4.25,
    pointBounds: bounds,
    points,
  })
  const edge = getPolygonEdges({
    constraints: [],
    points: nextPoints,
    prefix: "deck",
  })[0]

  assert.equal(edge?.length, 4.25)
  assert.deepEqual(nextPoints[1], { x: 170, y: 0 })
})

test("linked edges share manually edited length", () => {
  const points = [
    { x: 0, y: 0 },
    { x: 160, y: 0 },
    { x: 160, y: 80 },
    { x: 0, y: 80 },
  ]
  const constraints: EdgeConstraint[] = linkEdges(
    [
      { id: "deck-edge-0", locked: false },
      { id: "deck-edge-1", locked: false },
      { id: "deck-edge-2", locked: false },
      { id: "deck-edge-3", locked: false },
    ],
    "deck-edge-0",
    "deck-edge-2"
  )
  const nextPoints = setEdgeAndLinkedLengths({
    constraints,
    edgeIndex: 0,
    lengthM: 3.5,
    pointBounds: bounds,
    points,
    prefix: "deck",
  })
  const edges = getPolygonEdges({
    constraints,
    points: nextPoints,
    prefix: "deck",
  })

  assert.equal(edges[0]?.length, 3.5)
  assert.equal(edges[2]?.length, 3.5)
})
