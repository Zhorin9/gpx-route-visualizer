import { posAtDistance } from '../../../utils/geometry'
import { MOVING_MIN_KMH } from '../../../utils/gpx'
import { memoOne } from '../../../utils/memo'
import type { GpxTrack, RouteRange } from '../../../types'
import type { PacingId } from '../types'
import { scheduleHead, type ScheduleStep } from './schedule'
import { easeInOut } from './timeline'

export interface PacingContext {
  track: GpxTrack
  cumKm: Float64Array
  range: RouteRange
  // Starts of days after the first: the night between two days takes no time.
  breaks: readonly number[]
  // A planned trip is drawn leg by leg with rests at the stops (model/schedule.ts).
  schedule?: ScheduleStep[] | null
}

// How the line's progress (0-1 of its time) maps to a place on the track.
export interface PacingStrategy {
  id: PacingId
  label: string
  // Fractional track index the line has reached.
  headAt: (progress: number, ctx: PacingContext) => number
  // Why the strategy falls back to even pacing for this track, if it does.
  unavailable?: (track: GpxTrack) => string | null
}

const byDistance = (p: number, { cumKm, range }: PacingContext) =>
  posAtDistance(cumKm, range.start, range.end, cumKm[range.start] + (cumKm[range.end] - cumKm[range.start]) * p)

export const constantPacing: PacingStrategy = {
  id: 'constant',
  label: 'Stałe',
  headAt: byDistance,
}

export const easedPacing: PacingStrategy = {
  id: 'eased',
  label: 'Łagodne',
  headAt: (p, ctx) => byDistance(easeInOut(p), ctx),
}

// Moving time elapsed at each point of the range: stops and nights add nothing.
const movingClock = memoOne((track: GpxTrack, cumKm: Float64Array, range: RouteRange, breaks: readonly number[]): Float64Array | null => {
  const n = range.end - range.start + 1
  const clock = new Float64Array(n)
  const skip = new Set(breaks)
  for (let i = range.start + 1; i <= range.end; i++) {
    const k = i - range.start
    clock[k] = clock[k - 1]
    const a = track.points[i - 1].time
    const b = track.points[i].time
    if (a == null || b == null || skip.has(i)) continue
    const dt = b - a
    if (dt > 0 && (cumKm[i] - cumKm[i - 1]) / (dt / 3_600_000) >= MOVING_MIN_KMH) clock[k] += dt
  }
  return clock[n - 1] > 0 ? clock : null
})

const hasTime = (track: GpxTrack) => track.points.some((p) => p.time != null)

// As fast as the ride itself: quick descents fly by, climbs take their time.
export const speedPacing: PacingStrategy = {
  id: 'bySpeed',
  label: 'Wg prędkości',
  unavailable: (track) => (hasTime(track) ? null : 'brak czasu w pliku — tempo stałe'),
  headAt: (p, ctx) => {
    const clock = movingClock(ctx.track, ctx.cumKm, ctx.range, ctx.breaks)
    if (!clock) return byDistance(p, ctx)
    return ctx.range.start + posAtDistance(clock, 0, clock.length - 1, clock[clock.length - 1] * p)
  },
}

export const PACINGS: readonly PacingStrategy[] = [constantPacing, easedPacing, speedPacing]

export function pacingFor(id: PacingId): PacingStrategy {
  return PACINGS.find((s) => s.id === id) ?? easedPacing
}

// Where the head is at `progress` of the line's bar. A planned trip over its whole length follows its
// legs' own times and rests, eased leg by leg with the eased pacing; anything else, the pacing alone.
export function headFor(id: PacingId, progress: number, ctx: PacingContext): number {
  const whole = ctx.range.start === 0 && ctx.range.end === ctx.track.points.length - 1
  if (ctx.schedule && whole) return scheduleHead(ctx.schedule, progress, ctx.cumKm, id === 'eased' ? easeInOut : (f) => f)
  return pacingFor(id).headAt(progress, ctx)
}
