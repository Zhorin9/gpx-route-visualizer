import { describe, expect, it } from 'vitest'
import { DEFAULT_STATS_CONTENT, DEFAULT_STATS_STYLE } from '../../../store/defaults'
import { buildChips } from './definitions'
import { STATS_ARRANGEMENTS, arrangementFor } from './registry'
import type { ArrangeInput } from './arrangements'
import type { RangeStats, StatsContent } from '../../../types'

const stats: RangeStats = { distanceKm: 42.195, elevationGainM: 512, durationMs: 4 * 3_600_000, movingMs: 3 * 3_600_000, maxElevationM: 1234 }
// Day, distance, climbing and time: the set the order and unit tests start from.
const FOUR: StatsContent['visible'] = { day: true, distance: true, elevation: true, time: true, movingTime: false, avgSpeed: false, maxElevation: false }
const content = (patch: Partial<StatsContent> = {}): StatsContent => ({ ...DEFAULT_STATS_CONTENT, visible: FOUR, ...patch })
const plain = (s: string) => s.replace(/\s/g, ' ')

describe('stat definitions', () => {
  it('shows distance, total time and average speed by default', () => {
    expect(buildChips({ stats, content: DEFAULT_STATS_CONTENT }).map((c) => c.text)).toEqual(['42,2 km', '4h 0m', '14,1 km/h'])
  })

  it('builds the chips in order', () => {
    expect(buildChips({ stats, content: content() }).map((c) => c.text)).toEqual(['DZIEŃ 1', '42,2 km', '+512 m', '4h 0m'])
  })

  it('follows the chosen order and shows the new stats', () => {
    const visible = { ...FOUR, day: false, movingTime: true, avgSpeed: true, maxElevation: true }
    const order = ['avgSpeed', 'distance', 'movingTime', 'day', 'elevation', 'time', 'maxElevation'] as StatsContent['order']
    const chips = buildChips({ stats, content: content({ visible, order }) })
    expect(chips.map((c) => c.key)).toEqual(['avgSpeed', 'distance', 'movingTime', 'elevation', 'time', 'maxElevation'])
    expect(chips[0].text).toBe('14,1 km/h')
    expect(chips[2].text).toBe('3h 0m')
    expect(plain(chips[5].text)).toBe('1234 m')
  })

  it('switches every figure to imperial units', () => {
    const visible = { ...FOUR, day: false, time: false, avgSpeed: true }
    const chips = buildChips({ stats, content: content({ visible, units: 'imperial' }) })
    expect(chips.map((c) => plain(c.text))).toEqual(['26,2 mi', '+1680 ft', '8,7 mph'])
  })

  it('drops time-based stats when the file has no timestamps, unless typed by hand', () => {
    const noTime = { ...stats, durationMs: 0, movingMs: 0 }
    const visible = { ...FOUR, movingTime: true }
    expect(buildChips({ stats: noTime, content: content({ visible }) }).map((c) => c.key)).toEqual(['day', 'distance', 'elevation'])
    const typed = content({ visible, overrides: { ...DEFAULT_STATS_CONTENT.overrides, time: '5h' } })
    expect(buildChips({ stats: noTime, content: typed }).map((c) => c.key)).toContain('time')
  })
})

describe('arrangements', () => {
  const chips = buildChips({ stats, content: content() })
  const input = (patch: Partial<ArrangeInput['style']> = {}): ArrangeInput => ({
    chips,
    style: { ...DEFAULT_STATS_STYLE, ...patch },
    fontStyle: 'normal',
    frameW: 1080,
    chipOffsets: {},
    measure: (text, _f, size) => text.length * size * 0.5,
  })

  it('keeps every text inside the box', () => {
    for (const strategy of STATS_ARRANGEMENTS) {
      for (const stretch of [true, false]) {
        const box = strategy.arrange(input({ arrangement: strategy.id, stretch }))
        for (const t of box.texts) {
          expect(t.x, `${strategy.id} ${t.id}`).toBeGreaterThanOrEqual(-0.001)
          expect(t.y + t.fontSize, `${strategy.id} ${t.id}`).toBeLessThanOrEqual(box.height + 0.001)
        }
      }
    }
  })

  it('wraps the grid into two columns', () => {
    const box = arrangementFor('grid').arrange(input({ arrangement: 'grid' }))
    const values = box.texts.filter((t) => !t.id.endsWith(':label'))
    expect(new Set(values.map((t) => t.x)).size).toBe(2)
    expect(new Set(values.map((t) => t.y)).size).toBe(2)
  })

  it('puts the chosen figure large and can hide the rest', () => {
    const box = arrangementFor('hero').arrange(input({ arrangement: 'hero', heroKey: 'elevation' }))
    const hero = box.texts.find((t) => t.id === 'elevation')!
    expect(hero.fontSize).toBeGreaterThan(DEFAULT_STATS_STYLE.fontSize * 2)
    expect(box.texts.filter((t) => !t.id.endsWith(':label'))).toHaveLength(chips.length)
    const alone = arrangementFor('hero').arrange(input({ arrangement: 'hero', heroKey: 'elevation', heroSecondary: false }))
    expect(alone.texts.map((t) => t.id)).toEqual(['elevation:label', 'elevation'])
  })

  it('falls back to columns for an unknown arrangement', () => {
    expect(arrangementFor('nope' as never).id).toBe('columns')
  })
})
