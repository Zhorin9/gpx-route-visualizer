import { describe, expect, it } from 'vitest'
import { stampText } from './model'

describe('date and time stamp', () => {
  it('writes the day, month and local start time with leading zeros', () => {
    expect(stampText(new Date(2025, 7, 2, 6, 5).getTime())).toBe('02.08 · 06:05')
  })
})
