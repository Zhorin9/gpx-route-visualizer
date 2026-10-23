import { mixHex, toneOf, type Tone } from '../../../utils/color'
import type { GradientStyle } from '../../../types'
import type { MapPalette, MapSettings } from '../types'

// A map style the background can use. A new source is a new entry and a registration.
export interface MapStyleDef {
  id: string
  label: string
  // Style JSON in the OpenMapTiles layout, so a template's palette can repaint it; or for an image map
  // (satellite) the style itself, which no palette repaints.
  url: string | StyleJson
  // Whether the style is light or dark, for the contrast of text and route on it.
  tone: Tone
  // Credit that must stay on the exported image.
  credit: string
  // Terms of use, reviewed if the app ever stops being free.
  terms: string
}

const OFM_CREDIT = '© OpenFreeMap © OpenMapTiles, dane © OpenStreetMap'
const OFM_TERMS = 'OpenFreeMap: bez klucza i bez limitu, także komercyjnie; wymaga oznaczenia źródła.'

const styles: MapStyleDef[] = []

export function registerMapStyle(def: MapStyleDef): void {
  const i = styles.findIndex((s) => s.id === def.id)
  if (i >= 0) styles.splice(i, 1, def)
  else styles.push(def)
}

export function mapStyles(): readonly MapStyleDef[] {
  return styles
}

export function mapStyle(id: string): MapStyleDef {
  return styles.find((s) => s.id === id) ?? styles[0]
}

