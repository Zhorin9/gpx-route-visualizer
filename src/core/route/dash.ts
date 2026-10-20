import type { RouteStyle } from '../../types'
import type { RouteSegment } from './geometry'

export function coreDash(style: RouteStyle, segment: RouteSegment): number[] | undefined {
  const w = style.coreWidth
  // A day has its own solid/dashed setting instead of the route's.
  if (segment.day) return segment.day.dashed ? [w * 3, w * 2] : undefined
  return style.dotted ? [0.1, w * 2.4] : style.dashed ? [w * 3, w * 2] : undefined
}
