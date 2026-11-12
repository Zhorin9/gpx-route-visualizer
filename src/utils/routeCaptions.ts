import { distanceIn, distanceUnit, type Units } from '../core/units'
import i18n from '../i18n'
import { kmBetween } from './gpx'
import type { GpxPoint, RouteRange } from '../types'

// Ends closer than this make a loop: one caption for start and finish.
const LOOP_KM = 0.3

export interface RouteCaption {
  trackPos: number
  text: string
}

// The captions a sticker style writes along the route: start, finish (one for a loop) and the halfway distance.
export function routeCaptions(points: GpxPoint[], cum: ArrayLike<number>, range: RouteRange, units: Units): RouteCaption[] {
  const start = Math.max(0, Math.floor(range.start))
  const end = Math.min(points.length - 1, Math.ceil(range.end))
  if (end <= start) return []
  const half = (cum[end] - cum[start]) / 2
  let middle = start
  while (middle < end && cum[middle] - cum[start] < half) middle++
  const ends = kmBetween(points[start], points[end]) < LOOP_KM ? [{ trackPos: start, text: i18n.t('newContent.loop') }] : [{ trackPos: start, text: i18n.t('newContent.start') }, { trackPos: end, text: i18n.t('newContent.finish') }]
  return [...ends, { trackPos: middle, text: `${Math.round(distanceIn(half, units))} ${distanceUnit(units)}` }]
}
