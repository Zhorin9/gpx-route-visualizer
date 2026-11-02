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
  labels: boolean
  hillshade: boolean
  // The source credit on the frame: its text size and colour (null = the stats colour).
  creditSize: number
  creditColor: string | null
}

export const DEFAULT_MAP: MapSettings = {
  kind: 'tiles',
  sketch: { water: 'hatch', roughness: 1 },
  styleId: 'liberty',
  palette: null,
  dim: 0,
  saturation: 1,
  blur: 0,
  labels: true,
  hillshade: false,
  creditSize: 12,
  creditColor: null,
}

export const MAP_CREDIT_KIND = 'mapCredit'
