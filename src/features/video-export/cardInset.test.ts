import { describe, expect, it } from 'vitest'
import { cardPresence, cardRect } from './cardInset'

describe('card on the footage', () => {
  it('rests in the chosen corner, inside the frame', () => {
    const r = cardRect({ frame: '16:9', corner: 'br', size: 0.6 }, '9:16')
    expect(r.h).toBeCloseTo(1080 * 0.6)
    expect(r.x + r.w).toBeLessThan(1920)
    expect(r.y + r.h).toBeLessThan(1080)
    expect(r.x).toBeGreaterThan(1920 / 2)
    const tl = cardRect({ frame: '16:9', corner: 'tl', size: 0.6 }, '9:16')
    expect(tl.x).toBe(tl.y)
  })

  it('slides in at the start and out at the end', () => {
    expect(cardPresence(0, 8)).toBe(0)
    expect(cardPresence(4, 8)).toBe(1)
    expect(cardPresence(8, 8)).toBe(0)
    expect(cardPresence(0.3, 8)).toBeGreaterThan(0)
  })
})
