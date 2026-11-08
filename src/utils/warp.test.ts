import { describe, expect, it } from 'vitest'
import { warpLine } from './warp'

const chars = [...'GRAVEL']
const advances = chars.map(() => 40)

describe('warped text', () => {
  it('keeps every letter inside the box the selection outlines', () => {
    for (const warp of [
      { kind: 'wave' as const, amount: 15, length: 3.4 },
      { kind: 'arc' as const, amount: 40 },
      { kind: 'arc' as const, amount: -40 },
      { kind: 'bulge' as const, amount: 30 },
    ]) {
      const line = warpLine(chars, advances, 60, warp)
      for (const g of line.glyphs) {
        expect(g.x).toBeGreaterThanOrEqual(0)
        expect(g.x).toBeLessThanOrEqual(line.width)
        expect(g.y).toBeGreaterThanOrEqual(0)
        expect(g.y).toBeLessThanOrEqual(line.height)
      }
    }
  })

  it('keeps a finite box for a text cleared to nothing, so it can still be picked', () => {
    const line = warpLine([], [], 60, { kind: 'arc', amount: 40 })
    expect(Number.isFinite(line.width) && Number.isFinite(line.height)).toBe(true)
  })

  it('lays the letters of an arc at an equal distance from its centre', () => {
    const { glyphs } = warpLine(chars, advances, 60, { kind: 'arc', amount: 30 })
    const radius = 240 / (0.3 * 2 * Math.PI)
    const cx = glyphs[0].x + radius * Math.sin((glyphs[0].rotation * Math.PI) / 180) * -1
    const cy = glyphs[0].y + radius * Math.cos((glyphs[0].rotation * Math.PI) / 180)
    for (const g of glyphs) expect(Math.hypot(g.x - cx, g.y - cy)).toBeCloseTo(radius, 5)
  })
})
