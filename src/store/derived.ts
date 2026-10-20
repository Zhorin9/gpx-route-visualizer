import { ASPECTS } from '../utils/aspects'
import { computeRangeStats, cumulativeDistanceKm, projectPointsToCanvas, splitIntoDays } from '../utils/gpx'
import { memoOne } from '../utils/memo'
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
