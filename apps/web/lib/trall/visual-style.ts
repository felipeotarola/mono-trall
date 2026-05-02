export const trallPlanColors = {
  canvas: "#fffdf7",
  controlPanel: "#faf7ef",
  dimension: "#344054",
  ground: "#6f6658",
  grid: "#e6e0d4",
  gridStrong: "#d8d0c2",
  ink: "#1f2933",
  muted: "#687385",
  page: "#f1eee6",
  positive: "#15803d",
  warning: "#b45309",
  soil: "#e8dfcf",
  soilHatch: "#cfc2ad",
  wall: "#f2f0ea",
  wallStroke: "#6f6658",
  foundation: "#d2d6dc",
  foundationStroke: "#a9b0bb",
  deck: "#c7a36f",
  deckDark: "#7b5b31",
  deckEdge: "#8a6a3d",
  timberLine: "#9c7a48",
  poolShell: "#d8e5ed",
  poolWater: "#9fd3e5",
  poolEdge: "#2f6f86",
} as const

export const trallPlanClasses = {
  page:
    "bg-[#f1eee6] text-zinc-900 dark:bg-[#f1eee6] dark:text-zinc-900",
  gridFine:
    "bg-[linear-gradient(to_right,rgba(120,113,101,0.13)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,113,101,0.13)_1px,transparent_1px)] bg-[size:44px_44px]",
  gridStrong:
    "bg-[linear-gradient(to_right,rgba(120,113,101,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,113,101,0.18)_1px,transparent_1px)] bg-[size:176px_176px]",
  floatingLabel:
    "rounded-md border border-stone-200 bg-white/88 px-3 py-1.5 text-xs text-stone-600 shadow-sm backdrop-blur",
  bottomLegend:
    "border-t border-stone-200 bg-white/82 px-4 py-3 text-xs text-stone-600 backdrop-blur",
  deckPolygon: "fill-[#c7a36f]/45 stroke-[#8a6a3d]",
  deckBoardLine: "stroke-[#7b5b31]/22",
  deckSelectedEdge: "stroke-[#b45309]",
  deckSelectedEdgeInner: "stroke-[#7b5b31]",
  deckAttachedEdge: "stroke-[#6f6658]",
  deckSupport: "stroke-[#15803d]/65",
  houseBody: "fill-[#f2f0ea] stroke-[#6f6658]",
  houseRoof: "fill-none stroke-[#6f6658]",
  houseDoor: "fill-white stroke-[#6f6658]",
  houseWindow:
    "fill-[#d9edf4] stroke-[#2f6f86] transition group-hover/window:stroke-[#1b5264]",
  houseWindowLine: "stroke-[#2f6f86]/60",
  houseLabel: "fill-[#1f2933]",
  poolPolygon: "fill-[#9fd3e5]/72 stroke-[#2f6f86]",
  poolHighlight: "stroke-white/70",
  poolLabel: "fill-[#1f2933]",
} as const
