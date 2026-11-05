import { describe, expect, it } from 'vitest'
import { leaderPoints } from '.'

const name = { kind: 'text' as const, box: { x: 0, y: 0, w: 100, h: 20 } }

describe('leader line', () => {
  it('meets a name at its end nearest the anchor', () => {
    expect(leaderPoints(name, -150, -10)).toEqual([0, 0, -50, 0])
    expect(leaderPoints(name, 40, -10)).toEqual([0, 0, 40, 0])
    expect(leaderPoints(name, -50, -80)).toEqual([0, 0, 0, -60])
  })

  it('goes into the middle of a photo', () => {
    expect(leaderPoints({ kind: 'photo', box: { x: 0, y: -160, w: 180, h: 140 } }, 50, 0)).toEqual([0, 0, 140, -90])
  })
})
