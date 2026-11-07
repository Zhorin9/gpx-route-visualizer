import { describe, expect, it } from 'vitest'
import { ICONS, iconPaint } from './icons'

describe('place icons', () => {
  it('has 23 icons, each with something to draw', () => {
    expect(new Set(ICONS.map((i) => i.id)).size).toBe(23)
    for (const icon of ICONS) expect(icon.fill || icon.line).toBeTruthy()
  })

  it('paints each finish as the style board shows it', () => {
    expect(iconPaint('sticker', '#f2b8f5', '#fff')).toEqual({ fill: '#f2b8f5', stroke: '#241a26', shadow: true })
    expect(iconPaint('line', '#ffffff', '#fff')).toEqual({ fill: undefined, stroke: '#ffffff', shadow: false })
    expect(iconPaint('ink', '#f2b8f5', '#efe6d2')).toEqual({ fill: '#efe6d2', stroke: '#241a26', shadow: false })
  })
})
