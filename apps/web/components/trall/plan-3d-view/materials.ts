import { useEffect, useMemo } from "react"
import { useTexture } from "@react-three/drei"
import * as THREE from "three"

import {
  getDefaultHouseWallColor,
  type AppearanceSettings,
} from "@/lib/trall/appearance"

export type SceneMaterials = {
  boardLineColor: string
  deckColor: string
  deckRoughness: number
  excavationColor: string
  excavationRimColor: string
  houseWallColor: string
  poolBorderColor: string
  poolWallColor: string
  poolWaterColor: string
  roofColor: string
  stairColor: string
  supportColor: string
  terrainColor: string
  terrainRoughness: number
}

export type SceneTextureMaps = {
  deck?: THREE.Texture
  houseWall?: THREE.Texture
  poolWall?: THREE.Texture
  roof?: THREE.Texture
  terrain?: THREE.Texture
}

type TextureKey =
  | "deck-treated-wood"
  | "deck-cedar"
  | "deck-grey-composite"
  | "house-light-plaster"
  | "house-timber-siding"
  | "house-brick"
  | "roof-dark-metal"
  | "roof-red-tile"
  | "roof-felt"
  | "pool-white-liner"
  | "pool-blue-tile"
  | "pool-concrete"
  | "terrain-soil"
  | "terrain-grass"
  | "terrain-gravel"

const TEXTURE_URL_BY_KEY = {
  "deck-treated-wood": "/trall/textures/deck-treated-wood.jpg",
  "deck-cedar": "/trall/textures/deck-cedar.jpg",
  "deck-grey-composite": "/trall/textures/deck-grey-composite.jpg",
  "house-light-plaster": "/trall/textures/house-light-plaster.jpg",
  "house-timber-siding": "/trall/textures/house-timber-siding.jpg",
  "house-brick": "/trall/textures/house-brick.jpg",
  "roof-dark-metal": "/trall/textures/roof-dark-metal-alt.jpg",
  "roof-red-tile": "/trall/textures/roof-red-tile.jpg",
  "roof-felt": "/trall/textures/roof-felt.jpg",
  "pool-white-liner": "/trall/textures/pool-white-liner.jpg",
  "pool-blue-tile": "/trall/textures/pool-blue-tile.jpg",
  "pool-concrete": "/trall/textures/pool-concrete.jpg",
  "terrain-soil": "/trall/textures/terrain-soil.jpg",
  "terrain-grass": "/trall/textures/terrain-grass.jpg",
  "terrain-gravel": "/trall/textures/terrain-gravel.jpg",
} as const satisfies Record<TextureKey, string>

type SceneTextureSelection = {
  deck: TextureKey
  houseWall: TextureKey
  poolWall: TextureKey
  roof: TextureKey
  terrain: TextureKey
}

