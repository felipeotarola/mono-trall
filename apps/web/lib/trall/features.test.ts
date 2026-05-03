import assert from "node:assert/strict"
import test from "node:test"

import {
  createDefaultRailing,
  createDefaultStairs,
  defaultBoardDirection,
  normalizeBoardDirection,
  normalizeDeckFeatures,
  rotateBoardDirection,
} from "./features.ts"
import { getPolygonEdges } from "./edge-model.ts"

const edge = getPolygonEdges({
  constraints: [],
  points: [
    { x: 0, y: 0 },
    { x: 160, y: 0 },
    { x: 160, y: 120 },
    { x: 0, y: 120 },
  ],
  prefix: "deck",
})[0]!

test("creates default feature objects from deck edges", () => {
  const stairs = createDefaultStairs({ edge })
  const railing = createDefaultRailing(edge)

  assert.equal(stairs.type, "stairs")
  assert.equal(stairs.edgeId, "deck-edge-0")
  assert.equal(stairs.stepCount, 2)
  assert.equal(railing.heightCm, 110)
  assert.deepEqual(railing.edgeIds, ["deck-edge-0"])
})

test("normalizes missing feature and board direction data", () => {
  assert.deepEqual(normalizeDeckFeatures(undefined), [])
  assert.deepEqual(normalizeBoardDirection(undefined), defaultBoardDirection)
})

test("clamps persisted feature settings", () => {
  const [stairs] = normalizeDeckFeatures([
    {
      id: "stairs-1",
      type: "stairs",
      edgeId: "deck-edge-2",
      widthM: 10,
      depthM: -2,
      stepCount: 20,
      direction: "inward",
      label: "",
    },
  ])

  assert.equal(stairs?.type, "stairs")
  if (stairs?.type === "stairs") {
    assert.equal(stairs.widthM, 3)
    assert.equal(stairs.depthM, 0.3)
    assert.equal(stairs.stepCount, 8)
    assert.equal(stairs.label, "Stairs")
  }
})

test("rotates board direction by 90 degrees", () => {
  assert.deepEqual(rotateBoardDirection(defaultBoardDirection), {
    boardDirectionDeg: 90,
    boardDirectionMode: "perpendicular-house",
  })
})
