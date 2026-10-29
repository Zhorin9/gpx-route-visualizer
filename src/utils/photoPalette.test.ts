import { describe, expect, it } from 'vitest'
import { THEME_VARIANTS, assignRoles, dominant, mergeClose, oklchToHex, photoTheme, rgbToOklch, sortPixels, type Sample } from './photoPalette'
import { contrastRatio as contrast } from './color'

// A photo set as its main colours, each with a weight and small deterministic variation.
function scene(colors: [number, number, number, number][]): Sample[] {
  return colors.flatMap(([r, g, b, n]) =>
    Array.from({ length: n }, (_, i) => rgbToOklch(r + ((i * 7) % 11) - 5, g + ((i * 5) % 9) - 4, b + ((i * 3) % 7) - 3)),
  )
}

const SETS: Record<string, Sample[]> = {
  morze: scene([[30, 110, 170, 500], [90, 170, 210, 300], [215, 195, 150, 250], [40, 70, 90, 100]]),
  gory: scene([[60, 120, 50, 300], [80, 140, 60, 250], [120, 125, 135, 250], [110, 160, 220, 300]]),
  miasto: scene([[150, 80, 60, 300], [110, 110, 125, 300], [200, 160, 60, 150], [60, 70, 100, 250]]),
  las: scene([[40, 90, 40, 500], [70, 120, 50, 300], [100, 70, 40, 250]]),
  zima: scene([[200, 215, 235, 600], [150, 175, 210, 300], [90, 100, 120, 150]]),
}

describe('photo palette', () => {
  it('converts to OKLCH and back', () => {
    expect(rgbToOklch(255, 255, 255).L).toBeCloseTo(1, 3)
    expect(rgbToOklch(128, 128, 128).C).toBeLessThan(0.001)
    const c = rgbToOklch(40, 120, 200)
    expect(oklchToHex(c)).toBe('#2878c8')
  })

  it('reads every 2nd pixel and keeps greys apart from colour', () => {
    const px = (r: number, g: number, b: number, a = 255) => [r, g, b, a, 0, 0, 0, 0]
    const data = [...px(200, 40, 40), ...px(200, 40, 40, 0), ...px(255, 255, 255), ...px(5, 5, 5), ...px(128, 128, 128)]
    const colored: Sample[] = [], neutral: Sample[] = []
    sortPixels(data, colored, neutral)
    expect(colored).toHaveLength(1)
    expect(neutral).toHaveLength(1)
  })

  it('gives the same four colours every time', () => {
    const once = mergeClose(dominant(SETS.gory))
    expect(mergeClose(dominant(SETS.gory.slice().reverse()))).toEqual(once)
    expect(once).toHaveLength(4)
  })

  it('finds greens, rock and sky in the mountains, not four greens', () => {
    const colors = mergeClose(dominant(SETS.gory))
    const greens = colors.filter((c) => c.h > 110 && c.h < 160 && c.C > 0.05)
    expect(greens.length).toBeLessThanOrEqual(2)
    expect(colors.some((c) => c.h > 220 && c.h < 270 && c.C > 0.05)).toBe(true)
  })

  it('makes up four colours from fewer', () => {
    const colors = mergeClose(dominant(scene([[40, 120, 60, 400]])))
    expect(colors).toHaveLength(4)
    expect(new Set(colors.map((c) => c.L.toFixed(2))).size).toBe(4)
  })

  it.each(Object.keys(SETS))('%s: readable text and a visible route in every variant', (name) => {
    const palette = { colors: mergeClose(dominant(SETS[name])), grey: false }
    THEME_VARIANTS.forEach((_, i) => {
      const theme = photoTheme(palette, i)
      expect(contrast(theme.text, theme.bg)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(theme.route, theme.bg)).toBeGreaterThanOrEqual(3)
    })
  })

  it('boosts a dull route and keeps the accent 40° away from it', () => {
    const colors = mergeClose(dominant(SETS.gory))
    const roles = assignRoles(colors, THEME_VARIANTS[0])
    expect(roles.route.C).toBeGreaterThanOrEqual(0.08)
    const gap = Math.abs(roles.route.h - roles.accent.h)
    expect(Math.min(gap, 360 - gap)).toBeGreaterThanOrEqual(40)
    expect(roles.text.h).toBe(roles.accent.h)
    expect(roles.text.C).toBeGreaterThan(0.02)
    expect(roles.bg.L).toBe(0.96)
    expect(assignRoles(colors, THEME_VARIANTS[2]).bg.L).toBe(0.18)
  })
})
