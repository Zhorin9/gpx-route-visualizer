import type { RouteStyle } from '../../types'
import type { RouteSegment } from './geometry'

export function dashPattern(style: Pick<RouteStyle, 'dashed' | 'dotted'>, width: number): number[] | undefined {
  if (style.dotted) return [0.1, width * 2.4]
  if (style.dashed) return [width * 3, width * 2]
  return undefined
}

export function coreDash(style: RouteStyle, segment: RouteSegment): number[] | undefined {
  return dashPattern(segment.day ? { dashed: segment.day.dashed, dotted: false } : style, style.coreWidth)
}
