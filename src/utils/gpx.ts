import type { GpxPoint, GpxTrack, RangeStats, TrackDay } from '../types'

// Parsed by hand with DOMParser instead of the `gpxparser` package: that
// library throws under strict-mode ES modules for real exported tracks.
export function parseGpxText(xmlText: string): GpxTrack {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml')
  if (doc.getElementsByTagName('parsererror').length) {
    throw new Error('Nie udało się odczytać pliku GPX (nieprawidłowy XML)')
  }

  // Tracks are what devices record; planned routes (<rte>) are a fallback.
  let elements = Array.from(doc.getElementsByTagName('trkpt'))
  if (!elements.length) elements = Array.from(doc.getElementsByTagName('rtept'))

  const points: GpxPoint[] = []
  for (const el of elements) {
    const lat = parseFloat(el.getAttribute('lat') ?? '')
    const lon = parseFloat(el.getAttribute('lon') ?? '')
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
    const ele = parseFloat(el.getElementsByTagName('ele')[0]?.textContent ?? '')
    const timeText = el.getElementsByTagName('time')[0]?.textContent
    const time = timeText ? Date.parse(timeText) : NaN
    // Any namespace prefix: gpxtpx:hr, ns3:hr or a bare <hr>.
    const hr = parseFloat(el.getElementsByTagNameNS('*', 'hr')[0]?.textContent ?? '')
    points.push({
      lat,
      lon,
      ele: Number.isFinite(ele) ? ele : 0,
      time: Number.isFinite(time) ? time : null,
      ...(Number.isFinite(hr) && hr > 0 ? { hr } : null),
    })
  }

  if (points.length < 2) {
    throw new Error('Nie znaleziono trasy w pliku GPX')
  }

  const nameEl = doc.getElementsByTagName('trk')[0]?.getElementsByTagName('name')[0] ?? doc.getElementsByTagName('name')[0]
  const name = nameEl?.textContent?.trim() || null

  return { name, points }
}

const EARTH_RADIUS_M = 6371000

