import { describe, expect, it } from 'vitest'
import { leaderEnd, unionBox } from './leader'

describe('leader line', () => {
  it('stops at the edge facing the anchor, on the way to the middle', () => {
    // A box straight above: the line meets its bottom edge in the middle.
    const [bx, by] = leaderEnd({ x: -50, y: -200, w: 100, h: 100 })!
    expect(bx).toBeCloseTo(0)
    expect(by).toBeCloseTo(-100)
    // Off to the right and up: it meets the side or the bottom on the line to the middle.
    const [x, y] = leaderEnd({ x: 100, y: -150, w: 100, h: 100 })!
    expect(x).toBeCloseTo(100)
    expect(y / x).toBeCloseTo(-100 / 150)
  })

  it('draws nothing when the anchor is under the element', () => {
    expect(leaderEnd({ x: -10, y: -10, w: 40, h: 40 })).toBeNull()
  })

  it('takes the photo and the name together', () => {
    expect(unionBox({ x: 0, y: -150, w: 180, h: 140 }, { x: 0, y: 0, w: 60, h: 20 })).toEqual({ x: 0, y: -150, w: 180, h: 170 })
  })
})
