import { describe, expect, it } from 'vitest'
import { MOODS, moodOf } from './model/mood'
import { BUILT_IN_STYLES, registerMapStyle } from './model/styles'
import { mapTone } from './store'
import { DEFAULT_MAP } from './types'

describe('map moods', () => {
  it('recognises a mood by its settings, and none once one is changed', () => {
    const ghost = { ...DEFAULT_MAP, ...MOODS[1].mood }
    expect(moodOf(ghost)).toBe('ghost')
    expect(moodOf({ ...ghost, vignette: 0.5 })).toBeNull()
  })

  it('a faded map takes the tone of the colour under it, so the route turns light on a dark ground', () => {
    BUILT_IN_STYLES.forEach(registerMapStyle)
    expect(mapTone(DEFAULT_MAP)).toBe('light')
    expect(mapTone({ ...DEFAULT_MAP, opacity: 0.25, ground: '#1f1a14' })).toBe('dark')
    expect(mapTone({ ...DEFAULT_MAP, opacity: 0.9, ground: '#1f1a14' })).toBe('light')
  })
})
