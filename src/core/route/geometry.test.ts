import { describe, expect, it } from 'vitest'
import { decimateIndexed, pointAt, posAtDistance } from '../../utils/geometry'
import { buildRouteGeometry, type RouteGeometryInput } from './geometry'
import type { RoutePart } from '../../types'

// A wiggly track: 400 points, one km apart.
const N = 400
const projected = new Float64Array(N * 2)
const cum = new Float64Array(N)
for (let i = 0; i < N; i++) {
  projected[i * 2] = i * 2.5
  projected[i * 2 + 1] = 300 + Math.sin(i / 9) * 120
  cum[i] = i
}

const base: RouteGeometryInput = {
  projected,
  cum,
  range: { start: 20, end: 380 },
  progress: 100,
  days: [],
  shape: 'natural',
  simplify: 40,
  head: null,
}

// The split as it was done before the route was taken apart into geometry and painter.
function legacySplit(progress: number) {
  const { start, end } = base.range
  const target = cum[start] + ((cum[end] - cum[start]) * progress) / 100
  const splitPos = posAtDistance(cum, start, end, target)
  const splitIdx = Math.floor(splitPos)
  const split = pointAt(projected, splitPos)
  const completed = decimateIndexed(projected, start, splitIdx).points
  completed.push(split.x, split.y)
  const remaining = [split.x, split.y].concat(splitIdx + 1 <= end ? decimateIndexed(projected, splitIdx + 1, end).points : [])
  return { completed, remaining }
}

const day = (id: number, startIdx: number, endIdx: number, visible = true): RoutePart => ({
  id,
  name: `d${id}`,
  sourceKey: `d${id}`,
  startIdx,
  endIdx,
  color: `#00000${id}`,
  dashed: false,
  visible,
})

describe('buildRouteGeometry', () => {
  it('draws the whole range at full progress', () => {
    const g = buildRouteGeometry(base)
    expect(g.segments).toHaveLength(1)
    expect(g.segments[0].role).toBe('completed')
    expect(g.segments[0].points).toEqual(decimateIndexed(projected, 20, 380).points)
    expect(g.head).toBeNull()
  })

  it('splits by progress exactly as before', () => {
    const g = buildRouteGeometry({ ...base, progress: 37 })
    const legacy = legacySplit(37)
    expect(g.segments.find((s) => s.role === 'completed')!.points).toEqual(legacy.completed)
    expect(g.segments.find((s) => s.role === 'remaining')!.points).toEqual(legacy.remaining)
    // Ghost first, so the drawn part is painted over it.
    expect(g.segments[0].role).toBe('remaining')
  })

  it('keeps a track position for every vertex', () => {
    const g = buildRouteGeometry({ ...base, progress: 50 })
    for (const s of g.segments) {
      expect(s.positions).toHaveLength(s.points.length / 2)
      for (let i = 1; i < s.positions.length; i++) expect(s.positions[i]).toBeGreaterThanOrEqual(s.positions[i - 1])
    }
  })

  it('lets the animation head override progress', () => {
    const g = buildRouteGeometry({ ...base, progress: 10, head: 200.5 })
    const done = g.segments.find((s) => s.role === 'completed')!
    expect(done.positions[done.positions.length - 1]).toBe(200.5)
    expect(g.head?.pos).toBe(200.5)
  })

  it('draws visible days in their own segments and ignores static progress there', () => {
    const days = [day(1, 0, 199), day(2, 200, 399), day(3, 0, 0, false)]
    const g = buildRouteGeometry({ ...base, days, progress: 30 })
    expect(g.segments.map((s) => [s.role, s.day?.id])).toEqual([
      ['completed', 1],
      ['completed', 2],
    ])
  })

  it('cuts days at the animation head, ghosts first', () => {
    const days = [day(1, 0, 199), day(2, 200, 399)]
    const g = buildRouteGeometry({ ...base, days, head: 100 })
    expect(g.segments.map((s) => [s.role, s.day?.id])).toEqual([
      ['remaining', 1],
      ['remaining', 2],
      ['completed', 1],
    ])
  })

  it('spreads track positions over a schematic line', () => {
    const g = buildRouteGeometry({ ...base, shape: 'schematic' })
    const [seg] = g.segments
    expect(seg.square).toBe(true)
    expect(seg.positions[0]).toBe(20)
    expect(seg.positions[seg.positions.length - 1]).toBeCloseTo(380)
  })
})
