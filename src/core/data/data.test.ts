import { describe, expect, it } from 'vitest'
import { cumulativeDistanceKm } from '../../utils/gpx'
import { COLOR_BINS, PALETTES, colorScale, mixStops, paletteBins } from './palettes'
import { percentile, windowMean, windowSlope } from './smoothing'
import { dataSeries, dataSource, gradeSource, speedSource } from './sources'
import type { GpxPoint, GpxTrack } from '../../types'

// Due north, 10 m apart (0.00009° of latitude ≈ 10 m).
const STEP_DEG = 10 / 111_195
const track = (n: number, f: (i: number) => Partial<GpxPoint>): GpxTrack => ({
  name: null,
  points: Array.from({ length: n }, (_, i) => ({ lat: 50 + STEP_DEG * i, lon: 15, ele: 0, time: null, ...f(i) })),
})

describe('smoothing', () => {
  it('averages over a window measured on the axis, skipping gaps', () => {
    const out = windowMean([0, 10, NaN, 30, 40], [0, 1, 2, 3, 10], 1.5)
    expect(Array.from(out)).toEqual([5, 5, 20, 30, 40])
  })

  it('measures slope across the window', () => {
    const axis = [0, 1, 2, 3, 4, 5]
    const values = axis.map((x) => 3 * x)
    expect(Array.from(windowSlope(values, axis, 1))).toEqual([3, 3, 3, 3, 3, 3])
  })

  it('takes percentiles of finite values only', () => {
    const values = [5, NaN, 1, 3, 2, 4, Infinity]
    expect(percentile(values, 0)).toBe(1)
    expect(percentile(values, 50)).toBe(3)
    expect(percentile(values, 100)).toBe(5)
  })
})

describe('data sources', () => {
  it('measures a steady 8% climb as 8%', () => {
    const t = track(200, (i) => ({ ele: 100 + i * 0.8 }))
    const grade = gradeSource.compute(t, cumulativeDistanceKm(t.points))
    expect(grade[100]).toBeCloseTo(8, 0)
  })

  it('measures a steady 18 km/h ride as 18 km/h', () => {
    // 10 m every 2 s.
    const t = track(300, (i) => ({ time: i * 2000 }))
    const speed = speedSource.compute(t, cumulativeDistanceKm(t.points))
    expect(speed[150]).toBeCloseTo(18, 0)
  })

  it('says why a source cannot be used', () => {
    const flat = track(5, () => ({}))
    expect(dataSource('speed').unavailable(flat)).toMatch(/czasu/)
    expect(dataSource('heartRate').unavailable(flat)).toMatch(/tętna/)
    expect(dataSource('grade').unavailable(flat)).toMatch(/wysokości/)
    expect(dataSource('heartRate').unavailable(track(5, () => ({ hr: 120 })))).toBeNull()
  })

  it('computes a series once per track and distance array', () => {
    const t = track(50, (i) => ({ ele: i }))
    const cum = cumulativeDistanceKm(t.points)
    expect(dataSeries(t, cum, 'elevation')).toBe(dataSeries(t, cum, 'elevation'))
    expect(dataSeries(t, cumulativeDistanceKm(t.points), 'elevation')).not.toBe(dataSeries(t, cum, 'elevation'))
  })
})

describe('palettes', () => {
  it('mixes moved gradient stops, holding the end colours past the ends', () => {
    const stops = [
      { at: 0.2, color: '#000000' },
      { at: 0.6, color: '#ffffff' },
    ]
    expect(mixStops(stops, 0)).toBe('#000000')
    expect(mixStops(stops, 0.4)).toBe('#808080')
    expect(mixStops(stops, 1)).toBe('#ffffff')
  })

  it('quantises into bins and runs low to high', () => {
    for (const p of PALETTES) {
      const bins = paletteBins(p, false)
      expect(bins).toHaveLength(COLOR_BINS)
      expect(bins[0]).toBe(p.stops[0])
      expect(bins[bins.length - 1]).toBe(p.stops[p.stops.length - 1])
    }
  })

  it('maps values over the domain, clamps outside it and can be reversed', () => {
    const p = PALETTES[0]
    const scale = colorScale(p, [10, 20], false)
    expect(scale(-5)).toBe(p.stops[0])
    expect(scale(99)).toBe(p.stops[p.stops.length - 1])
    expect(colorScale(p, [10, 20], true)(10)).toBe(p.stops[p.stops.length - 1])
  })
})
