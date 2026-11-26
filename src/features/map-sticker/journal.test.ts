import { describe, expect, it } from 'vitest'
import { INITIAL_DOCUMENT } from '../../store/document'
import { DEFAULT_SLIDES } from '../../store/defaults'
import { FORMATS } from '../../core/formats/registry'
import { journalCarousel } from './journal'

const slides = Array.from({ length: 4 }, (_, i) => ({ ...DEFAULT_SLIDES[0], layoutKey: i === 0 ? ('c1' as const) : DEFAULT_SLIDES[0].layoutKey }))
const doc = { ...INITIAL_DOCUMENT, aspectKey: '4:5' as const, slides }
const { w } = FORMATS['4:5']

describe('travel journal carousel', () => {
  it('puts the whole route over the edge of slides 1 and 2, under the framed photo', () => {
    const layout = journalCarousel(doc, 4, ['slot:0:1', 'element:stats', 'text:1'])
    const whole = layout.mapStickers[0]
    const x = layout.placements[`mapSticker:${whole.id}`].x!
    expect(whole.scope).toEqual({ kind: 'all' })
    expect(x).toBeLessThan(w)
    expect(x + whole.size * w).toBeGreaterThan(w)
    expect(layout.layerOrder.indexOf(`element:mapSticker:${whole.id}`)).toBeLessThan(layout.layerOrder.indexOf('slot:0:1'))
  })

  it('keeps the whole route on the first slide in a series, whose slides are separate pictures', () => {
    const layout = journalCarousel({ ...doc, carouselKind: 'slides' }, 4, [])
    const whole = layout.mapStickers[0]
    const x = layout.placements[`mapSticker:${whole.id}`].x!
    expect(x + whole.size * w).toBeLessThanOrEqual(w)
  })

  it('gives each slide from the third on a close-up of its own day', () => {
    const layout = journalCarousel(doc, 4, [])
    const days = layout.mapStickers.slice(1)
    expect(days.map((m) => m.scope)).toEqual([
      { kind: 'day', day: 2, only: false },
      { kind: 'day', day: 3, only: false },
    ])
    days.forEach((m, i) => {
      const x = layout.placements[`mapSticker:${m.id}`].x!
      expect(Math.floor(x / w)).toBe(i + 2)
      expect(m.zoom).toBeGreaterThan(1)
    })
  })

  it('adds no day close-ups for a route without days', () => {
    expect(journalCarousel(doc, 0, []).mapStickers).toHaveLength(1)
  })
})