export function getSceneMaterials(
  appearance: AppearanceSettings
): SceneMaterials {
  const realistic = appearance.renderMode === "realistic"
  const deck = {
    treated_wood: {
      color: realistic ? "#9b6f43" : "#a87948",
      line: "#5f3d24",
      support: "#60482f",
      stair: "#aa7d4e",
    },
    cedar: {
      color: realistic ? "#b66f3b" : "#b77a45",
      line: "#714222",
      support: "#6f4327",
      stair: "#bd8050",
    },
    grey_composite: {
      color: realistic ? "#8b8d87" : "#9a9b94",
      line: "#535650",
      support: "#5f625c",
      stair: "#8d8f88",
    },
  }[appearance.deckMaterial]
  const houseWall = {
    light_plaster: realistic ? "#d8d3ca" : "#ddd8d0",
    painted_wood: realistic ? "#d6d1c5" : "#ded8cb",
    timber_siding: realistic ? "#b78a5d" : "#c09668",
    concrete: realistic ? "#aaa9a0" : "#b8b6ad",
    brick: realistic ? "#9f5d45" : "#ad6750",
  }[appearance.houseWallMaterial]
  const roof = {
    dark_metal: realistic ? "#5e5b55" : "#77736b",
    red_tile: realistic ? "#8f4534" : "#a7523e",
    roofing_felt: realistic ? "#4f504b" : "#62635d",
  }[appearance.roofMaterial]
  const poolWall = {
    white_liner: realistic ? "#d8e3e7" : "#dce8eb",
    blue_tile: realistic ? "#5fa6c2" : "#6db3cc",
    concrete: realistic ? "#aaa9a0" : "#b8b6ad",
  }[appearance.poolWallMaterial]
  const terrain = {
    soil: {
      color: realistic ? "#8d795d" : "#b9b09f",
      excavation: "#7d674c",
      rim: "#594733",
    },
    grass: {
      color: realistic ? "#74885d" : "#91a174",
      excavation: "#76664d",
      rim: "#52613d",
    },
    gravel: {
      color: realistic ? "#9a978e" : "#b4b1a8",
      excavation: "#817d73",
      rim: "#626058",
    },
  }[appearance.terrainMaterial]

  return {
    boardLineColor: deck.line,
    deckColor: deck.color,
    deckRoughness: realistic ? 0.86 : 0.78,
    excavationColor: terrain.excavation,
    excavationRimColor: terrain.rim,
    houseWallColor:
      appearance.houseWallColor ||
      getDefaultHouseWallColor(appearance.houseWallMaterial) ||
      houseWall,
    poolBorderColor:
      appearance.poolWallMaterial === "blue_tile" ? "#d9f4ff" : "#e7f8ff",
    poolWallColor: poolWall,
    poolWaterColor: realistic ? "#1f87c9" : "#2b8fd6",
    roofColor: roof,
    stairColor: deck.stair,
    supportColor: deck.support,
    terrainColor: terrain.color,
    terrainRoughness: realistic ? 0.98 : 0.96,
  }
}

export function useSelectedTextureMaps(selection: SceneTextureSelection) {
  const keys = useMemo(
    () => [
      selection.deck,
      selection.houseWall,
      selection.roof,
      selection.poolWall,
      selection.terrain,
    ],
    [selection]
  )
  const textures = useTexture(keys.map((key) => TEXTURE_URL_BY_KEY[key]))

  useEffect(() => {
    textures.forEach((texture, index) => {
      const key = keys[index]
      const repeat = key?.startsWith("deck-")
        ? [6, 6]
        : key?.startsWith("terrain-")
          ? [5, 5]
          : key?.startsWith("roof-")
            ? [3, 2]
            : key?.startsWith("house-")
              ? [3, 1.4]
              : [2, 2]

      texture.colorSpace = THREE.SRGBColorSpace
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      texture.repeat.set(repeat[0] ?? 1, repeat[1] ?? 1)
      texture.anisotropy = 4
      texture.needsUpdate = true
    })
  }, [keys, textures])

  return useMemo(
    () => ({
      deck: textures[0],
      houseWall: textures[1],
      roof: textures[2],
      poolWall: textures[3],
      terrain: textures[4],
    }),
    [textures]
  )
}

export function getSceneTextureSelection(
  appearance: AppearanceSettings
): SceneTextureSelection {
  return {
    deck: (
      {
        treated_wood: "deck-treated-wood",
        cedar: "deck-cedar",
        grey_composite: "deck-grey-composite",
      } satisfies Record<AppearanceSettings["deckMaterial"], TextureKey>
    )[appearance.deckMaterial],
    houseWall: (
      {
        light_plaster: "house-light-plaster",
        painted_wood: "house-timber-siding",
        timber_siding: "house-timber-siding",
        concrete: "pool-concrete",
        brick: "house-brick",
      } satisfies Record<AppearanceSettings["houseWallMaterial"], TextureKey>
    )[appearance.houseWallMaterial],
    poolWall: (
      {
        white_liner: "pool-white-liner",
        blue_tile: "pool-blue-tile",
        concrete: "pool-concrete",
      } satisfies Record<AppearanceSettings["poolWallMaterial"], TextureKey>
    )[appearance.poolWallMaterial],
    roof: (
      {
        dark_metal: "roof-dark-metal",
        red_tile: "roof-red-tile",
        roofing_felt: "roof-felt",
      } satisfies Record<AppearanceSettings["roofMaterial"], TextureKey>
    )[appearance.roofMaterial],
    terrain: (
      {
        soil: "terrain-soil",
        grass: "terrain-grass",
        gravel: "terrain-gravel",
      } satisfies Record<AppearanceSettings["terrainMaterial"], TextureKey>
    )[appearance.terrainMaterial],
  }
}
