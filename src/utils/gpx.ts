import type { GpxPoint, GpxTrack, RangeStats, TrackDay } from '../types'

// Parsed by hand with DOMParser instead of the `gpxparser` package: that
// library throws under strict-mode ES modules for real exported tracks.
export function parseGpxText(xmlText: string): GpxTrack {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml')
  if (doc.getElementsByTagName('parsererror').length) {
    throw new Error('nie jest poprawnym plikiem XML')
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
    throw new Error('nie zawiera punktów trasy')
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

// Inclusive index spans whose heights aren't the ground's (a flight): they count no climbing.
export type Span = readonly [number, number]

// The stretches of [startIdx, endIdx] outside the given spans.
function groundPieces(startIdx: number, endIdx: number, flat: readonly Span[]): Span[] {
  const pieces: Span[] = []
  let from = startIdx
  for (const [a, b] of [...flat].sort((x, y) => x[0] - y[0])) {
    if (b < from || a > endIdx) continue
    if (a > from) pieces.push([from, a - 1])
    from = Math.max(from, b + 1)
  }
  if (from <= endIdx) pieces.push([from, endIdx])
  return pieces
}

// Climbing on the ground only: each stretch between flights counts on its own.
export function groundGain(points: GpxPoint[], startIdx: number, endIdx: number, flat: readonly Span[] = []): number {
  return groundPieces(startIdx, endIdx, flat).reduce((sum, [a, b]) => sum + elevationGain(points, a, b), 0)
}

function maxElevation(points: GpxPoint[], startIdx: number, endIdx: number, flat: readonly Span[]): number | null {
  let max = -Infinity
  let any = false
  for (const [a, b] of groundPieces(startIdx, endIdx, flat)) {
    for (let i = a; i <= b; i++) {
      const ele = points[i].ele
      if (ele !== 0) any = true
      if (ele > max) max = ele
    }
  }
  return any ? max : null
}

export function computeRangeStats(
  points: GpxPoint[],
  cumKm: Float64Array,
  startIdx: number,
  endIdx: number,
  breaks: readonly number[] = [],
  flat: readonly Span[] = [],
): RangeStats {
  return {
    distanceKm: (cumKm[endIdx] ?? 0) - (cumKm[startIdx] ?? 0),
    elevationGainM: groundGain(points, startIdx, endIdx, flat),
    durationMs: durationMs(points, startIdx, endIdx, breaks),
    movingMs: movingDurationMs(points, cumKm, startIdx, endIdx, breaks),
    maxElevationM: maxElevation(points, startIdx, endIdx, flat),
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

// Web Mercator, as map tiles use it: the world spans [0, 1] both ways, x eastward, y southward.
export const mercatorX = (lon: number) => (lon + 180) / 360

export function mercatorY(lat: number): number {
  const sin = Math.sin((Math.max(-85.05, Math.min(85.05, lat)) * Math.PI) / 180)
  return 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)
}

// Where the projection put the route: a frame pixel is (mercator − origin) × scale.
// The map background and the camera take their view from it.
export interface MercatorFit {
  scale: number
  x0: number
  y0: number
}

// The track fitted inside the box with `padding` on every side, centred, north up.
export function fitMercator(points: GpxPoint[], boxWidth: number, boxHeight: number, padding = 80): MercatorFit {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const p of points) {
    const x = mercatorX(p.lon)
    const y = mercatorY(p.lat)
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  const w = maxX - minX || 1e-9
  const h = maxY - minY || 1e-9
  const scale = Math.min((boxWidth - padding * 2) / w, (boxHeight - padding * 2) / h)
  return { scale, x0: minX - (boxWidth - w * scale) / 2 / scale, y0: minY - (boxHeight - h * scale) / 2 / scale }
}

// Projects lat/lon onto the canvas with the fit. Returns a flat [x0, y0, x1, y1, ...] array.
export function projectWithFit(points: GpxPoint[], fit: MercatorFit): Float64Array {
  const flat = new Float64Array(points.length * 2)
  points.forEach((p, i) => {
    flat[i * 2] = (mercatorX(p.lon) - fit.x0) * fit.scale
    flat[i * 2 + 1] = (mercatorY(p.lat) - fit.y0) * fit.scale
  })
  return flat
}

export function projectPointsToCanvas(points: GpxPoint[], boxWidth: number, boxHeight: number, padding = 80): Float64Array {
  return projectWithFit(points, fitMercator(points, boxWidth, boxHeight, padding))
}

const escapeXml = (text: string) => text.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c] as string)

// A GPX file of the points, readable by parseGpxText and by other apps.
export function toGpxText(name: string, points: GpxPoint[]): string {
  const trkpts = points
    .map((p) => {
      const lon = ((((p.lon + 180) % 360) + 360) % 360) - 180
      const time = p.time != null ? `<time>${new Date(p.time).toISOString()}</time>` : ''
      return `<trkpt lat="${p.lat.toFixed(6)}" lon="${lon.toFixed(6)}"><ele>${p.ele.toFixed(1)}</ele>${time}</trkpt>`
    })
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GPX Route Visualizer" xmlns="http://www.topografix.com/GPX/1/1">
<trk><name>${escapeXml(name)}</name><trkseg>
${trkpts}
</trkseg></trk>
</gpx>
`
}
