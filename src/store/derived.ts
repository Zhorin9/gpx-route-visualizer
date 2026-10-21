import { ASPECTS } from '../utils/aspects'
import { computeRangeStats, cumulativeDistanceKm, projectPointsToCanvas, splitIntoDays } from '../utils/gpx'
import { memoOne } from '../utils/memo'
import type { AspectKey, GpxPoint, GpxTrack, RoutePart, RouteRange, RouteSource, TrackDay } from '../types'

// Pure, memoized derivations shared by the canvas and the panel. Kept out of
// the store so heavy arrays aren't duplicated into state or history.

export interface JoinedTrack {
  track: GpxTrack
  // Every part with the slice of points it covers, in route order.
  parts: RoutePart[]
}

// The parts' points, end to end. A part whose points aren't cached (can't happen in a session,
// the cache only grows) is skipped rather than breaking the whole route.
export const joinTrack = memoOne((source: RouteSource | null, cache: Record<string, GpxPoint[]>): JoinedTrack | null => {
  if (!source) return null
  const points: GpxPoint[] = []
  const parts: RoutePart[] = []
  for (const part of source.parts) {
    const own = cache[part.sourceKey]
    if (!own?.length) continue
    parts.push({ ...part, startIdx: points.length, endIdx: points.length + own.length - 1 })
    for (const p of own) points.push(p)
  }
  return points.length ? { track: { name: source.name, points }, parts } : null
})

type SourceState = { routeSource: RouteSource | null; trackCache: Record<string, GpxPoint[]> }

const NO_PARTS: RoutePart[] = []

// Usable directly as zustand selectors: the result keeps its identity while the source doesn't change.
export const selectTrack = (s: SourceState): GpxTrack | null => joinTrack(s.routeSource, s.trackCache)?.track ?? null

// Empty for a single file: one part is drawn in the route's own style, not as a day.
export const selectRouteDays = (s: SourceState): RoutePart[] => {
  const parts = joinTrack(s.routeSource, s.trackCache)?.parts
  return parts && parts.length > 1 ? parts : NO_PARTS
}

export const dayBreaks = memoOne((days: RoutePart[]) => days.slice(1).map((d) => d.startIdx))

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
