import { posAtDistance } from '../../../utils/geometry'
import { memoOne } from '../../../utils/memo'
import type { RoutePart } from '../../../types'

// Seconds a leg takes when it has no time of its own (a GPX day among planned legs).
export const DEFAULT_LEG_S = 4
// Rest at a stop on the way when none is set; the trip's last stop doesn't rest.
export const DEFAULT_PAUSE_S = 1

// One stretch of the line's drawing: the head travels from one track index to another, or rests at one.
export interface ScheduleStep {
  from: number
  to: number
  seconds: number
}

// The drawing of a planned trip, leg by leg: each leg in its own time, a rest at each stop between
// legs. Null for a route with no planned leg, which is paced as a whole.
export const tripSchedule = memoOne((parts: RoutePart[]): ScheduleStep[] | null => {
  if (!parts.some((p) => p.plan)) return null
  const steps: ScheduleStep[] = []
  parts.forEach((part, i) => {
    steps.push({ from: part.startIdx, to: part.endIdx, seconds: part.plan?.duration ?? DEFAULT_LEG_S })
    const end = part.plan?.stops[part.plan.stops.length - 1]
    const pause = end?.pause ?? (i < parts.length - 1 ? DEFAULT_PAUSE_S : 0)
    if (pause > 0) steps.push({ from: part.endIdx, to: part.endIdx, seconds: pause })
  })
  return steps
})

export const scheduleSeconds = (steps: ScheduleStep[]) => steps.reduce((sum, s) => sum + s.seconds, 0)

// Track index the head has reached at `progress` (0-1) of the schedule. Within a leg the head
// moves by distance, through `shape` (easing per leg, so a flight speeds up and lands).
export function scheduleHead(steps: ScheduleStep[], progress: number, cumKm: Float64Array, shape: (f: number) => number): number {
  const total = scheduleSeconds(steps)
  let t = Math.max(0, Math.min(1, progress)) * total
  for (const step of steps) {
    if (t <= step.seconds || step === steps[steps.length - 1]) {
      if (step.from === step.to) return step.to
      const f = shape(step.seconds > 0 ? Math.min(1, t / step.seconds) : 1)
      return posAtDistance(cumKm, step.from, step.to, cumKm[step.from] + (cumKm[step.to] - cumKm[step.from]) * f)
    }
    t -= step.seconds
  }
  return steps[0]?.from ?? 0
}
