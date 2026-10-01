import { describe, expect, it } from 'vitest'
import { formatDuration, formatElevation, formatKm, slugify } from './format'

describe('format', () => {
  it('uses Polish decimal separators', () => {
    expect(formatKm(15.678, 1)).toBe('15,7 km')
    expect(formatKm(15.678, 0)).toBe('16 km')
  })

  it('rounds elevation to the chosen step', () => {
    expect(formatElevation(1237, 50)).toBe('+1250 m')
  })

  it('formats durations', () => {
    expect(formatDuration(0)).toBe('--')
    expect(formatDuration(45 * 60_000)).toBe('45m')
    expect(formatDuration(165 * 60_000)).toBe('2h 45m')
  })

  it('slugifies Polish names for file names', () => {
    expect(slugify('Śnieżka — Łomnica 2026')).toBe('sniezka-lomnica-2026')
  })
})