// Esri World Imagery: free with its credit for a non-commercial app; review if that changes.
const SATELLITE: StyleJson = {
  version: 8,
  sources: {
    esri: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [{ id: 'satellite', type: 'raster', source: 'esri' }],
}

export const BUILT_IN_STYLES: MapStyleDef[] = [
  { id: 'positron', label: 'Jasna', url: 'https://tiles.openfreemap.org/styles/positron', tone: 'light', credit: OFM_CREDIT, terms: OFM_TERMS },
  { id: 'liberty', label: 'Kolorowa', url: 'https://tiles.openfreemap.org/styles/liberty', tone: 'light', credit: OFM_CREDIT, terms: OFM_TERMS },
  { id: 'bright', label: 'Wyrazista', url: 'https://tiles.openfreemap.org/styles/bright', tone: 'light', credit: OFM_CREDIT, terms: OFM_TERMS },
  { id: 'dark', label: 'Ciemna', url: 'https://tiles.openfreemap.org/styles/dark', tone: 'dark', credit: OFM_CREDIT, terms: OFM_TERMS },
  { id: 'fiord', label: 'Fiord', url: 'https://tiles.openfreemap.org/styles/fiord', tone: 'dark', credit: OFM_CREDIT, terms: OFM_TERMS },
  {
    id: 'satellite',
    label: 'Satelita',
    url: SATELLITE,
    tone: 'dark',
    credit: 'Zdjęcia © Esri, Maxar, Earthstar Geographics',
    terms: 'Esri World Imagery: bez klucza z oznaczeniem źródła, do użytku niekomercyjnego; przy zmianie licencji aplikacji wymaga przeglądu.',
  },
]

// Terrain shading from elevation tiles in the Terrarium encoding (AWS open data, no key).
const TERRARIUM = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
export const HILLSHADE_CREDIT = 'teren: Mapzen Terrarium'

// A palette from the template's own colours: the background becomes the land, the text the labels,
// water and greenery are the land tinted towards blue and green.
export function paletteFrom(gradient: Pick<GradientStyle, 'from' | 'to'>, textColor: string): MapPalette {
  const land = mixHex(gradient.from, gradient.to)
  const dark = toneOf(land) === 'dark'
  return {
    land,
    water: mixHex(land, dark ? '#4f7ca8' : '#7fa6c4', dark ? 0.35 : 0.4),
    green: mixHex(land, dark ? '#5d7f52' : '#8fae7a', 0.25),
    road: mixHex(land, textColor, 0.22),
    label: textColor,
  }
}

// Style JSON as MapLibre takes it; kept loose, it is only read and repainted here.
export interface StyleJson {
  version: 8
  sources: Record<string, unknown>
  layers: LayerJson[]
  [key: string]: unknown
}

interface LayerJson {
  id: string
  type: string
  'source-layer'?: string
  paint?: Record<string, unknown>
  layout?: Record<string, unknown>
  [key: string]: unknown
}

const fetched = new Map<string, Promise<StyleJson>>()

function fetchStyle(url: string): Promise<StyleJson> {
  let style = fetched.get(url)
  if (!style) {
    style = fetch(url).then((r) => {
      if (!r.ok) throw new Error('Nie udało się wczytać stylu mapy.')
      return r.json() as Promise<StyleJson>
    })
    style.catch(() => fetched.delete(url))
    fetched.set(url, style)
  }
  return style
}

// Which palette colour each kind of feature takes, by OpenMapTiles layer.
function repaint(layer: LayerJson, p: MapPalette): LayerJson | null {
  const from = layer['source-layer'] ?? ''
  const paint = { ...layer.paint }
  if (layer.type === 'background') paint['background-color'] = p.land
  else if (layer.type === 'raster' || layer.type === 'fill-extrusion' || from === 'poi') return null
  else if (layer.type === 'symbol') {
    if (!('text-field' in (layer.layout ?? {}))) return null
    paint['text-color'] = p.label
    paint['text-halo-color'] = p.land
  } else {
    const color =
      from === 'water' || from === 'waterway'
        ? p.water
        : from === 'landcover' || from === 'park'
          ? p.green
          : from === 'landuse'
            ? mixHex(p.land, p.green, 0.4)
            : from === 'building'
              ? mixHex(p.land, p.road, 0.5)
              : from === 'transportation' || from === 'aeroway'
                ? p.road
                : from === 'boundary'
                  ? mixHex(p.land, p.label, 0.35)
                  : null
    if (!color) return layer
    for (const key of Object.keys(paint)) if (key.endsWith('-color')) paint[key] = color
    paint[`${layer.type}-color`] = color
  }
  return { ...layer, paint }
}

// The style to draw: repainted in the palette, labels and terrain shading as set.
export async function buildStyle(settings: Pick<MapSettings, 'styleId' | 'palette' | 'labels' | 'hillshade'>): Promise<StyleJson> {
  const { url } = mapStyle(settings.styleId)
  const base = typeof url === 'string' ? await fetchStyle(url) : url
  // A photo of the ground has no layers to repaint.
  const palette = typeof url === 'string' ? settings.palette : null
  let layers = palette ? base.layers.flatMap((l) => repaint(l, palette) ?? []) : base.layers
  if (!settings.labels) layers = layers.filter((l) => l.type !== 'symbol')
  const sources: Record<string, unknown> = { ...base.sources }
  if (settings.hillshade) {
    sources.terrain = { type: 'raster-dem', tiles: [TERRARIUM], encoding: 'terrarium', tileSize: 256, maxzoom: 14 }
    // Over the land and greenery, under water, roads and names.
    const at = layers.findIndex((l) => l['source-layer'] === 'water')
    const shade: LayerJson = {
      id: 'terrain-shade',
      type: 'hillshade',
      source: 'terrain',
      paint: {
        'hillshade-exaggeration': 0.45,
        'hillshade-shadow-color': palette ? mixHex(palette.land, '#000000', 0.45) : '#4a4a4a',
        'hillshade-highlight-color': palette ? mixHex(palette.land, '#ffffff', 0.4) : '#ffffff',
        'hillshade-accent-color': palette ? mixHex(palette.land, palette.label, 0.3) : '#5a5a5a',
      },
    }
    layers = at < 0 ? [...layers, shade] : [...layers.slice(0, at), shade, ...layers.slice(at)]
  }
  return { ...base, sources, layers }
}

// The credit the frame must show for these settings.
export function creditFor(settings: Pick<MapSettings, 'styleId' | 'hillshade'>): string {
  const credit = mapStyle(settings.styleId).credit
  return settings.hillshade ? `${credit}, ${HILLSHADE_CREDIT}` : credit
}

// CSS filter for the settings' dimming, saturation and blur; `pixel` turns frame pixels into the target's.
export function mapFilter(settings: Pick<MapSettings, 'dim' | 'saturation' | 'blur'>, pixel = 1): string {
  const parts: string[] = []
  if (settings.saturation !== 1) parts.push(`saturate(${settings.saturation})`)
  if (settings.blur > 0) parts.push(`blur(${settings.blur * pixel}px)`)
  return parts.join(' ') || 'none'
}
