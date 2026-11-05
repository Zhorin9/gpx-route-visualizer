import { rotate, type Point2D } from '../../../utils/geometry'
import type { MercatorFit } from '../../../utils/gpx'
import type { RouteTransform } from '../../../types'

// `shift` in Web Mercator units ([0, 1] across the world).
export function panFrame(t: RouteTransform, fit: MercatorFit, shift: Point2D): RouteTransform {
  const k = fit.scale * t.scaleX
  const r = rotate(shift.x, shift.y, t.rotation)
  return { ...t, x: t.x - r.x * k, y: t.y - r.y * k }
}

// `center` in frame pixels; it keeps showing the same place.
export function scaleFrame(t: RouteTransform, factor: number, center: Point2D): RouteTransform {
  return {
    ...t,
    scaleX: t.scaleX / factor,
    scaleY: t.scaleY / factor,
    x: center.x - (center.x - t.x) / factor,
    y: center.y - (center.y - t.y) / factor,
  }
}
