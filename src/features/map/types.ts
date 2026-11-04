// Colours a vector map is repainted in, so it matches the style template.
export interface MapPalette {
  land: string
  water: string
  green: string
  road: string
  label: string
}

// The hand-drawn map: water hatched or washed in, and how much the pen trembles (0.5–2).
export interface SketchSettings {
  water: 'hatch' | 'wash'
  roughness: number
  // Off: only the lines and names, on a see-through frame (for cutaways over footage).
  paper: boolean
  // Off: no roads or rivers; lakes, the sea and the places stay.
  lines: boolean
}

export interface MapSettings {
  // Tiles from a map service, or a sketch we draw ourselves from a few OSM features.
  kind: 'tiles' | 'sketch'
  sketch: SketchSettings
  styleId: string
  // Repaints the style; null keeps the style's own colours.
  palette: MapPalette | null
  // -1 lightens to white, 1 darkens to black.
  dim: number
  // 1 = as drawn, 0 = grey.
  saturation: number
  // Softens the map behind the route, in frame pixels.
  blur: number
  // How much of the map shows over the ground colour; the route and texts stay at full strength.
  opacity: number
  ground: string
  // Edges of each slide darkened towards the ground colour, 0-1.
  vignette: number
  sepia: number
  // Film grain over the map, 0-1.
  grain: number
  labels: boolean
  hillshade: boolean
  // The source credit on the frame: its text size and colour (null = the stats colour).
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

// A sketch without its paper lets whatever is under the frame show through.
export const mapIsSeeThrough = (map: MapSettings) => map.kind === 'sketch' && !map.sketch.paper

export const MAP_CREDIT_KIND = 'mapCredit'
