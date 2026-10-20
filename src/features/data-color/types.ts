import type { DataSourceId } from '../../core/data/sources'
import type { PaletteId } from '../../core/data/palettes'

export type ColorSource = 'none' | DataSourceId

export interface DataColorSettings {
  // 'none' keeps the route colour.
  source: ColorSource
  palette: PaletteId
  inverted: boolean
  // auto: 5th to 95th percentile of the visible range, so one GPS glitch can't flatten the scale.
  rangeMode: 'auto' | 'manual'
  // Manual range, in metric units of the source (km/h, bpm, %, m).
  min: number
  max: number
  // Glow under the line in the colour of each piece, or in the route colour.
  glow: 'follow' | 'uniform'
  legend: boolean
}

export const DEFAULT_DATA_COLOR: DataColorSettings = {
  source: 'none',
  palette: 'ember',
  inverted: false,
  rangeMode: 'auto',
  min: 0,
  max: 100,
  glow: 'follow',
  legend: true,
}

export const LEGEND_KIND = 'colorLegend'
