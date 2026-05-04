import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  cmToM,
  getDefaultElevationSettings,
  getTerrainHeightAt,
  normalizeElevationSettings,
} from "./elevation.ts"

describe("elevation settings", () => {
  it("normalizes missing elevation settings with defaults", () => {
    const settings = normalizeElevationSettings(undefined)

    assert.deepEqual(settings, getDefaultElevationSettings())
    assert.equal(cmToM(settings.pool.bodyHeightCm), 1.2)
  })

  it("interpolates single-slope terrain in metres", () => {
    const settings = getDefaultElevationSettings()
    const bounds = { minX: -5, maxX: 5, minZ: -5, maxZ: 5 }

    assert.equal(
      getTerrainHeightAt({ x: 0, z: -5 }, settings.terrain, bounds),
      -0.4
    )
    assert.equal(
      getTerrainHeightAt({ x: 0, z: 5 }, settings.terrain, bounds),
      -1.2
    )
  })
})
