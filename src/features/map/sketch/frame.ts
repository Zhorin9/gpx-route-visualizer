import { FORMATS } from '../../../core/formats/registry'
import { selectTrack } from '../../../store/derived'
import { memoOne } from '../../../utils/memo'
import { projectWithFit, type MercatorFit } from '../../../utils/gpx'
import type { AppState } from '../../../store/types'
import type { GpxPoint, RouteTransform } from '../../../types'
import { sketchPalette, type SketchFrame } from './draw'
import type { SketchLayers } from './tiles'
import { routeSeed, type Pt } from './pen'
import { sketchShape } from './shape'

export const seedOf = memoOne((points: GpxPoint[]) => routeSeed(points))

const routeIn = memoOne((points: GpxPoint[], fit: MercatorFit): Pt[] => {
  const flat = projectWithFit(points, fit)
  return Array.from({ length: flat.length / 2 }, (_, i) => [flat[i * 2], flat[i * 2 + 1]])
})

const shapeOf = memoOne((layers: SketchLayers | null | undefined, route: Pt[], fit: MercatorFit, w: number, h: number) =>
  layers ? sketchShape(layers, fit, route, w, h) : null,
)

// The frame the sketch is drawn from, for the preview and for files alike.
export function sketchFrame(s: Pick<AppState, 'routeSource' | 'trackCache' | 'aspectKey' | 'slides' | 'map' | 'sketchLayers'>, fit: MercatorFit | null, transform: RouteTransform): SketchFrame {
  const { w, h } = FORMATS[s.aspectKey]
  const points = selectTrack(s)?.points
  const route = points && fit ? routeIn(points, fit) : null
  const seed = points ? seedOf(points) : 1
  return {
    shape: route && fit ? shapeOf(s.sketchLayers[seed], route, fit, w, h) : null,
    ends: route?.length ? [route[0], route[route.length - 1]] : null,
    transform,
    width: w * s.slides.length,
    height: h,
    short: Math.min(w, h),
    palette: sketchPalette(s.map),
    settings: s.map.sketch,
    seed,
  }
}
