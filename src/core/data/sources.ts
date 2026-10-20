import { formatNumber } from '../../utils/format'
import { heightIn, heightUnit, distanceIn, speedUnit, type Units } from '../units'
import { windowMean, windowSlope } from './smoothing'
import type { GpxTrack } from '../../types'

// A value along the route, one per track point: what the route can be coloured by and
// what the elevation chart draws. Consumers get a plain array and never see how it was made.
export interface DataSource {
  id: DataSourceId
  label: string
  unit: (units: Units) => string
  // Shown value for a raw (metric) one: legend ends, chart labels.
  format: (value: number, units: Units) => string
  // Why the source can't be used with this file, or null.
  unavailable: (track: GpxTrack) => string | null
  compute: (track: GpxTrack, cumKm: Float64Array) => Float32Array
}

export type DataSourceId = 'speed' | 'heartRate' | 'grade' | 'elevation'

const ELEVATION_WINDOW_KM = 0.03
const GRADE_WINDOW_KM = 0.05
const SPEED_WINDOW_MS = 15_000
const SPEED_SMOOTH_MS = 30_000
const HR_SMOOTH_MS = 10_000
const MAX_GRADE = 40

const hasElevation = (t: GpxTrack) => t.points.some((p) => p.ele !== 0)
const hasTime = (t: GpxTrack) => t.points.filter((p) => p.time != null).length >= 2

export function smoothedElevation(track: GpxTrack, cumKm: Float64Array): Float32Array {
  return windowMean(
    track.points.map((p) => p.ele),
    cumKm,
    ELEVATION_WINDOW_KM,
  )
}

// Seconds since the first timed point; NaN where a point has no time.
function timeAxis(track: GpxTrack): Float64Array {
  const t0 = track.points.find((p) => p.time != null)?.time ?? 0
  const axis = new Float64Array(track.points.length)
  let last = 0
  track.points.forEach((p, i) => {
    // Untimed points borrow the previous time, so the axis keeps growing.
    last = p.time != null ? p.time - t0 : last
    axis[i] = last
  })
  return axis
}

export const elevationSource: DataSource = {
  id: 'elevation',
  label: 'Wysokość',
  unit: heightUnit,
  format: (m, units) => `${formatNumber(heightIn(m, units))} ${heightUnit(units)}`,
  unavailable: (t) => (hasElevation(t) ? null : 'brak wysokości w pliku'),
  compute: smoothedElevation,
}

// Percent, from elevation smoothed first and measured over ±50 m of road.
export const gradeSource: DataSource = {
  id: 'grade',
  label: 'Nachylenie',
  unit: () => '%',
  format: (g) => `${g > 0 ? '+' : ''}${formatNumber(g, Math.abs(g) < 10 ? 1 : 0)}%`,
  unavailable: (t) => (hasElevation(t) ? null : 'brak wysokości w pliku'),
  compute: (track, cumKm) => {
    const slope = windowSlope(smoothedElevation(track, cumKm), cumKm, GRADE_WINDOW_KM)
    // metres per km → percent
    return slope.map((v) => (Number.isFinite(v) ? Math.max(-MAX_GRADE, Math.min(MAX_GRADE, v / 10)) : 0))
  },
}

// km/h over ±15 s, then averaged over 30 s.
export const speedSource: DataSource = {
  id: 'speed',
  label: 'Prędkość',
  unit: speedUnit,
  format: (kmh, units) => `${formatNumber(distanceIn(kmh, units), 0)} ${speedUnit(units)}`,
  unavailable: (t) => (hasTime(t) ? null : 'brak czasu w pliku'),
  compute: (track, cumKm) => {
    const time = timeAxis(track)
    const kmPerMs = windowSlope(cumKm, time, SPEED_WINDOW_MS)
    const kmh = kmPerMs.map((v) => (Number.isFinite(v) ? v * 3_600_000 : NaN))
    return windowMean(kmh, time, SPEED_SMOOTH_MS)
  },
}

export const heartRateSource: DataSource = {
  id: 'heartRate',
  label: 'Tętno',
  unit: () => 'bpm',
  format: (bpm) => `${formatNumber(bpm)} bpm`,
  unavailable: (t) => (t.points.some((p) => p.hr != null) ? null : 'brak tętna w pliku'),
  compute: (track) => windowMean(
    track.points.map((p) => p.hr ?? NaN),
    timeAxis(track),
    HR_SMOOTH_MS,
  ),
}

export const DATA_SOURCES: readonly DataSource[] = [speedSource, heartRateSource, gradeSource, elevationSource]

export function dataSource(id: DataSourceId): DataSource {
  return DATA_SOURCES.find((s) => s.id === id) ?? elevationSource
}

// One computed series per track, source and distance array, shared by the route and the chart.
const cache = new WeakMap<GpxTrack, Map<string, { cum: Float64Array; values: Float32Array }>>()

export function dataSeries(track: GpxTrack, cumKm: Float64Array, id: DataSourceId): Float32Array {
  let byTrack = cache.get(track)
  if (!byTrack) cache.set(track, (byTrack = new Map()))
  const hit = byTrack.get(id)
  if (hit && hit.cum === cumKm) return hit.values
  const values = dataSource(id).compute(track, cumKm)
  byTrack.set(id, { cum: cumKm, values })
  return values
}
