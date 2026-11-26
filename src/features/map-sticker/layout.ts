import { fitMercator, projectWithFit, type MercatorFit } from '../../utils/gpx'
import { clippedToBox, convexHull, grown } from './shape'
import type { LonLat } from './countries'
import type { GpxPoint, RoutePart } from '../../types'

export const BORDER = 0.022

export interface StickerLeg {
  id: number
  points: number[]
  dashed: boolean
  inFocus: boolean
}

export interface StickerLayout {
  H: number
  fit: MercatorFit
  outlines: number[][]
  legs: StickerLeg[]
  cut: boolean
  start: number[]
  focusLo: number
  focusHi: number
  at: (index: number) => number[]
}

interface LayoutInput {
  points: GpxPoint[]
  lo: number
  hi: number
  day: RoutePart | undefined
  parts: RoutePart[]
  W: number
  margin: number
  countryRings: LonLat[][] | null
  zoom: number
  pan: { x: number; y: number }
}

export const panLimit = (zoom: number) => (1 - 1 / zoom) / 2

function zoomedFit(fit: MercatorFit, W: number, H: number, zoom: number, pan: { x: number; y: number }): MercatorFit {
  if (zoom <= 1) return fit
  const limit = panLimit(zoom)
  const px = Math.min(limit, Math.max(-limit, pan.x))
  const py = Math.min(limit, Math.max(-limit, pan.y))
  return {
    scale: fit.scale * zoom,
    x0: fit.x0 + (W / fit.scale) * ((1 - 1 / zoom) / 2 + px),
    y0: fit.y0 + (H / fit.scale) * ((1 - 1 / zoom) / 2 + py),
  }
}

const asPoints = (ring: LonLat[]): GpxPoint[] => ring.map(([lon, lat]) => ({ lat, lon, ele: 0, time: null }))

function boxHeight(shapePoints: GpxPoint[], W: number): number {
  const unit = projectWithFit(shapePoints, { scale: 1, x0: 0, y0: 0 })
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (let i = 0; i < unit.length; i += 2) {
    minX = Math.min(minX, unit[i]); maxX = Math.max(maxX, unit[i])
    minY = Math.min(minY, unit[i + 1]); maxY = Math.max(maxY, unit[i + 1])
  }
  return Math.round(W * Math.min(1.5, Math.max(0.6, (maxY - minY) / (maxX - minX || 1))))
}

export function stickerLayout({ points, lo, hi, day, parts, W, margin, countryRings, zoom, pan }: LayoutInput): StickerLayout | null {
  const route = points.slice(lo, hi + 1)
  if (route.length < 2) return null
  const dayLo = day ? Math.max(lo, day.startIdx) : lo
  const dayHi = day ? Math.min(hi, day.endIdx) : hi
  const [focusLo, focusHi] = dayHi > dayLo ? [dayLo, dayHi] : [lo, hi]
  const country = countryRings?.length ? countryRings.flatMap(asPoints) : null
  const shapePoints = country ?? points.slice(focusLo, focusHi + 1)
  const H = boxHeight(shapePoints, W)
  const wholeShape = fitMercator(shapePoints, W, H, country ? W * BORDER * 1.4 : W * (margin + BORDER) * 1.4)
  const fit = zoomedFit(wholeShape, W, H, zoom, pan)
  const flat = Array.from(projectWithFit(route, fit))
  const between = (a: number, b: number) => flat.slice((a - lo) * 2, (b - lo + 1) * 2)
  const shapes = countryRings?.length
    ? countryRings.map((ring) => Array.from(projectWithFit(asPoints(ring), fit)))
    : [grown(convexHull(between(focusLo, focusHi)), W * margin * zoom).flat()]
  const outlines = zoom > 1 ? shapes.map((outline) => clippedToBox(outline, W, H)).filter((outline) => outline.length >= 6) : shapes
  const legs = parts
    .map((part) => {
      const inFocus = !day || (part.startIdx >= day.startIdx && part.endIdx <= day.endIdx)
      const joinedToPrevious = !day || !inFocus
      return { part, inFocus, a: Math.max(lo, joinedToPrevious ? part.startIdx - 1 : part.startIdx), b: Math.min(hi, part.endIdx) }
    })
    .filter(({ a, b }) => b > a)
    .map(({ a, b, part, inFocus }) => ({ id: part.id, points: between(a, b), dashed: part.dashed, inFocus }))
  return { H, fit, outlines, legs, cut: zoom > 1, start: between(focusLo, focusLo), focusLo, focusHi, at: (index) => between(index, index) }
}
