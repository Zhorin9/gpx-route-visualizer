import { describe, expect, it } from 'vitest'
import { textShadow } from './shadows'

describe('text shadow', () => {
  it('sets letters off the ground: dark under light letters, light under dark ones', () => {
    expect(textShadow('#f3f2f2').shadowColor).toBe('#000000')
    expect(textShadow('#2d2b2b').shadowColor).toBe('#ffffff')
  })
})
