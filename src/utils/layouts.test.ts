import { describe, expect, it } from 'vitest'
import { LAYOUTS, computeSlots, frameInsets, layoutDef, slotAt } from './layouts'
import { gradientLine } from './color'

const W = 1080
const H = 1350

describe('computeSlots', () => {
  it('covers the whole frame with a single slot when there is no gap or margin', () => {
    const [slot] = computeSlots(layoutDef('g1'), W, H, 0, 0)
    expect(slot).toMatchObject({ x: 0, y: 0, w: W, h: H })
  })

  it('splits the gap between neighbours and keeps the margin around the grid', () => {
    const [left, right] = computeSlots(layoutDef('g2v'), W, H, 20, 30)
    expect(left.x).toBe(30)
    expect(right.x - (left.x + left.w)).toBeCloseTo(20, 5)
    expect(right.x + right.w).toBeCloseTo(W - 30, 5)
  })

  it('never leaves a slot outside the frame for any grid layout', () => {
    for (const def of LAYOUTS.filter((l) => l.group === 'grid')) {
      for (const slot of computeSlots(def, W, H, 24, 40)) {
        expect(slot.x).toBeGreaterThanOrEqual(40 - 1e-6)
        expect(slot.y).toBeGreaterThanOrEqual(40 - 1e-6)
        expect(slot.x + slot.w).toBeLessThanOrEqual(W - 40 + 1e-6)
        expect(slot.y + slot.h).toBeLessThanOrEqual(H - 40 + 1e-6)
      }
    }
  })

  it('ignores gap and margin for backdrops and framed cells', () => {
    const [backdrop, framed] = computeSlots(layoutDef('c1'), W, H, 50, 100)
    expect(backdrop).toMatchObject({ x: 0, y: 0, w: W, h: H, kind: 'backdrop' })
    expect(framed.kind).toBe('framed')
    expect(framed.x).toBeCloseTo(0.18 * W, 5)
  })

  it('tilts scrapbook photos', () => {
    const slots = computeSlots(layoutDef('c4'), W, H, 0, 0)
    expect(slots).toHaveLength(3)
    expect(slots.every((s) => s.rotation !== 0)).toBe(true)
  })
})

describe('frameInsets', () => {
  const slot = { index: 0, x: 0, y: 0, w: 400, h: 300, rotation: 0, kind: 'framed' as const }

  it('is zero when the slot has no frame', () => {
    expect(frameInsets(slot, 20, 'equal', false)).toEqual({ top: 0, right: 0, bottom: 0, left: 0 })
  })

  it('leaves a thicker bottom edge for polaroids', () => {
    const equal = frameInsets(slot, 20, 'equal', true)
    const polaroid = frameInsets(slot, 20, 'polaroid', true)
    expect(equal.bottom).toBe(20)
    expect(polaroid.bottom).toBeGreaterThan(equal.bottom)
    expect(polaroid.top).toBe(20)
  })

  it('never eats the whole slot', () => {
    const tiny = { ...slot, w: 30, h: 30 }
    const ins = frameInsets(tiny, 60, 'polaroid', true)
    expect(tiny.w - ins.left - ins.right).toBeGreaterThan(0)
    expect(tiny.h - ins.top - ins.bottom).toBeGreaterThan(0)
  })
})

describe('slotAt', () => {
  it('finds the topmost slot under a point', () => {
    const slots = computeSlots(layoutDef('c1'), W, H, 0, 0)
    expect(slotAt(slots, W / 2, H / 2)?.index).toBe(1)
    expect(slotAt(slots, 10, 10)?.index).toBe(0)
  })

  it('accounts for rotation', () => {
    const slot = { index: 0, x: 0, y: 0, w: 200, h: 20, rotation: 90, kind: 'framed' as const }
    // Rotated a quarter turn about its centre (100, 10): now tall and thin.
    expect(slotAt([slot], 100, 100)).not.toBeNull()
    expect(slotAt([slot], 190, 10)).toBeNull()
  })

  it('returns null outside every slot', () => {
    const slots = computeSlots(layoutDef('g22'), W, H, 40, 60)
    expect(slotAt(slots, 5, 5)).toBeNull()
  })
})

describe('gradientLine', () => {
  it('runs top to bottom at 180 degrees and left to right at 90', () => {
    const down = gradientLine(180, 100, 200)
    expect(down.start.y).toBeCloseTo(0)
    expect(down.end.y).toBeCloseTo(200)
    expect(down.start.x).toBeCloseTo(down.end.x)
    const right = gradientLine(90, 100, 200)
    expect(right.start.x).toBeCloseTo(0)
    expect(right.end.x).toBeCloseTo(100)
  })
})
