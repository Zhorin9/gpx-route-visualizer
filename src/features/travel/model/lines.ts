import type { GpxPoint } from '../../../types'
import { EARTH_RADIUS_KM, kmBetween, type LatLon } from '../../../utils/gpx'

const RAD = Math.PI / 180

const toVector = ({ lat, lon }: LatLon) => [Math.cos(lat * RAD) * Math.cos(lon * RAD), Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD)]

// Within half a turn of the previous one, so a line over the antimeridian runs on instead of jumping.
function unwrap(lon: number, previous: number | undefined): number {
  if (previous === undefined) return lon
  return lon + 360 * Math.round((previous - lon) / 360)
}

function pushPoint(out: GpxPoint[], lat: number, lon: number) {
  out.push({ lat, lon: unwrap(lon, out[out.length - 1]?.lon), ele: 0, time: null })
}

export function greatCircle(stops: LatLon[], stepKm = 10): GpxPoint[] {
  const out: GpxPoint[] = []
  stops.forEach((b, k) => {
    if (k === 0) return pushPoint(out, b.lat, b.lon)
    const a = stops[k - 1]
    const km = kmBetween(a, b)
    const angle = km / EARTH_RADIUS_KM
    const n = Math.max(1, Math.ceil(km / stepKm))
    const va = toVector(a)
    const vb = toVector(b)
    for (let i = 1; i <= n; i++) {
      const t = i / n
      // Spherical interpolation; a zero angle (the same place twice) degrades to the end point.
      const wa = angle ? Math.sin((1 - t) * angle) / Math.sin(angle) : 0
      const wb = angle ? Math.sin(t * angle) / Math.sin(angle) : 1
      const [x, y, z] = [0, 1, 2].map((c) => wa * va[c] + wb * vb[c])
      pushPoint(out, Math.atan2(z, Math.hypot(x, y)) / RAD, Math.atan2(y, x) / RAD)
    }
  })
  return out
}

// A point every `stepKm`, so pacing and the camera move smoothly.
export function straightLines(stops: LatLon[], stepKm = 1): GpxPoint[] {
  const out: GpxPoint[] = []
  stops.forEach((b, k) => {
    if (k === 0) return pushPoint(out, b.lat, b.lon)
    const a = out[out.length - 1]
    const lon = unwrap(b.lon, a.lon)
    const n = Math.max(1, Math.ceil(kmBetween(a, b) / stepKm))
    for (let i = 1; i <= n; i++) pushPoint(out, a.lat + ((b.lat - a.lat) * i) / n, a.lon + ((lon - a.lon) * i) / n)
  })
  return out
}

export function withEstimatedTime(points: GpxPoint[], kmh: number, start: number): GpxPoint[] {
  let km = 0
  return points.map((p, i) => {
    if (i > 0) km += kmBetween(points[i - 1], p)
    return { ...p, time: start + (km / kmh) * 3_600_000 }
  })
}
