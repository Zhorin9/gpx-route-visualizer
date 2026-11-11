import { describe, expect, it } from 'vitest'
import { slugify } from './format'

describe('format', () => {
  it('slugifies Polish names for file names', () => {
    expect(slugify('Śnieżka — Łomnica 2026')).toBe('sniezka-lomnica-2026')
  })
})
