import { describe, expect, it } from 'vitest'
import { iconPaint } from './icons'

describe('place icons', () => {
  it('paints each finish as the style board shows it', () => {
    expect(iconPaint('sticker', '#f2b8f5', '#fff')).toEqual({ fill: '#f2b8f5', stroke: '#241a26', shadow: true })
    expect(iconPaint('line', '#ffffff', '#fff')).toEqual({ fill: undefined, stroke: '#ffffff', shadow: false })
    expect(iconPaint('ink', '#f2b8f5', '#efe6d2')).toEqual({ fill: '#efe6d2', stroke: '#241a26', shadow: false })
  })
})
