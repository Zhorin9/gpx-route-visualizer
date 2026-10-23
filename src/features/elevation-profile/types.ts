import { PALETTES, paletteStops, type GradientStop } from '../../core/data/palettes'
import type { DataSourceId } from '../../core/data/sources'

export type ProfileChartStyle = 'line' | 'area' | 'bars' | 'steps'

// Size and place of the chart until it is dragged by hand.
export type ProfileLayout = 'low' | 'tall' | 'overlay'

// route: the colours of the route (one, or by data); palette: its own colour scale; single: one colour.
export type ProfileColorMode = 'route' | 'palette' | 'single'

export interface ProfileSettings {
  enabled: boolean
  style: ProfileChartStyle
  layout: ProfileLayout
  // Share of the frame width, 30-100; an overlay always spans the frame.
  widthPct: number
  colorMode: ProfileColorMode
  colorBy: DataSourceId
  // The palette's colours, low to high; the stops can be moved and added.
  stops: GradientStop[]
  color: string
  // 0-1, at the top of the fill.
  fillOpacity: number
  peak: boolean
  startFinish: boolean
  kmTicks: boolean
  // Stretches steeper than steepGrade (percent) marked on the chart.
  steep: boolean
  steepGrade: number
  highlightClimbs: boolean
  climbLabels: boolean
  showTotal: boolean
  showMinMax: boolean
  showDistance: boolean
  // A point on the route and a line on the chart at the same place.
  marker: boolean
  // Share of the visible distance, 0-1.
  markerAt: number
  // auto: fits the heights of the range; zero: starts at sea level.
  scale: 'auto' | 'zero'
  // Vertical stretch, 0.5-3.
  exaggeration: number
  // 0-10, averaged over a wider stretch of road the higher it is.
  smoothing: number
  grid: boolean
}

export const DEFAULT_PROFILE: ProfileSettings = {
  enabled: false,
  style: 'area',
  layout: 'tall',
  widthPct: 90,
  colorMode: 'route',
  colorBy: 'elevation',
  stops: paletteStops(PALETTES[1]),
  color: '#ffffff',
  fillOpacity: 0.55,
  peak: true,
  startFinish: true,
  kmTicks: false,
  steep: false,
  steepGrade: 8,
  highlightClimbs: false,
  climbLabels: false,
  showTotal: true,
  showMinMax: false,
  showDistance: true,
  marker: false,
  markerAt: 0.5,
  scale: 'auto',
  exaggeration: 1,
  smoothing: 3,
  grid: false,
}

const HEIGHTS: Record<ProfileLayout, number> = { low: 140, tall: 240, overlay: 260 }

export const profileHeight = (settings: ProfileSettings) => HEIGHTS[settings.layout]

export const PROFILE_KIND = 'elevationProfile'
