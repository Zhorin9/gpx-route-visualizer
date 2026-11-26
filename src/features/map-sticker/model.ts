import type { MapPalette } from '../map/types'

export const MAP_STICKER_KIND = 'mapSticker'

export type MapStickerLook = 'journal' | 'notes' | 'sticker' | 'sketch'
export type MapStickerEdge = 'none' | 'white' | 'ink'
export type MapStickerShadow = 'none' | 'soft' | 'hard'
export type MapStickerShape = 'auto' | 'country' | 'hull'
export type MapStickerScope = { kind: 'all' } | { kind: 'day'; day: number; only: boolean }

export interface MapStickerSettings {
  // Width as a share of the frame's; edge, route and dot grow with it.
  size: number
  margin: number
  rotation: number
  zoom: number
  pan: { x: number; y: number }
  shape: MapStickerShape
  look: MapStickerLook
  edge: MapStickerEdge
  shadow: MapStickerShadow
  routeOutside: boolean
  scope: MapStickerScope
  labels: boolean
  labelColor: string
  styleId: string
  palette: MapPalette
  route: string
  start: string
}

export interface MapSticker extends MapStickerSettings {
  id: number
}

export type MapStickerLookFields = Omit<MapStickerSettings, 'size' | 'margin' | 'rotation' | 'zoom' | 'pan' | 'scope'>

export const stickerKind = (id: number) => `${MAP_STICKER_KIND}:${id}`
export const stickerIdOf = (kind: string): number | null => (kind.startsWith(`${MAP_STICKER_KIND}:`) ? Number(kind.slice(MAP_STICKER_KIND.length + 1)) : null)

export const STICKER_INK = '#241a26'
const COUNTRY_FROM_KM = 150

export const resolvedShape = (shape: MapStickerShape, distanceKm: number): Exclude<MapStickerShape, 'auto'> =>
  shape === 'auto' ? (distanceKm >= COUNTRY_FROM_KM ? 'country' : 'hull') : shape
const STICKER_PINK = '#f2b8f5'

type LookPreset = Pick<MapStickerSettings, 'palette' | 'route' | 'start' | 'edge' | 'shadow' | 'labelColor'>

interface LookDrawing {
  contourShare: number
  routeHalo: string | null
  routeWidthFactor: number
  labelHalo: string | null
}

const LABEL = '#3a4a30'

function lookPreset(look: MapStickerLook, stickerColor: string | null): LookPreset {
  switch (look) {
    case 'journal':
      return { palette: { land: '#c9d7a0', green: '#a9bf82', water: '#9fc3cf', road: '#e0b478', label: LABEL }, route: '#ea5a1c', start: '#ea5a1c', labelColor: '#ea5a1c', edge: 'none', shadow: 'soft' }
    case 'notes':
      return { palette: { land: '#a9cf8e', green: '#93c27a', water: '#8fc6e8', road: '#ffffff', label: LABEL }, route: '#e9572b', start: '#3fae4f', labelColor: '#ffffff', edge: 'white', shadow: 'soft' }
    case 'sticker': {
      const land = stickerColor ?? STICKER_PINK
      return { palette: { land, green: land, water: '#d9c6f7', road: land, label: STICKER_INK }, route: STICKER_INK, start: STICKER_INK, labelColor: land, edge: 'none', shadow: 'hard' }
    }
    case 'sketch':
      return { palette: { land: '#efe6d2', green: '#e3d6bb', water: '#c9d3d0', road: '#c2b7a4', label: '#3a2a1c' }, route: '#3a2a1c', start: '#3a2a1c', labelColor: '#3a2a1c', edge: 'none', shadow: 'none' }
  }
}

export function withLook(look: MapStickerLook, stickerColor: string | null): Pick<MapStickerSettings, 'look'> & LookPreset {
  return { look, ...lookPreset(look, stickerColor) }
}

export const LOOK_DRAWING: Record<MapStickerLook, LookDrawing> = {
  journal: { contourShare: 0, routeHalo: null, routeWidthFactor: 1, labelHalo: null },
  notes: { contourShare: 0, routeHalo: null, routeWidthFactor: 1, labelHalo: 'rgba(0,0,0,0.35)' },
  sticker: { contourShare: 0.0075, routeHalo: '#ffffff', routeWidthFactor: 4 / 3, labelHalo: STICKER_INK },
  sketch: { contourShare: 0.003, routeHalo: null, routeWidthFactor: 1, labelHalo: null },
}

// The style board's notebook sticker: soft green land, an orange route, a green start dot.
export const DEFAULT_MAP_STICKER: MapStickerSettings = {
  size: 0.46,
  margin: 0.07,
  rotation: 0,
  zoom: 1,
  pan: { x: 0, y: 0 },
  shape: 'auto',
  styleId: 'positron',
  routeOutside: true,
  scope: { kind: 'all' },
  labels: true,
  ...withLook('notes', null),
}
