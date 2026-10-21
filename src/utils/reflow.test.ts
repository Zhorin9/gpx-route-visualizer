import { describe, expect, it } from 'vitest'
import { DEFAULT_SLIDES } from '../store/defaults'
import type { DocumentState } from '../store/types'
import { manualFlags, reflowTo } from './reflow'

type State = Parameters<typeof reflowTo>[0]

const state = (over: Partial<State> = {}): State => ({
  aspectKey: '4:5',
  texts: [{ id: 1, x: 100, y: 300 } as DocumentState['texts'][number]],
  placements: { stats: { x: 0, y: 200 } },
  routeTransform: { x: 20, y: 40, scaleX: 1.2, scaleY: 1.2, rotation: 0 },
  sourceLayout: null,
  layoutOverrides: {},
  slides: DEFAULT_SLIDES,
  ...over,
})

const step = (s: State, key: State['aspectKey']): State => ({ ...s, ...reflowTo(s, key) }) as State

describe('reflow between formats', () => {
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
