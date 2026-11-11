import { describe, expect, it } from 'vitest'
import { mapTone } from './store'
import { DEFAULT_MAP } from './types'

describe('map moods', () => {

  it('a faded map takes the tone of the colour under it, so the route turns light on a dark ground', () => {
    expect(mapTone(DEFAULT_MAP)).toBe('light')
    expect(mapTone({ ...DEFAULT_MAP, opacity: 0.25, ground: '#1f1a14' })).toBe('dark')
    expect(mapTone({ ...DEFAULT_MAP, opacity: 0.9, ground: '#1f1a14' })).toBe('light')
  })
})
