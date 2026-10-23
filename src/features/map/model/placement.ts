import type { MercatorFit } from '../../../utils/gpx'
import type { Point2D } from '../../../utils/geometry'
import type { RouteTransform } from '../../../types'

// MapLibre's world is 512 px wide at zoom 0.
const TILE_WORLD = 512

// The map's camera for a stretch of the frame, in MapLibre's terms.
export interface MapCamera {
  center: [number, number]
  zoom: number
  bearing: number
}

// Where Europe sits when there is no route yet.
const NO_ROUTE: MercatorFit = { scale: 1080 * 4, x0: 0.47, y0: 0.27 }

// The frame point `at` in Web Mercator ([0, 1] both ways): undoes the view transform, then the projection.
function mercatorAt(fit: MercatorFit, t: RouteTransform, at: Point2D): Point2D {
  const rad = (-t.rotation * Math.PI) / 180
  const dx = at.x - t.x
  const dy = at.y - t.y
  const k = fit.scale * t.scaleX
  return {
    x: fit.x0 + (dx * Math.cos(rad) - dy * Math.sin(rad)) / k,
    y: fit.y0 + (dx * Math.sin(rad) + dy * Math.cos(rad)) / k,
  }
}

const toLon = (x: number) => ((((x * 360 - 180 + 180) % 360) + 360) % 360) - 180
const toLat = (y: number) => (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI

// The place on the map (longitude, latitude) that the frame point `at` shows.
export function lngLatAt(fit: MercatorFit, transform: RouteTransform, at: Point2D): [number, number] {
  const m = mercatorAt(fit, transform, at)
  return [toLon(m.x), toLat(m.y)]
}

// The map camera that puts the map under the route: what the route shows at frame point `at`
// is the map's centre, at the same scale and turned the same way. `pixel` is how many map
// pixels a frame pixel takes (the preview is smaller than the frame, an export may be larger).
export function mapCamera(fit: MercatorFit | null, transform: RouteTransform, at: Point2D, pixel = 1): MapCamera {
  const f = fit ?? NO_ROUTE
  const m = mercatorAt(f, transform, at)
  return {
    center: [toLon(m.x), toLat(m.y)],
    zoom: Math.log2((f.scale * Math.abs(transform.scaleX) * pixel) / TILE_WORLD),
    bearing: -transform.rotation,
  }
}
