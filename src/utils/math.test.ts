import { describe, expect, it } from 'vitest'
import { niceStep } from './math'

describe('math', () => {
  it('rounds a step to 1, 2 or 5 times a power of ten', () => {
    expect(niceStep(37)).toBe(50)
    expect(niceStep(180)).toBe(200)
    expect(niceStep(0.8)).toBe(1)
  })
})
