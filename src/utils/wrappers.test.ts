import { describe, expect, it } from 'vitest'
import { FORMATS, FORMAT_ORDER } from '../core/formats/registry'
import { DEFAULT_WRAPPER } from '../store/defaults'
import { contentBox, dateLines, formatDateSpan, fromBox, intoBox, perforation, postmarkText, routeFields, slideBox, WRAPPER_OPTIONS } from './wrappers'
import type { GpxPoint, RoutePart, Waypoint, Wrapper } from '../types'

const fields = (patch: Partial<Wrapper['fields']> = {}) => ({ ...DEFAULT_WRAPPER.fields, ...patch })

// The four corners of the box, turned the way it is drawn.
function corners(b: ReturnType<typeof contentBox>, w: number, h: number) {
  return [[0, 0], [w, 0], [0, h], [w, h]].map(([x, y]) => intoBox(b, w, h, x, y))
}

describe('contentBox', () => {
  it('keeps the slide’s proportions and stays on the slide in every format', () => {
    for (const key of FORMAT_ORDER) {
      const { w, h } = FORMATS[key]
      for (const { id } of WRAPPER_OPTIONS) {
        const b = contentBox(id, w, h, fields({ note: 'Podpis' }))
        expect(b.w / b.h).toBeCloseTo(w / h, 6)
        for (const p of corners(b, w, h)) {
          expect(p.x).toBeGreaterThanOrEqual(-1e-6)
          expect(p.y).toBeGreaterThanOrEqual(-1e-6)
          expect(p.x).toBeLessThanOrEqual(w + 1e-6)
          expect(p.y).toBeLessThanOrEqual(h + 1e-6)
        }
      }
    }
  })

  it('leaves the content whole without a wrapper or under a postmark', () => {
    expect(contentBox('none', 1080, 1350, fields())).toEqual({ x: 0, y: 0, w: 1080, h: 1350, rotation: 0 })
    expect(contentBox('postmark', 1080, 1350, fields())).toEqual({ x: 0, y: 0, w: 1080, h: 1350, rotation: 0 })
  })

  it('gives the album content back the room of an empty caption', () => {
    expect(contentBox('album', 1080, 1350, fields()).h).toBeGreaterThan(contentBox('album', 1080, 1350, fields({ note: 'Podpis' })).h)
  })

  it('maps points into the box and back', () => {
    const b = contentBox('album', 1080, 1920, fields())
    const drawn = intoBox(b, 1080, 1920, 200, 900)
    const p = fromBox(b, 1080, 1920, drawn.x, drawn.y)
    expect(p.x).toBeCloseTo(200, 6)
    expect(p.y).toBeCloseTo(900, 6)
  })
})

describe('slideBox', () => {
  const slides = [{ layoutKey: 'g1' as const, slots: {} }, { layoutKey: 'g1' as const, slots: {}, wrapperOff: true }]
  const wrapper = { ...DEFAULT_WRAPPER, id: 'stamp' as const }

  it('skips a slide excepted from the wrapper and a panorama', () => {
    expect(slideBox({ wrapper, slides, carouselKind: 'slides' }, 0, 1080, 1350)).not.toBeNull()
    expect(slideBox({ wrapper, slides, carouselKind: 'slides' }, 1, 1080, 1350)).toBeNull()
    expect(slideBox({ wrapper, slides: [slides[0], slides[0]], carouselKind: 'panorama' }, 0, 1080, 1350)).toBeNull()
  })
})

describe('perforation', () => {
  it('fits a whole number of holes along an edge, none at the corners', () => {
    const holes = perforation(1000, 43)
    const step = 1000 / holes.length
    expect(holes[0]).toBeCloseTo(step / 2)
    expect(1000 - holes[holes.length - 1]).toBeCloseTo(step / 2)
  })
})

describe('fields', () => {
  it('writes a date or a span of dates', () => {
    expect(formatDateSpan(new Date(2026, 7, 12), new Date(2026, 7, 12))).toBe('12.08.2026')
    expect(formatDateSpan(new Date(2026, 7, 12), new Date(2026, 7, 15))).toBe('12–15.08.2026')
    expect(formatDateSpan(new Date(2026, 7, 28), new Date(2026, 8, 2))).toBe('28.08–02.09.2026')
    expect(dateLines('12–15.08.2026')).toEqual(['12–15.08', '2026'])
  })

  it('cuts long names round the postmark', () => {
    expect(postmarkText(fields({ place: 'Monte Tuttavista', title: 'Sardynia' }))).toBe('MONTE TUTTAVISTA · SARDYNIA')
    expect(postmarkText(fields({ place: 'A'.repeat(30) }))).toHaveLength(24)
  })

  it('reads the places and dates from the route', () => {
    const points: GpxPoint[] = [
      { lat: 0, lon: 0, ele: 0, time: new Date(2026, 7, 12, 9).getTime() },
      { lat: 0, lon: 1, ele: 0, time: new Date(2026, 7, 15, 18).getTime() },
    ]
    const label = (id: number, trackPos: number, text: string) => ({ id, trackPos, text }) as Waypoint
    const waypoints = [label(1, 1, 'Arbatax'), label(2, 0, 'Cagliari'), label(3, 0.5, 'Miejscowość')]
    expect(routeFields('Sardynia', points, [], waypoints)).toEqual({ title: 'Sardynia', place: 'Arbatax', from: 'Cagliari', to: 'Arbatax', date: '12–15.08.2026', note: '' })

    const stop = (name: string, via = false) => ({ id: 0, name, lat: 0, lon: 0, via })
    const part = { plan: { mode: 'car', stops: [stop('Kraków'), stop('Tarnów', true), stop('Rzeszów')] } } as RoutePart
    expect(routeFields(null, null, [part], waypoints)).toMatchObject({ from: 'Kraków', to: 'Rzeszów', date: '' })
  })
})
