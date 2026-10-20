export type ProfileChartStyle = 'area' | 'line' | 'bars'

// Where the chart sits until it is dragged by hand.
export type ProfilePlacement = 'bottom' | 'top'

export interface ProfileSettings {
  enabled: boolean
  style: ProfileChartStyle
  placement: ProfilePlacement
  // Share of the frame width, 30-100.
  widthPct: number
  height: number
  // null = the route colour.
  color: string | null
  highlightClimbs: boolean
  climbLabels: boolean
  showTotal: boolean
  showMinMax: boolean
  showDistance: boolean
  // A point on the route and a line on the chart at the same place.
  marker: boolean
  // Share of the visible distance, 0-1.
  markerAt: number
}

export const DEFAULT_PROFILE: ProfileSettings = {
  enabled: false,
  style: 'area',
  placement: 'bottom',
  widthPct: 90,
  height: 220,
  color: null,
  highlightClimbs: true,
  climbLabels: true,
  showTotal: true,
  showMinMax: false,
  showDistance: true,
  marker: false,
  markerAt: 0.5,
}

export const PROFILE_KIND = 'elevationProfile'
