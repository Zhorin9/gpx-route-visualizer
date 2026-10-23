import { binScale, mixStops, type GradientStop } from '../../core/data/palettes'
import { dataSeries, dataSource, type DataSourceId } from '../../core/data/sources'
import { percentile } from '../../core/data/smoothing'
import { useRouteHead } from '../../core/route/providers'
import { useTrackCumKm } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { posAtDistance } from '../../utils/geometry'
import { elevationGain } from '../../utils/gpx'
import { memoOne } from '../../utils/memo'
import { useActiveDataColor, type ActiveDataColor } from '../data-color/useDataColoring'
import { detectClimbs, type Climb } from './model/climbs'
import { sampleAt, sampleByDistance, smoothSamples, type ProfileSamples } from './model/profile'
import { selectTrack, selectRouteDays } from '../../store/derived'
import type { GpxTrack, RoutePart, RouteRange } from '../../types'
import type { ProfileColorMode } from './types'

export interface ProfileData {
  track: GpxTrack
  // Smoothed as set in the panel.
  samples: ProfileSamples
  climbs: Climb[]
  gainM: number
  range: RouteRange
  cumKm: Float64Array
}

// Smoothing 10 averages over a fifteenth of the chart on each side.
const SMOOTHING_SHARE = 150

const profileData = memoOne(
  (track: GpxTrack, cumKm: Float64Array, range: RouteRange, days: RoutePart[], columns: number, smoothing: number): ProfileData => {
    const ele = dataSeries(track, cumKm, 'elevation')
    const hiddenDays = days.filter((d) => !d.visible)
    const hidden = hiddenDays.length ? (i: number) => hiddenDays.some((d) => i >= d.startIdx && i <= d.endIdx) : undefined
    const samples = sampleByDistance(ele, cumKm, range.start, range.end, columns, hidden)
    return {
      track,
      samples: smoothSamples(samples, Math.round((smoothing * columns) / SMOOTHING_SHARE)),
      climbs: detectClimbs(ele, cumKm, range.start, range.end),
      // The same figure as the stats header, so the two never disagree.
      gainM: elevationGain(track.points, range.start, range.end),
      range,
      cumKm,
    }
  },
)

export function useProfileData(columns: number): ProfileData | null {
  const track = useAppStore(selectTrack)
  const range = useAppStore((s) => s.range)
  const days = useAppStore(selectRouteDays)
  const smoothing = useAppStore((s) => s.profile.smoothing)
  const cumKm = useTrackCumKm()
  if (!track || !cumKm || range.end <= range.start) return null
  return profileData(track, cumKm, range, days, columns, smoothing)
}

// Each sample's value of a source; elevation is the chart itself.
export function sampledSource(data: ProfileData, id: DataSourceId): Float32Array {
  if (id === 'elevation') return data.samples.values
  return sampleAt(dataSeries(data.track, data.cumKm, id), data.samples)
}

// What the profile's own palette is coloured by: the chosen source, or the heights when the file lacks it.
export const paletteSource = (track: GpxTrack, id: DataSourceId): DataSourceId => (dataSource(id).unavailable(track) ? 'elevation' : id)

// Heights span lowest to highest; the other sources 5th to 95th percentile, as on the route.
export function sourceDomain(values: Float32Array, id: DataSourceId): [number, number] {
  const lo = id === 'elevation' ? Math.min(...values.filter(Number.isFinite)) : percentile(values, 5)
  const hi = id === 'elevation' ? Math.max(...values.filter(Number.isFinite)) : percentile(values, 95)
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 1]
  return hi > lo ? [lo, hi] : [lo - 1, lo + 1]
}

const profileColors = memoOne(
  (data: ProfileData, mode: ProfileColorMode, colorBy: DataSourceId, stops: GradientStop[], color: string, routeColor: string, active: ActiveDataColor | null): string | string[] => {
    if (mode === 'single') return color
    if (mode === 'route') {
      if (!active) return routeColor
      const scale = binScale(active.bins, active.domain)
      return Array.from(sampledSource(data, active.sourceId), scale)
    }
    const source = paletteSource(data.track, colorBy)
    const values = sampledSource(data, source)
    const [lo, hi] = sourceDomain(values, source)
    return Array.from(values, (v) => mixStops(stops, Number.isFinite(v) ? (v - lo) / (hi - lo) : 0))
  },
)

// One colour for the whole chart, or one per sample.
export function useProfileColors(data: ProfileData | null): string | string[] {
  const mode = useAppStore((s) => s.profile.colorMode)
  const colorBy = useAppStore((s) => s.profile.colorBy)
  const stops = useAppStore((s) => s.profile.stops)
  const color = useAppStore((s) => s.profile.color)
  const routeColor = useAppStore((s) => s.routeStyle.color)
  const active = useActiveDataColor()
  if (!data) return routeColor
  return profileColors(data, mode, colorBy, stops, color, routeColor, active)
}

// Track position of the marker: the animation head while it plays, otherwise the panel slider.
export function useProfileMarkerPos(): number | null {
  const marker = useAppStore((s) => s.profile.marker)
  const markerAt = useAppStore((s) => s.profile.markerAt)
  const range = useAppStore((s) => s.range)
  const cumKm = useTrackCumKm()
  const head = useRouteHead()
  if (!cumKm || range.end <= range.start) return null
  if (head != null) return head
  if (!marker) return null
  const km = cumKm[range.start] + (cumKm[range.end] - cumKm[range.start]) * markerAt
  return posAtDistance(cumKm, range.start, range.end, km)
}