function haversineMeters(a: GpxPoint, b: GpxPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

// Cumulative distance in km from the first point, one entry per point.
// `breaks` are indices where a new day starts: the jump from the previous day doesn't count.
export function cumulativeDistanceKm(points: GpxPoint[], breaks: readonly number[] = []): Float64Array {
  const cum = new Float64Array(points.length)
  const skip = new Set(breaks)
  for (let i = 1; i < points.length; i++) {
    cum[i] = cum[i - 1] + (skip.has(i) ? 0 : haversineMeters(points[i - 1], points[i]) / 1000)
  }
  return cum
}

// Ignores elevation swings smaller than this, so GPS noise doesn't inflate the total.
export const ELEVATION_THRESHOLD_M = 4

export function elevationGain(points: GpxPoint[], startIdx: number, endIdx: number, threshold = ELEVATION_THRESHOLD_M): number {
  if (startIdx >= endIdx) return 0
  let gain = 0
  let anchor = points[startIdx].ele
  for (let i = startIdx + 1; i <= endIdx; i++) {
    const ele = points[i].ele
    if (ele - anchor >= threshold) {
      gain += ele - anchor
      anchor = ele
    } else if (anchor - ele >= threshold) {
      anchor = ele
    }
  }
  return gain
}

// Time spent inside each day only, so nights between days don't count.
function durationMs(points: GpxPoint[], startIdx: number, endIdx: number, breaks: readonly number[]): number {
  const cuts = [startIdx, ...breaks.filter((b) => b > startIdx && b <= endIdx), endIdx + 1]
  let total = 0
  for (let i = 0; i + 1 < cuts.length; i++) {
    const start = points[cuts[i]]?.time
    const end = points[cuts[i + 1] - 1]?.time
    if (start != null && end != null) total += Math.max(0, end - start)
  }
  return total
}

// A stretch between two points counts as moving when it was covered at walking pace or faster.
// Stops (a lunch break, a paused recorder) cover little ground in a long time, so they drop out,
// while sparse recordings (a point every few minutes) still count.
export const MOVING_MIN_KMH = 1.5

export function movingDurationMs(points: GpxPoint[], cumKm: Float64Array, startIdx: number, endIdx: number, breaks: readonly number[] = []): number {
  const skip = new Set(breaks)
  let total = 0
  for (let i = startIdx + 1; i <= endIdx; i++) {
    if (skip.has(i)) continue
    const a = points[i - 1].time
    const b = points[i].time
    if (a == null || b == null) continue
    const dt = b - a
    if (dt <= 0) continue
    const kmh = (cumKm[i] - cumKm[i - 1]) / (dt / 3_600_000)
    if (kmh >= MOVING_MIN_KMH) total += dt
  }
  return total
}

function maxElevation(points: GpxPoint[], startIdx: number, endIdx: number): number | null {
  let max = -Infinity
  let any = false
  for (let i = startIdx; i <= endIdx; i++) {
    const ele = points[i].ele
    if (ele !== 0) any = true
    if (ele > max) max = ele
  }
  return any ? max : null
}

export function computeRangeStats(
  points: GpxPoint[],
  cumKm: Float64Array,
  startIdx: number,
  endIdx: number,
  breaks: readonly number[] = [],
): RangeStats {
  return {
    distanceKm: (cumKm[endIdx] ?? 0) - (cumKm[startIdx] ?? 0),
    elevationGainM: elevationGain(points, startIdx, endIdx),
    durationMs: durationMs(points, startIdx, endIdx, breaks),
    movingMs: movingDurationMs(points, cumKm, startIdx, endIdx, breaks),
    maxElevationM: maxElevation(points, startIdx, endIdx),
  }
}

function localDayKey(ms: number): string {
  const d = new Date(ms)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

// Splits a multi-day recording into calendar days (local time). Returns an
// empty list when the track has no timestamps or spans a single day.
export function splitIntoDays(points: GpxPoint[]): TrackDay[] {
  const days: TrackDay[] = []
  let currentKey: string | null = null
  for (let i = 0; i < points.length; i++) {
    const time = points[i].time
    if (time == null) continue
    const key = localDayKey(time)
    if (key !== currentKey) {
      if (days.length) days[days.length - 1].endIdx = Math.max(days[days.length - 1].startIdx, i - 1)
      days.push({ startIdx: i, endIdx: points.length - 1, date: new Date(time) })
      currentKey = key
    }
  }
  return days.length > 1 ? days : []
}

export interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

// Loop instead of Math.min(...arr): spreading 100k+ points overflows the call stack.
export function flatBounds(flat: ArrayLike<number>, from = 0, to = flat.length): Bounds {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (let i = from; i + 1 < to; i += 2) {
    const x = flat[i]
    const y = flat[i + 1]
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  return { minX, maxX, minY, maxY }
}

// Projects lat/lon onto the canvas, preserving aspect ratio, north up,
// centered in the box. Returns a flat [x0, y0, x1, y1, ...] array.
export function projectPointsToCanvas(points: GpxPoint[], boxWidth: number, boxHeight: number, padding = 80): Float64Array {
  let minLat = Infinity
  let maxLat = -Infinity
  let minLon = Infinity
  let maxLon = -Infinity
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat
    if (p.lat > maxLat) maxLat = p.lat
    if (p.lon < minLon) minLon = p.lon
    if (p.lon > maxLon) maxLon = p.lon
  }

  const latRange = maxLat - minLat || 1e-6
  const lonRange = maxLon - minLon || 1e-6
  // Correct for longitude distortion at this latitude.
  const lonScaleFactor = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180))

  const scale = Math.min((boxWidth - padding * 2) / (lonRange * lonScaleFactor), (boxHeight - padding * 2) / latRange)
  const offsetX = (boxWidth - lonRange * lonScaleFactor * scale) / 2
  const offsetY = (boxHeight - latRange * scale) / 2

  const flat = new Float64Array(points.length * 2)
  points.forEach((p, i) => {
    flat[i * 2] = (p.lon - minLon) * lonScaleFactor * scale + offsetX
    flat[i * 2 + 1] = (maxLat - p.lat) * scale + offsetY
  })
  return flat
}
