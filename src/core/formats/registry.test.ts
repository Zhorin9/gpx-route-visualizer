import { describe, expect, it } from 'vitest'
import { defaultStatsY, defaultTitleY } from '../../utils/aspects'
import { FORMATS, FORMAT_ORDER, bottomInset } from './registry'

describe('format registry', () => {
  it('lists every format once', () => {
    expect([...FORMAT_ORDER].sort()).toEqual(Object.keys(FORMATS).sort())
    for (const key of FORMAT_ORDER) expect(FORMATS[key].key).toBe(key)
  })

  it('keeps the positions the portrait formats had before the registry', () => {
    expect(FORMAT_ORDER.slice(0, 3).map(bottomInset)).toEqual([60, 360, 60])
    expect(FORMAT_ORDER.slice(0, 3).map(defaultStatsY)).toEqual([70, 280, 70])
    expect(FORMAT_ORDER.slice(0, 3).map(defaultTitleY)).toEqual([176, 280, 140])
  })
})
