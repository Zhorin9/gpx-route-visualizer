import { describe, expect, it } from 'vitest'
import { DEFAULT_ANIMATION } from '../types'
import { PACINGS, constantPacing, easedPacing, pacingFor, speedPacing, type PacingContext } from './pacing'
import { clipProgress, entranceState, layerAt, totalDuration } from './timeline'
import type { GpxPoint } from '../../../types'

// 101 points, 100 m apart; the first half ridden at 10 km/h, the second at 30 km/h, with a 1 h stop in between.
const points: GpxPoint[] = Array.from({ length: 101 }, (_, i) => {
  const t = i <= 50 ? i * 36_000 : 50 * 36_000 + 3_600_000 + (i - 50) * 12_000
  return { lat: 50, lon: 15, ele: 0, time: t }
})
const cumKm = Float64Array.from({ length: 101 }, (_, i) => i * 0.1)
const ctx: PacingContext = { track: { name: null, points }, cumKm, range: { start: 0, end: 100 }, breaks: [] }

describe('timeline', () => {
  it('lasts until the last bar ends, plus the still frames', () => {
    expect(totalDuration(DEFAULT_ANIMATION)).toBeCloseTo(0.4 + 6 + 1.5)
  })

  it('measures progress along a bar', () => {
    const clip = { start: 1, duration: 2 }
    expect([clipProgress(clip, 0), clipProgress(clip, 2), clipProgress(clip, 5)]).toEqual([0, 0.5, 1])
    expect(clipProgress({ start: 1, duration: 0 }, 1)).toBe(1)
  })

  it('fades or slides elements in and leaves them static afterwards', () => {
    expect(entranceState('fade', 0)).toEqual({ opacity: 0, offsetY: 0 })
    expect(entranceState('slide', 0).offsetY).toBeGreaterThan(0)
    expect(entranceState('slide', 1)).toEqual({ opacity: 1, offsetY: 0 })
    expect(layerAt(DEFAULT_ANIMATION, 'route', 0)).toEqual({ opacity: 1, offsetY: 0 })
  })
})

describe('pacing', () => {
  it('covers the whole range from start to end with every strategy', () => {
    for (const p of PACINGS) {
      expect(p.headAt(0, ctx), p.id).toBeCloseTo(0)
      expect(p.headAt(1, ctx), p.id).toBeCloseTo(100)
      let last = -1
      for (let i = 0; i <= 20; i++) {
        const pos = p.headAt(i / 20, ctx)
        expect(pos, p.id).toBeGreaterThanOrEqual(last)
        last = pos
      }
    }
  })

  it('moves evenly by distance, or eases in and out', () => {
    expect(constantPacing.headAt(0.5, ctx)).toBeCloseTo(50)
    expect(easedPacing.headAt(0.1, ctx)).toBeLessThan(10)
  })

  it('follows the ride: slow half takes three quarters of the time, the stop takes none', () => {
    // Moving time: 30 min slow + 10 min fast. Half way in time is still in the slow part.
    expect(speedPacing.headAt(0.5, ctx)).toBeCloseTo(33.3, 0)
    expect(speedPacing.headAt(0.75, ctx)).toBeCloseTo(50, 0)
  })

  it('falls back to even pacing without timestamps', () => {
    const untimed = { ...ctx, track: { name: null, points: points.map((p) => ({ ...p, time: null })) } }
    expect(speedPacing.unavailable?.(untimed.track)).toMatch(/czasu/)
    expect(speedPacing.headAt(0.5, untimed)).toBeCloseTo(50)
    expect(pacingFor('nope' as never).id).toBe('eased')
  })
})
