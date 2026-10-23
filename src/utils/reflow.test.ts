import { describe, expect, it } from 'vitest'
import { DEFAULT_SLIDES } from '../store/defaults'
import type { DocumentState } from '../store/types'
import { manualFlags, reflowTo, slideCountIn } from './reflow'

type State = Parameters<typeof reflowTo>[0]

const state = (over: Partial<State> = {}): State => ({
  aspectKey: '4:5',
  texts: [{ id: 1, x: 100, y: 300, text: 'Napis', fontSize: 40 } as DocumentState['texts'][number]],
  placements: { stats: { x: 0, y: 200 } },
  routeTransform: { x: 20, y: 40, scaleX: 1.2, scaleY: 1.2, rotation: 0 },
  sourceLayout: null,
  layoutOverrides: {},
  slides: DEFAULT_SLIDES,
  parkedSlides: [],
  ...over,
})

const step = (s: State, key: State['aspectKey']): State => ({ ...s, ...reflowTo(s, key) }) as State

describe('reflow between formats', () => {
  it('shows one slide in a format without a carousel and brings the others back', () => {
    const photo = (photoId: number) => ({ photoId, offsetX: 0, offsetY: 0, zoom: 1 })
    const slides = [1, 2, 3].map((id) => ({ layoutKey: 'g1' as const, slots: { 0: photo(id) } }))
    const wide = step(state({ slides }), '16:9')
    expect(wide.slides).toHaveLength(1)
    expect(slideCountIn(wide, '16:9')).toBe(1)
    expect(slideCountIn(wide, '4:5')).toBe(3)
    const back = step(step(wide, '9:16'), '4:5')
    expect(back.slides.map((s) => s.slots[0].photoId)).toEqual([1, 2, 3])
    expect(back.parkedSlides).toEqual([])
  })

  it('comes back to the same layout after a round trip', () => {
    const start = state()
    const back = step(step(step(start, '9:16'), '1:1'), '4:5')
    expect(back.routeTransform).toEqual(start.routeTransform)
    expect(back.texts[0]).toMatchObject({ x: 100, y: 300 })
    expect(back.placements).toEqual(start.placements)
  })

  it('moves the route only vertically, in proportion to the frame height', () => {
    const story = step(state(), '9:16')
    expect(story.routeTransform).toEqual({ x: 20, y: 40 * (1920 / 1350), scaleX: 1.2, scaleY: 1.2, rotation: 0 })
    expect(manualFlags(story).route).toBe(false)
  })

  it('remembers a route moved by hand in another format', () => {
    const story = step(state(), '9:16')
    const moved = { ...story, routeTransform: { ...story.routeTransform, x: 300 } }
    expect(manualFlags(moved).route).toBe(true)
    const again = step(step(moved, '4:5'), '9:16')
    expect(again.routeTransform.x).toBe(300)
  })
})

describe('reflow into the landscape format', () => {
  const text = (id: number, y: number, extra = {}) => ({ id, x: 100, y, text: 'Napis', fontSize: 40, ...extra }) as DocumentState['texts'][number]
  const portrait = () =>
    state({ texts: [text(1, 60, { role: 'title' }), text(2, 900), text(3, 500, { text: 'Dwie\nlinie' })], placements: { stats: { x: 0, y: 200 } } })

  it('puts the title on top of the side column and stacks the texts at its foot in portrait order', () => {
    const wide = step(portrait(), '16:9')
    const [title, lower, upper] = [1, 2, 3].map((id) => wide.texts.find((t) => t.id === id)!)
    expect(title).toMatchObject({ x: 1152, y: 140 })
    expect(upper.x).toBe(1152)
    expect(upper.y + 80).toBeLessThan(lower.y)
    expect(lower.y + 40).toBeLessThanOrEqual(1080 - 150 - 270)
    expect(wide.placements.stats).toEqual({ x: null, y: null })
    expect(wide.routeTransform).toEqual({ x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 })
    expect(manualFlags(wide)).toEqual({ elements: {}, route: false, texts: {} })
  })

  it('comes back to the portrait layout unchanged', () => {
    const start = portrait()
    const back = step(step(start, '16:9'), '4:5')
    expect(back.texts).toEqual(start.texts)
    expect(back.placements).toEqual(start.placements)
    expect(back.routeTransform).toEqual(start.routeTransform)
  })

  it('keeps hand placement in 16:9 and in 9:16 apart', () => {
    const wide = step(portrait(), '16:9')
    const movedWide = { ...wide, texts: wide.texts.map((t) => (t.id === 2 ? { ...t, x: 400, y: 300 } : t)) }
    expect(manualFlags(movedWide).texts).toEqual({ 2: true })
    const story = step(step(movedWide, '4:5'), '9:16')
    const movedStory = { ...story, texts: story.texts.map((t) => (t.id === 2 ? { ...t, x: 10 } : t)) }
    const wideAgain = step(step(movedStory, '1:1'), '16:9')
    expect(wideAgain.texts.find((t) => t.id === 2)).toMatchObject({ x: 400, y: 300 })
    expect(step(wideAgain, '9:16').texts.find((t) => t.id === 2)!.x).toBe(10)
  })

  it('gives a text added in 16:9 a place in the portrait formats', () => {
    const wide = step(portrait(), '16:9')
    const added = { ...wide, texts: [...wide.texts, text(4, 500, { x: 1300 })] }
    const back = step(added, '4:5')
    expect(back.texts.find((t) => t.id === 4)).toMatchObject({ x: 148, y: 625 })
    expect(step(back, '16:9').texts.find((t) => t.id === 4)).toMatchObject({ x: 1300, y: 500 })
  })
})
