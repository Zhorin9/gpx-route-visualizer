export interface MapPalette {
  land: string
  water: string
  green: string
  road: string
  label: string
}

export interface SketchSettings {
  // none: no sea or lakes at all, not even their shores.
  water: 'hatch' | 'wash' | 'none'
  // How much the pen trembles, 0.5–2.
  roughness: number
  // Off: a see-through frame with only the lines and names (cutaways over footage).
  paper: boolean
  // Off: no roads or rivers; lakes, the sea and the places stay.
  lines: boolean
}

export interface MapSettings {
  kind: 'tiles' | 'sketch'
  sketch: SketchSettings
  styleId: string
  // null keeps the style's own colours.
  palette: MapPalette | null
  // -1 lightens to white, 1 darkens to black.
  dim: number
  // 1 = as drawn, 0 = grey.
  saturation: number
  // In frame pixels.
  blur: number
  // Over the ground colour; the route and texts stay at full strength.
  opacity: number
  ground: string
  // 0–1, towards the ground colour at each slide's edges.
  vignette: number
  sepia: number
  // 0–1.
  grain: number
  labels: boolean
  hillshade: boolean
  // creditColor null: the stats colour.
  creditSize: number
  creditColor: string | null
}

export const DEFAULT_MAP: MapSettings = {
  kind: 'tiles',
  sketch: { water: 'hatch', roughness: 1, paper: true, lines: true },
  styleId: 'liberty',
  palette: null,
  dim: 0,
  saturation: 1,
  blur: 0,
  opacity: 1,
  ground: '#1f1a14',
  vignette: 0,
  sepia: 0,
  grain: 0,
  labels: true,
  hillshade: false,
  creditSize: 12,
  creditColor: null,
}

export const mapIsSeeThrough = (map: MapSettings) => map.kind === 'sketch' && !map.sketch.paper

export const MAP_CREDIT_KIND = 'mapCredit'
