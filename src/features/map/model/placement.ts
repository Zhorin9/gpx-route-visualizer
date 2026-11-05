import type { MercatorFit } from '../../../utils/gpx'
import { rotate, type Point2D } from '../../../utils/geometry'
import type { RouteTransform } from '../../../types'

// MapLibre's world is 512 px wide at zoom 0.
const TILE_WORLD = 512

export interface MapCamera {
  center: [number, number]
  zoom: number
  bearing: number
}

// Where Europe sits when there is no route yet.
const NO_ROUTE: MercatorFit = { scale: 1080 * 4, x0: 0.47, y0: 0.27 }

function mercatorAt(fit: MercatorFit, t: RouteTransform, at: Point2D): Point2D {
  const r = rotate(at.x - t.x, at.y - t.y, -t.rotation)
  const k = fit.scale * t.scaleX
  return { x: fit.x0 + r.x / k, y: fit.y0 + r.y / k }
}

const toLon = (x: number) => ((((x * 360 - 180 + 180) % 360) + 360) % 360) - 180
const toLat = (y: number) => (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI

export function lngLatAt(fit: MercatorFit, transform: RouteTransform, at: Point2D): [number, number] {
  const m = mercatorAt(fit, transform, at)
  return [toLon(m.x), toLat(m.y)]
}

// `pixel`: map pixels per frame pixel (the preview is smaller than the frame, an export may be larger).
export function mapCamera(fit: MercatorFit | null, transform: RouteTransform, at: Point2D, pixel = 1): MapCamera {
  const f = fit ?? NO_ROUTE
  const m = mercatorAt(f, transform, at)
  return {
    center: [toLon(m.x), toLat(m.y)],
    zoom: Math.log2((f.scale * Math.abs(transform.scaleX) * pixel) / TILE_WORLD),
    bearing: -transform.rotation,
  }
}
