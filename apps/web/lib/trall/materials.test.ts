import assert from "node:assert/strict"
import test from "node:test"

import {
  getProjectMaterialLineTotal,
  getProjectMaterialTotals,
  getDeckingLinearMetres,
  getMaterialDimensionsLabel,
  getPiecesForLinearMetres,
  isMaterialUnit,
  normalizeMaterialInput,
  parseMaterialInputBody,
  parseProjectMaterialQuantity,
  type ProjectMaterialItem,
} from "./materials.ts"

const now = "2026-05-02T00:00:00.000Z"

test("normalizes material input for persistence", () => {
  assert.deepEqual(
    normalizeMaterialInput({
      name: "  Deck boards ",
      category: " Decking ",
      unit: "linear_metre",
      cost: 12.345,
      thickness_mm: 34,
      width_mm: 170,
      length_mm: 5100,
      image_url: " https://example.com/deck.jpg ",
      description: "  Main surface ",
    }),
    {
      name: "Deck boards",
      category: "Decking",
      unit: "linear_metre",
      cost: 12.35,
      thickness_mm: 34,
      width_mm: 170,
      length_mm: 5100,
      image_url: "https://example.com/deck.jpg",
      description: "Main surface",
    }
  )
})

test("guards supported material units", () => {
  assert.equal(isMaterialUnit("box"), true)
  assert.equal(isMaterialUnit("bucket"), false)
})

test("parses API material payloads", () => {
  assert.deepEqual(
    parseMaterialInputBody({
      name: " Screws ",
      category: " Fasteners ",
      unit: "box",
      cost: "32.009",
      thickness_mm: "",
      width_mm: "4.5",
      length_mm: null,
      image_url: "",
      description: "",
    }),
    {
      input: {
        name: "Screws",
        category: "Fasteners",
        unit: "box",
        cost: 32.01,
        thickness_mm: null,
        width_mm: 4.5,
        length_mm: null,
        image_url: null,
        description: null,
      },
    }
  )
  assert.deepEqual(parseMaterialInputBody({ name: "Screws" }), {
    error: "Material category is required",
  })
})

test("parses project material quantities", () => {
  assert.equal(parseProjectMaterialQuantity("2.5"), 2.5)
  assert.equal(parseProjectMaterialQuantity(-1), null)
  assert.equal(parseProjectMaterialQuantity("bad"), null)
})

test("calculates decking linear metres from board width", () => {
  assert.equal(
    getDeckingLinearMetres({
      areaM2: 24,
      gapMm: 5,
      widthMm: 170,
      wasteFactor: 0.1,
    }),
    150.9
  )
  assert.equal(
    getPiecesForLinearMetres({ linearMetres: 150.9, lengthMm: 5100 }),
    30
  )
  assert.equal(
    getMaterialDimensionsLabel({
      thickness_mm: 34,
      width_mm: 170,
      length_mm: 5100,
    }),
    "34 x 170 x 5100 mm"
  )
})

test("calculates project material totals by line and unit", () => {
  const items: ProjectMaterialItem[] = [
    makeProjectMaterial("decking", "linear_metre", 10, 39),
    makeProjectMaterial("screws", "box", 2, 32),
    makeProjectMaterial("joists", "linear_metre", 4.5, 18.5),
  ]

  assert.equal(getProjectMaterialLineTotal(items[0]!), 390)
  assert.deepEqual(getProjectMaterialTotals(items), {
    totalCost: 537.25,
    totalQuantity: 16.5,
    quantityByUnit: {
      metre: 0,
      linear_metre: 14.5,
      square_metre: 0,
      piece: 0,
      box: 2,
      pack: 0,
    },
  })
})

function makeProjectMaterial(
  id: string,
  unit: ProjectMaterialItem["material"]["unit"],
  quantity: number,
  cost: number
): ProjectMaterialItem {
  return {
    project_id: "project-1",
    material_id: id,
    quantity,
    created_at: now,
    updated_at: now,
    material: {
      id,
      name: id,
      category: "Test",
      unit,
      cost,
      thickness_mm: null,
      width_mm: null,
      length_mm: null,
      image_url: null,
      description: null,
      created_by: "user-1",
      active: true,
      created_at: now,
      updated_at: now,
    },
  }
}
