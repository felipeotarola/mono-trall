import assert from "node:assert/strict"
import test from "node:test"

import {
  getProjectMaterialLineTotal,
  getProjectMaterialTotals,
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
      description: "  Main surface ",
    }),
    {
      name: "Deck boards",
      category: "Decking",
      unit: "linear_metre",
      cost: 12.35,
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
      description: "",
    }),
    {
      input: {
        name: "Screws",
        category: "Fasteners",
        unit: "box",
        cost: 32.01,
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
      description: null,
      created_by: "user-1",
      active: true,
      created_at: now,
      updated_at: now,
    },
  }
}
