import { describe, expect, it } from 'vitest'
import { applyTransform, decimate, invertTransform, nearestPointOnPolyline, pointAt, posAtDistance } from './geometry'
import { schematicizeRoute } from './schematicRoute'

describe('nearestPointOnPolyline', () => {
  it('returns the projected point and its fractional index', () => {
    const hit = nearestPointOnPolyline([0, 0, 10, 0, 10, 10], 4, 3)
    expect(hit).toEqual({ x: 4, y: 0, pos: 0.4 })
  })

  it('respects the index window', () => {
    // (1, 1) is closest to the first segment, but only the second one is searched.
    const hit = nearestPointOnPolyline([0, 0, 10, 0, 10, 10], 1, 1, 1, 2)
    expect(hit?.x).toBe(10)
    expect(hit?.pos).toBeCloseTo(1.1)
  })
})

describe('pointAt', () => {
  it('interpolates between points and clamps out-of-range positions', () => {
    const flat = [0, 0, 10, 0, 10, 10]
    expect(pointAt(flat, 1.5)).toEqual({ x: 10, y: 5 })
    expect(pointAt(flat, 5)).toEqual({ x: 10, y: 10 })
  })
})

describe('decimate', () => {
  it('drops sub-pixel points but keeps both ends', () => {
    const flat = [0, 0, 0.1, 0, 0.2, 0, 5, 0, 5.1, 0]
    expect(decimate(flat, 0, 4, 1)).toEqual([0, 0, 5, 0, 5.1, 0])
  })
})

describe('posAtDistance', () => {
  it('finds the fractional index for a cumulative distance', () => {
    expect(posAtDistance([0, 1, 3, 6], 0, 3, 2)).toBe(1.5)
  })
})

describe('transforms', () => {
  it('invertTransform undoes applyTransform', () => {
    const t = { x: 30, y: -12, scaleX: 1.4, scaleY: 0.8, rotation: 37 }
    const back = invertTransform(applyTransform({ x: 5, y: 9 }, t), t)
    expect(back.x).toBeCloseTo(5)
    expect(back.y).toBeCloseTo(9)
  })
})

describe('schematicizeRoute', () => {
  it('produces only horizontal and vertical segments', () => {
    const zigzag = Array.from({ length: 50 }, (_, i) => [i * 10, Math.sin(i / 4) * 80]).flat()
    const out = schematicizeRoute(zigzag, { simplify: 40 })
    for (let i = 0; i + 3 < out.length; i += 2) {
      const horizontal = Math.abs(out[i + 1] - out[i + 3]) < 1e-9
      const vertical = Math.abs(out[i] - out[i + 2]) < 1e-9
      expect(horizontal || vertical).toBe(true)
    }
  })
})
