import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { initialHouse, PIXELS_PER_METER } from "./constants.ts"
import { getDefaultElevationSettings } from "./elevation.ts"
import { defaultBoardDirection } from "./features.ts"
import {
  DEFAULT_HOUSE_WALL_HEIGHT_M,
  getPlan3DModel,
  pointToPlan3D,
  STANDARD_DOOR_HEIGHT_M,
  STANDARD_DOOR_WIDTH_M,
} from "./plan-3d.ts"

describe("plan 3D conversion", () => {
  it("converts planner pixels to centered metres", () => {
    assert.deepEqual(
      pointToPlan3D(
        { x: PIXELS_PER_METER * 2, y: PIXELS_PER_METER * 3 },
        { x: PIXELS_PER_METER, y: PIXELS_PER_METER }
      ),
      { x: 1, z: 2 }
    )
  })

  it("clips deck board preview lines to the deck polygon", () => {
    const deckPoints = [
      { x: 0, y: 0 },
      { x: PIXELS_PER_METER * 4, y: 0 },
      { x: PIXELS_PER_METER * 4, y: PIXELS_PER_METER * 3 },
      { x: 0, y: PIXELS_PER_METER * 3 },
    ]
    const model = getPlan3DModel({
      boardDirection: defaultBoardDirection,
      deckEdgeConstraints: [],
      deckPoints,
      elevationSettings: getDefaultElevationSettings(),
      features: [],
      house: initialHouse,
      houseBounds: {
        left:
          initialHouse.centerX - (initialHouse.widthM * PIXELS_PER_METER) / 2,
        right:
          initialHouse.centerX + (initialHouse.widthM * PIXELS_PER_METER) / 2,
        top: initialHouse.topY,
        bottom: initialHouse.topY + initialHouse.depthM * PIXELS_PER_METER,
        centerX: initialHouse.centerX,
        widthPx: initialHouse.widthM * PIXELS_PER_METER,
        depthPx: initialHouse.depthM * PIXELS_PER_METER,
      },
      poolPoints: null,
    })

    assert.ok(model.boardLines.length > 0)
    assert.equal(model.house.doors.length, initialHouse.doors?.length)
    assert.equal(model.house.windows.length, initialHouse.windows?.length)
    assert.equal(model.house.heightM, DEFAULT_HOUSE_WALL_HEIGHT_M)
    assert.equal(model.house.roofStyle, "gable")

    for (const door of model.house.doors) {
      assert.equal(door.widthM, STANDARD_DOOR_WIDTH_M)
      assert.equal(door.heightM, STANDARD_DOOR_HEIGHT_M)
      assert.ok(door.heightM < model.house.heightM)
    }

    const minX = Math.min(...model.deckPoints.map((point) => point.x))
    const maxX = Math.max(...model.deckPoints.map((point) => point.x))
    const minZ = Math.min(...model.deckPoints.map((point) => point.z))
    const maxZ = Math.max(...model.deckPoints.map((point) => point.z))

    for (const line of model.boardLines) {
      assert.ok(line.start.x >= minX)
      assert.ok(line.start.x <= maxX)
      assert.ok(line.end.x >= minX)
      assert.ok(line.end.x <= maxX)
      assert.ok(line.start.z >= minZ)
      assert.ok(line.start.z <= maxZ)
      assert.ok(line.end.z >= minZ)
      assert.ok(line.end.z <= maxZ)
    }
  })

  it("uses configured house window dimensions in the 3D model", () => {
    const model = getPlan3DModel({
      boardDirection: defaultBoardDirection,
      deckEdgeConstraints: [],
      deckPoints: [
        { x: 0, y: 0 },
        { x: PIXELS_PER_METER * 4, y: 0 },
        { x: PIXELS_PER_METER * 4, y: PIXELS_PER_METER * 3 },
        { x: 0, y: PIXELS_PER_METER * 3 },
      ],
      elevationSettings: getDefaultElevationSettings(),
      features: [],
      house: {
        ...initialHouse,
        windows: [
          {
            id: "custom-window",
            offsetM: 0,
            row: "lower",
            widthCm: 85,
            heightCm: 145,
          },
        ],
      },
      houseBounds: {
        left:
          initialHouse.centerX - (initialHouse.widthM * PIXELS_PER_METER) / 2,
        right:
          initialHouse.centerX + (initialHouse.widthM * PIXELS_PER_METER) / 2,
        top: initialHouse.topY,
        bottom: initialHouse.topY + initialHouse.depthM * PIXELS_PER_METER,
        centerX: initialHouse.centerX,
        widthPx: initialHouse.widthM * PIXELS_PER_METER,
        depthPx: initialHouse.depthM * PIXELS_PER_METER,
      },
      poolPoints: null,
    })

    assert.equal(model.house.windows[0]?.widthM, 0.85)
    assert.equal(model.house.windows[0]?.heightM, 1.45)
  })

  it("uses configured house door dimensions in the 3D model", () => {
    const model = getPlan3DModel({
      boardDirection: defaultBoardDirection,
      deckEdgeConstraints: [],
      deckPoints: [
        { x: 0, y: 0 },
        { x: PIXELS_PER_METER * 4, y: 0 },
        { x: PIXELS_PER_METER * 4, y: PIXELS_PER_METER * 3 },
        { x: 0, y: PIXELS_PER_METER * 3 },
      ],
      elevationSettings: getDefaultElevationSettings(),
      features: [],
      house: {
        ...initialHouse,
        doors: [
          {
            id: "custom-door",
            offsetM: 0,
            widthCm: 110,
            heightCm: 220,
          },
        ],
      },
      houseBounds: {
        left:
          initialHouse.centerX - (initialHouse.widthM * PIXELS_PER_METER) / 2,
        right:
          initialHouse.centerX + (initialHouse.widthM * PIXELS_PER_METER) / 2,
        top: initialHouse.topY,
        bottom: initialHouse.topY + initialHouse.depthM * PIXELS_PER_METER,
        centerX: initialHouse.centerX,
        widthPx: initialHouse.widthM * PIXELS_PER_METER,
        depthPx: initialHouse.depthM * PIXELS_PER_METER,
      },
      poolPoints: null,
    })

    assert.equal(model.house.doors[0]?.widthM, 1.1)
    assert.equal(model.house.doors[0]?.heightM, 2.2)
  })

  it("preserves configured house roof style in the 3D model", () => {
    const model = getPlan3DModel({
      boardDirection: defaultBoardDirection,
      deckEdgeConstraints: [],
      deckPoints: [
        { x: 0, y: 0 },
        { x: PIXELS_PER_METER * 4, y: 0 },
        { x: PIXELS_PER_METER * 4, y: PIXELS_PER_METER * 3 },
        { x: 0, y: PIXELS_PER_METER * 3 },
      ],
      elevationSettings: getDefaultElevationSettings(),
      features: [],
      house: {
        ...initialHouse,
        roofStyle: "shed",
      },
      houseBounds: {
        left:
          initialHouse.centerX - (initialHouse.widthM * PIXELS_PER_METER) / 2,
        right:
          initialHouse.centerX + (initialHouse.widthM * PIXELS_PER_METER) / 2,
        top: initialHouse.topY,
        bottom: initialHouse.topY + initialHouse.depthM * PIXELS_PER_METER,
        centerX: initialHouse.centerX,
        widthPx: initialHouse.widthM * PIXELS_PER_METER,
        depthPx: initialHouse.depthM * PIXELS_PER_METER,
      },
      poolPoints: null,
    })

    assert.equal(model.house.roofStyle, "shed")
  })
})
