import { describe, expect, it } from 'vitest'
import { formatDistance, formatGain, formatHeight, formatSpeed } from './units'

// Intl separates with no-break spaces; pl-PL groups thousands only from five digits up.
const plain = (s: string) => s.replace(/\s/g, ' ')

describe('units', () => {
  it('formats metric values as before', () => {
    expect(formatDistance(18.62, 'metric', 1)).toBe('18,6 km')
    expect(plain(formatGain(1234, 'metric', 5))).toBe('+1235 m')
    expect(formatSpeed(24.25, 'metric')).toBe('24,3 km/h')
  })

  it('converts to miles, feet and mph', () => {
    expect(formatDistance(16.09344, 'imperial', 1)).toBe('10,0 mi')
    expect(plain(formatHeight(1000, 'imperial'))).toBe('3281 ft')
    expect(formatSpeed(16.09344, 'imperial')).toBe('10,0 mph')
  })
})
