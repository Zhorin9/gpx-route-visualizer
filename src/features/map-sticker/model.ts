import type { MapPalette } from '../map/types'

export const MAP_STICKER_KIND = 'mapSticker'

export interface MapStickerSettings {
  shown: boolean
  styleId: string
  palette: MapPalette
  route: string
  start: string
}

// The style board's notebook sticker: soft green land, an orange route, a green start dot.
export const DEFAULT_MAP_STICKER: MapStickerSettings = {
  shown: false,
  styleId: 'positron',
  palette: { land: '#a9cf8e', water: '#8fc6e8', green: '#93c27a', road: '#ffffff', label: '#3a4a30' },
  route: '#e9572b',
  start: '#3fae4f',
}
