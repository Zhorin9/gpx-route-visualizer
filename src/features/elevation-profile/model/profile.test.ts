import { describe, expect, it } from 'vitest'
import { detectClimbs } from './climbs'
import { distanceFraction, sampleByDistance, smoothSamples } from './profile'

// One point every 100 m.
const km = (n: number) => Float64Array.from({ length: n }, (_, i) => i * 0.1)

describe('detectClimbs', () => {
  it('finds a climb from its low point to the summit', () => {
    // Flat, then 1 km at 6%, then down.
    const ele = [...Array(10).fill(100), ...Array.from({ length: 11 }, (_, i) => 100 + i * 6), ...Array.from({ length: 10 }, (_, i) => 154 - i * 6)]
    const [climb, ...rest] = detectClimbs(ele, km(ele.length), 0, ele.length - 1)
    expect(rest).toEqual([])
    expect(climb.startIdx).toBe(10)
    expect(climb.endIdx).toBe(20)
    expect(climb.gainM).toBe(60)
    expect(climb.avgGrade).toBeCloseTo(6)
  })

  it('starts where the road tilts up, not at the bottom of a long gentle approach', () => {
    // 3 km at 0.5%, then 1 km at 7%.
    const ele = [...Array.from({ length: 30 }, (_, i) => 100 + i * 0.5), ...Array.from({ length: 11 }, (_, i) => 115 + i * 7)]
    const [climb] = detectClimbs(ele, km(ele.length), 0, ele.length - 1)
    expect(climb.startIdx).toBeGreaterThanOrEqual(27)
    expect(climb.avgGrade).toBeGreaterThan(5)
  })

  it('keeps a pass with a short dip in one piece', () => {
    const up = (from: number, n: number, step: number) => Array.from({ length: n }, (_, i) => from + i * step)
    const ele = [...up(0, 10, 8), ...up(72, 3, -2), ...up(68, 10, 8)]
    expect(detectClimbs(ele, km(ele.length), 0, ele.length - 1)).toHaveLength(1)
  })

  it('ignores rollers below the gain or gradient threshold', () => {
    const rollers = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i / 3) * 12)
    expect(detectClimbs(rollers, km(60), 0, 59)).toEqual([])
    const drag = Array.from({ length: 60 }, (_, i) => 100 + i * 1.5)
    expect(detectClimbs(drag, km(60), 0, 59)).toEqual([])
  })

  it('looks only inside the range', () => {
    const ele = Array.from({ length: 40 }, (_, i) => i * 8)
    const [climb] = detectClimbs(ele, km(40), 10, 20)
    expect([climb.startIdx, climb.endIdx]).toEqual([10, 20])
  })
})

describe('sampleByDistance', () => {
  it('spaces samples by distance, not by point', () => {
    // Dense points in the first km, sparse after.
    const cum = [0, 0.25, 0.5, 0.75, 1, 3]
    const values = [0, 25, 50, 75, 100, 300]
    const s = sampleByDistance(values, cum, 0, 5, 4)
    expect(Array.from(s.values)).toEqual([0, 100, 200, 300])
    expect(s.positions[1]).toBe(4)
    expect([s.min, s.max]).toEqual([0, 300])
  })

  it('leaves gaps where the route is hidden', () => {
    const s = sampleByDistance([1, 2, 3, 4], [0, 1, 2, 3], 0, 3, 4, (i) => i === 1)
    expect(Number.isNaN(s.values[1])).toBe(true)
    expect([s.min, s.max]).toEqual([1, 4])
  })
})

describe('distanceFraction', () => {
  it('converts a track position into a share of the distance', () => {
    expect(distanceFraction([0, 1, 3, 4], 0, 3, 1.5)).toBeCloseTo(0.5)
    expect(distanceFraction([0, 1, 3, 4], 1, 3, 3)).toBe(1)
  })
})

describe('smoothSamples', () => {
  it('averages neighbours and leaves hidden samples hidden', () => {
    const samples = { values: Float32Array.from([0, 10, 0, NaN, 6]), positions: new Float32Array(5), min: 0, max: 10 }
    const out = smoothSamples(samples, 1)
    expect(out.values[0]).toBe(5)
    expect(out.values[1]).toBeCloseTo(10 / 3)
    expect(out.values[2]).toBe(5)
    expect(out.values[3]).toBeNaN()
    expect(out.values[4]).toBe(6)
    expect(out.max).toBe(6)
  })
})
