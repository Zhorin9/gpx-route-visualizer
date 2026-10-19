import { ASPECTS } from '../utils/aspects'
import { decimate, pointAt, posAtDistance } from '../utils/geometry'
import { computeRangeStats, cumulativeDistanceKm, projectPointsToCanvas, splitIntoDays } from '../utils/gpx'
import { memoOne } from '../utils/memo'
import { schematicizeRoute } from '../utils/schematicRoute'
import type { AspectKey, GpxTrack, RouteDay, RouteRange, TrackDay } from '../types'

// Pure, memoized derivations shared by the canvas and the panel. Kept out of
// the store so heavy arrays aren't duplicated into state or history.

export const dayBreaks = memoOne((days: RouteDay[]) => days.slice(1).map((d) => d.startIdx))

export const trackCumKm = memoOne((track: GpxTrack | null, breaks: readonly number[]) =>
  track ? cumulativeDistanceKm(track.points, breaks) : null,
)

export const trackDays = memoOne((track: GpxTrack | null): TrackDay[] => (track ? splitIntoDays(track.points) : []))

// The route is fitted to the whole carousel ribbon, so it can cross slide borders.
export const projectTrack = memoOne((track: GpxTrack | null, aspectKey: AspectKey, slideCount: number) => {
  if (!track) return null
  const { w, h } = ASPECTS[aspectKey]
  return projectPointsToCanvas(track.points, w * slideCount, h)
})

export const rangeStats = memoOne((track: GpxTrack | null, range: RouteRange, breaks: readonly number[]) => {
  const cum = trackCumKm(track, breaks)
  if (!track || !cum) return null
  return computeRangeStats(track.points, cum, range.start, range.end, breaks)
})

export interface RouteLines {
  // Whole visible range, decimated — used by schematic mode and hit testing.
  active: number[]
  completed: number[]
  remaining: number[]
}

const EMPTY_LINES: RouteLines = { active: [], completed: [], remaining: [] }

// Progress is split by distance, not point count, so 50% means half the ride
// even when the GPS logged more densely on climbs.
export const routeLines = memoOne(
  (projected: Float64Array | null, cum: Float64Array | null, range: RouteRange, progress: number): RouteLines => {
    if (!projected || !cum || range.end <= range.start) return EMPTY_LINES
    const { start, end } = range
    const active = decimate(projected, start, end)
    if (progress >= 100) return { active, completed: active, remaining: [] }
    if (progress <= 0) return { active, completed: [], remaining: active }

    const target = cum[start] + ((cum[end] - cum[start]) * progress) / 100
    const splitPos = posAtDistance(cum, start, end, target)
    const splitIdx = Math.floor(splitPos)
    const split = pointAt(projected, splitPos)
    const completed = decimate(projected, start, splitIdx)
    completed.push(split.x, split.y)
    const remaining = [split.x, split.y].concat(splitIdx + 1 <= end ? decimate(projected, splitIdx + 1, end) : [])
    return { active, completed, remaining }
  },
)

export const schematicLines = memoOne((active: number[], simplify: number) =>
  active.length >= 4 ? schematicizeRoute(active, { simplify }) : [],
)
