import { describe, expect, it } from 'vitest'
import { contrastRatio } from './color'
import { STICKER_COLORS, stickerColor } from './sticker'

describe('sticker colour', () => {
  it('gives slide i of a series the colour (start + i) mod 6', () => {
    const settings = { mode: 'series' as const, color: STICKER_COLORS[4].hex }
    expect([0, 1, 2, 7].map((i) => stickerColor(settings, i, null))).toEqual([4, 5, 0, 5].map((i) => STICKER_COLORS[i].hex))
  })

  // The set is all light colours: on light paper none reaches 3:1, and the dark outline carries it.
  it('picks the colour that stands out at least 3:1 from a dark or mid background', () => {
    for (const bg of ['#3a2e20', '#1b1b1b', '#6e5638', '#123a63']) {
      const color = stickerColor({ mode: 'photo', color: STICKER_COLORS[0].hex }, 0, bg)
      expect(contrastRatio(color, bg)).toBeGreaterThanOrEqual(3)
    }
  })
})
