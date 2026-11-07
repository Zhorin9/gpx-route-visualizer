import { describe, expect, it } from 'vitest'
import { badgeOutline } from './badge'
import type { BadgeShape } from '../types'

const SHAPES: BadgeShape[] = ['burst', 'star', 'circle', 'ribbon']

describe('badge outline', () => {
  it('is drawn the same every time and holds the whole text box', () => {
    for (const shape of SHAPES) {
      const points = badgeOutline(shape, 300, 80)
      expect(badgeOutline(shape, 300, 80)).toEqual(points)
      const xs = points.filter((_, i) => i % 2 === 0)
      const ys = points.filter((_, i) => i % 2 === 1)
      expect(Math.min(...xs)).toBeLessThan(-150)
      expect(Math.max(...xs)).toBeGreaterThan(150)
      expect(Math.min(...ys)).toBeLessThan(-40)
      expect(Math.max(...ys)).toBeGreaterThan(40)
    }
  })

  it('gives a burst many spikes and a star five', () => {
    expect(badgeOutline('burst', 300, 80)).toHaveLength(14 * 2 * 2)
    expect(badgeOutline('star', 300, 80)).toHaveLength(5 * 2 * 2)
  })
})
