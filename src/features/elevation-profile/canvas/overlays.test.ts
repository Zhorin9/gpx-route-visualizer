import { describe, expect, it } from 'vitest'
import { DEFAULT_PROFILE } from '../types'
import { reservesBand } from './overlays'

describe('profile overlays', () => {
  it('keep room above the chart only for labels that stand there', () => {
    const quiet = { ...DEFAULT_PROFILE, showTotal: false, showMinMax: false, peak: false, climbLabels: false }
    expect(reservesBand('above', quiet)).toBe(false)
    expect(reservesBand('above', { ...quiet, peak: true })).toBe(true)
  })

  it('leave no distance row under an overlay across the frame', () => {
    expect(reservesBand('below', { ...DEFAULT_PROFILE, showDistance: true, layout: 'tall' })).toBe(true)
    expect(reservesBand('below', { ...DEFAULT_PROFILE, showDistance: true, layout: 'overlay' })).toBe(false)
  })
})
