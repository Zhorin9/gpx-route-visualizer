import { describe, expect, it } from 'vitest'
import { snapBox } from './snap'

const frame = { x: 0, y: 0, width: 1000, height: 2000 }

describe('snapBox', () => {
  it('centres a box that is close to the frame centre', () => {
    const snap = snapBox({ x: 397, y: 300, width: 200, height: 100 }, [frame], 6)
    expect(snap.dx).toBe(3)
    expect(snap.dy).toBe(0)
    expect(snap.guides).toEqual([[500, 0, 500, 2000]])
  })

  it('snaps both axes independently', () => {
    const snap = snapBox({ x: 402, y: 952, width: 200, height: 100 }, [frame], 6)
    expect([snap.dx, snap.dy]).toEqual([-2, -2])
    expect(snap.guides).toHaveLength(2)
  })

  it('lines up edges with another element', () => {
    const other = { x: 100, y: 1500, width: 300, height: 80 }
    const snap = snapBox({ x: 104, y: 1200, width: 150, height: 50 }, [frame, other], 6)
    expect(snap.dx).toBe(-4)
    expect(snap.guides).toEqual([[100, 1200, 100, 1580]])
  })

  it('does not snap a middle to an edge', () => {
    const snap = snapBox({ x: 450, y: 300, width: 100, height: 100 }, [{ x: 497, y: 800, width: 30, height: 10 }], 6)
    expect(snap.dx).toBe(0)
  })

  it('leaves a box that is far from everything', () => {
    expect(snapBox({ x: 300, y: 300, width: 100, height: 100 }, [frame], 6)).toEqual({ dx: 0, dy: 0, guides: [] })
  })
})
