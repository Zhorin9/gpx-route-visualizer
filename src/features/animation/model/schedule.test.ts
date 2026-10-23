import { describe, expect, it } from 'vitest'
import { scheduleHead, scheduleSeconds, tripSchedule } from './schedule'
import type { RoutePart, Stop } from '../../../types'

const stop = (id: number, pause?: number): Stop => ({ id, name: '', lat: 0, lon: 0, via: false, ...(pause != null ? { pause } : null) })
const part = (id: number, startIdx: number, endIdx: number, duration: number, end: Stop): RoutePart => ({
  id,
  name: '',
  color: '',
  dashed: false,
  visible: true,
  sourceKey: '',
  startIdx,
  endIdx,
  plan: { mode: 'car', duration, stops: [stop(id * 10), end] },
})

describe('trip schedule', () => {
  // Two legs of 10 km each, 6 s and 2 s, with a 2 s rest at the stop between them.
  const parts = [part(1, 0, 10, 6, stop(2, 2)), part(2, 11, 21, 2, stop(3))]
  const cum = Float64Array.from({ length: 22 }, (_, i) => (i <= 10 ? i : i - 1))
  const steps = tripSchedule(parts)!
  const linear = (f: number) => f

  it('draws each leg in its own time and rests at the stops on the way, not at the end', () => {
    expect(steps.map((s) => [s.from, s.to, s.seconds])).toEqual([
      [0, 10, 6],
      [10, 10, 2],
      [11, 21, 2],
    ])
    expect(scheduleSeconds(steps)).toBe(10)
  })

  it('puts the head where the clock says', () => {
    expect(scheduleHead(steps, 0.3, cum, linear)).toBeCloseTo(5)
    // Resting at the stop between 6 s and 8 s.
    expect(scheduleHead(steps, 0.7, cum, linear)).toBe(10)
    expect(scheduleHead(steps, 0.9, cum, linear)).toBeCloseTo(16)
    expect(scheduleHead(steps, 1, cum, linear)).toBe(21)
  })

  it('leaves a route without planned legs to the pacing', () => {
    expect(tripSchedule([{ ...parts[0], plan: undefined }])).toBeNull()
  })
})
