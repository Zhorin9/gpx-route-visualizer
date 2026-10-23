import type { Point2D } from '../../../utils/geometry'
import type { MercatorFit } from '../../../utils/gpx'
import type { RouteTransform } from '../../../types'

// The frame dragged across the map by `shift` (Web Mercator units, [0, 1] across the world):
// the frame shows another area, so the route moves the other way within it.
export function panFrame(t: RouteTransform, fit: MercatorFit, shift: Point2D): RouteTransform {
  const k = fit.scale * t.scaleX
  const rad = (t.rotation * Math.PI) / 180
  return {
    ...t,
    x: t.x - (shift.x * Math.cos(rad) - shift.y * Math.sin(rad)) * k,
    y: t.y - (shift.x * Math.sin(rad) + shift.y * Math.cos(rad)) * k,
  }
}

// The frame made `factor` times larger on the map around its middle `center` (frame pixels):
// it takes in more, so the route is drawn smaller, and the middle keeps showing the same place.
export function scaleFrame(t: RouteTransform, factor: number, center: Point2D): RouteTransform {
  return {
    ...t,
    scaleX: t.scaleX / factor,
    scaleY: t.scaleY / factor,
    x: center.x - (center.x - t.x) / factor,
    y: center.y - (center.y - t.y) / factor,
  }
}
