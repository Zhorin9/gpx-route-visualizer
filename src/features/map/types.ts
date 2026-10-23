// Colours a vector map is repainted in, so it matches the style template.
export interface MapPalette {
  land: string
  water: string
  green: string
  road: string
  label: string
}

export interface MapSettings {
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
  styleId: 'positron',
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
