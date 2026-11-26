import { describe, expect, it } from 'vitest'
import { nearestPointOnPolyline } from './geometry'
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
