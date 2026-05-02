import assert from "node:assert/strict"
import test from "node:test"

import { getSupportLayout } from "./supports.ts"

test("calculates c/c support segments inside a rectangular deck", () => {
  const layout = getSupportLayout({
    points: [
      { x: 0, y: 0 },
      { x: 120, y: 0 },
      { x: 120, y: 80 },
      { x: 0, y: 80 },
    ],
    spacingM: 0.6,
  })

  assert.equal(layout.segments.length, 5)
  assert.equal(layout.totalLengthM, 10)
  assert.deepEqual(layout.segments[0], {
    x1: 12,
    y1: 0,
    x2: 12,
    y2: 80,
    lengthM: 2,
  })
})

test("clips c/c support segments to an angled deck polygon", () => {
  const layout = getSupportLayout({
    points: [
      { x: 0, y: 0 },
      { x: 80, y: 0 },
      { x: 120, y: 80 },
      { x: 0, y: 80 },
    ],
    spacingM: 0.6,
  })

  assert.equal(layout.segments.length, 5)
  assert.equal(layout.totalLengthM, 8.4)
  assert.equal(layout.segments.at(-1)?.y1, 56)
  assert.equal(layout.segments.at(-1)?.y2, 80)
})

test("clips c/c support segments around a pool cutout", () => {
  const layout = getSupportLayout({
    holes: [
      [
        { x: 24, y: 24 },
        { x: 72, y: 24 },
        { x: 72, y: 56 },
        { x: 24, y: 56 },
      ],
    ],
    points: [
      { x: 0, y: 0 },
      { x: 120, y: 0 },
      { x: 120, y: 80 },
      { x: 0, y: 80 },
    ],
    spacingM: 0.6,
  })

  assert.equal(layout.segments.length, 7)
  assert.equal(layout.totalLengthM, 8.4)
  assert.deepEqual(layout.segments.slice(1, 3), [
    { x1: 36, y1: 0, x2: 36, y2: 24, lengthM: 0.6 },
    { x1: 36, y1: 56, x2: 36, y2: 80, lengthM: 0.6 },
  ])
})
