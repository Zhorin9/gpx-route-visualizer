import { describe, expect, it } from 'vitest'
import { computeRangeStats, cumulativeDistanceKm, elevationGain, flatBounds, parseGpxText, projectPointsToCanvas, splitIntoDays } from './gpx'
import type { GpxPoint } from '../types'

const gpx = (body: string) => `<?xml version="1.0"?><gpx xmlns="http://www.topografix.com/GPX/1/1">${body}</gpx>`

describe('parseGpxText', () => {
  it('reads track points, elevation, time and name', () => {
    const track = parseGpxText(
      gpx(`<trk><name>Karkonosze</name><trkseg>
        <trkpt lat="50.1" lon="15.1"><ele>300</ele><time>2026-06-01T08:00:00Z</time></trkpt>
        <trkpt lat="50.2" lon="15.2"><ele>350</ele><time>2026-06-01T09:00:00Z</time></trkpt>
      </trkseg></trk>`),
    )
    expect(track.name).toBe('Karkonosze')
    expect(track.points).toHaveLength(2)
    expect(track.points[1]).toEqual({ lat: 50.2, lon: 15.2, ele: 350, time: Date.parse('2026-06-01T09:00:00Z') })
  })

  it('falls back to route points and skips points without coordinates', () => {
    const track = parseGpxText(
      gpx(`<rte><rtept lat="50" lon="15"/><rtept lon="15.5"/><rtept lat="51" lon="16"/></rte>`),
    )
    expect(track.points.map((p) => p.lat)).toEqual([50, 51])
    expect(track.points[0].time).toBeNull()
  })

  it('rejects invalid XML and files without a track', () => {
    expect(() => parseGpxText('<gpx><trk>')).toThrow(/nieprawidłowy XML/)
    expect(() => parseGpxText(gpx('<wpt lat="1" lon="1"/>'))).toThrow(/Nie znaleziono trasy/)
  })
})

const pt = (ele: number, time: number | null = null, lat = 50, lon = 15): GpxPoint => ({ lat, lon, ele, time })

describe('elevationGain', () => {
  it('ignores GPS jitter below the threshold', () => {
    const noisy = [100, 102, 99, 101, 100, 103, 100].map((e) => pt(e))
    expect(elevationGain(noisy, 0, noisy.length - 1)).toBe(0)
  })

  it('counts real climbs, including across small dips', () => {
    const climb = [100, 110, 108, 120, 100, 130].map((e) => pt(e))
    expect(elevationGain(climb, 0, climb.length - 1)).toBe(50)
  })
})

describe('computeRangeStats', () => {
  it('measures distance and duration for a sub-range', () => {
    const points = [pt(0, 0, 50, 15), pt(0, 60_000, 50.01, 15), pt(0, 120_000, 50.02, 15)]
    const cum = cumulativeDistanceKm(points)
    const stats = computeRangeStats(points, cum, 1, 2)
    expect(stats.distanceKm).toBeCloseTo(1.112, 2)
    expect(stats.durationMs).toBe(60_000)
  })
})

describe('splitIntoDays', () => {
  it('returns nothing for a single-day track', () => {
    const t = new Date(2026, 5, 1, 8).getTime()
    expect(splitIntoDays([pt(0, t), pt(0, t + 3600_000)])).toEqual([])
  })

  it('groups points by local calendar day', () => {
    const d1 = new Date(2026, 5, 1, 18).getTime()
    const d2 = new Date(2026, 5, 2, 8).getTime()
    const days = splitIntoDays([pt(0, d1), pt(0, d1 + 60_000), pt(0, d2), pt(0, d2 + 60_000)])
    expect(days.map((d) => [d.startIdx, d.endIdx])).toEqual([
      [0, 1],
      [2, 3],
    ])
  })
})

describe('projection', () => {
  it('fits the track inside the padded box without overflowing on large tracks', () => {
    const points = Array.from({ length: 200_000 }, (_, i) => pt(0, null, 50 + i * 1e-6, 15 + i * 1e-6))
    const flat = projectPointsToCanvas(points, 1080, 1920, 80)
    const b = flatBounds(flat)
    expect(b.minX).toBeGreaterThanOrEqual(80 - 1e-6)
    expect(b.maxX).toBeLessThanOrEqual(1000 + 1e-6)
    expect(b.minY).toBeGreaterThanOrEqual(0)
    expect(b.maxY).toBeLessThanOrEqual(1920)
  })
})
