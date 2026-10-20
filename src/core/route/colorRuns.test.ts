import { describe, expect, it } from 'vitest'
import { colorRuns } from './colorRuns'

describe('colorRuns', () => {
  it('joins neighbouring pieces of one colour and shares the vertex between runs', () => {
    const color = (pos: number) => (pos < 2 ? 'a' : 'b')
    expect(colorRuns([0, 1, 2, 3, 4], color)).toEqual([
      { color: 'a', from: 0, to: 2 },
      { color: 'b', from: 2, to: 4 },
    ])
  })

  it('returns nothing for a single vertex', () => {
    expect(colorRuns([5], () => 'a')).toEqual([])
  })
})
