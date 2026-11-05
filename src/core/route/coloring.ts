import type { RouteStyle } from '../../types'
import type { RouteSegment } from './geometry'

export type RouteColoring =
  | {
      kind: 'solid'
      color: (segment: RouteSegment) => string
    }
  | {
      kind: 'perPoint'
      // Colour at a fractional track index.
      at: (pos: number) => string
      // Glow in the colour under it, or one even colour.
      glow: { kind: 'follow' } | { kind: 'uniform'; color: string }
    }

// A multi-day route takes each day's own colour.
export function styleColoring(style: Pick<RouteStyle, 'color'>): RouteColoring {
  return { kind: 'solid', color: (segment) => segment.day?.color ?? style.color }
}
