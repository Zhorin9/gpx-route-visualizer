import { describe, expect, it } from 'vitest'
import { FORMATS, FORMAT_ORDER } from './registry'

describe('format registry', () => {
  it('lists every format once', () => {
    expect([...FORMAT_ORDER].sort()).toEqual(Object.keys(FORMATS).sort())
    for (const key of FORMAT_ORDER) expect(FORMATS[key].key).toBe(key)
  })
})
