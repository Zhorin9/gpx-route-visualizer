import type { RouteStyle } from '../../types'
import type { RouteSegment } from './geometry'

// Where each drawn part of the route takes its colour from. The painter only asks;
// it does not know about days, data sources or palettes.
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

// The route colour, or the day's own colour on a multi-day route.
export function styleColoring(style: Pick<RouteStyle, 'color'>): RouteColoring {
  return { kind: 'solid', color: (segment) => segment.day?.color ?? style.color }
}
