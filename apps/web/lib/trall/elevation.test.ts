import assert from "node:assert/strict"
import test from "node:test"

import {
  defaultElevationSettings,
  getPoolDeckRelationship,
  normalizeElevationSettings,
  updateElevationSetting,
} from "./elevation.ts"

test("normalizes missing elevation settings with defaults", () => {
  assert.deepEqual(normalizeElevationSettings(undefined), defaultElevationSettings)
})

test("clamps elevation settings to supported ranges", () => {
  assert.equal(
    updateElevationSetting(defaultElevationSettings, "deckHeightCm", 260)
      .deckHeightCm,
    200
  )
  assert.equal(
    updateElevationSetting(defaultElevationSettings, "poolDepthCm", 5)
      .poolDepthCm,
    20
  )
})

test("describes pool top height relative to deck", () => {
  assert.equal(
    getPoolDeckRelationship({
      ...defaultElevationSettings,
      deckHeightCm: 45,
      poolTopHeightCm: 45,
    }).status,
    "flush"
  )
  assert.equal(
    getPoolDeckRelationship({
      ...defaultElevationSettings,
      deckHeightCm: 45,
      poolTopHeightCm: 60,
    }).label,
    "Pool is 15 cm above deck"
  )
})
