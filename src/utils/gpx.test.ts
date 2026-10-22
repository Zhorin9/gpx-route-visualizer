import { describe, expect, it } from 'vitest'
import { computeRangeStats, cumulativeDistanceKm, elevationGain, flatBounds, movingDurationMs, parseGpxText, projectPointsToCanvas, splitIntoDays } from './gpx'
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

  it('reads heart rate from the track point extension, whatever the prefix', () => {
    const track = parseGpxText(
      `<?xml version="1.0"?><gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" xmlns:ns3="urn:x"><trk><trkseg>
        <trkpt lat="50" lon="15"><extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>142</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions></trkpt>
        <trkpt lat="50.1" lon="15"><extensions><ns3:TrackPointExtension><ns3:hr>150</ns3:hr></ns3:TrackPointExtension></extensions></trkpt>
        <trkpt lat="50.2" lon="15"></trkpt>
      </trkseg></trk></gpx>`,
    )
    expect(track.points.map((p) => p.hr)).toEqual([142, 150, undefined])
  })

  it('falls back to route points and skips points without coordinates', () => {
    const track = parseGpxText(
      gpx(`<rte><rtept lat="50" lon="15"/><rtept lon="15.5"/><rtept lat="51" lon="16"/></rte>`),
    )
    expect(track.points.map((p) => p.lat)).toEqual([50, 51])
    expect(track.points[0].time).toBeNull()
  })

  it('rejects invalid XML and files without a track', () => {
    expect(() => parseGpxText('<gpx><trk>')).toThrow(/nie jest poprawnym plikiem XML/)
    expect(() => parseGpxText(gpx('<wpt lat="1" lon="1"/>'))).toThrow(/nie zawiera punktów trasy/)
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

  it('reports the highest point, or nothing without elevation data', () => {
    const points = [pt(120), pt(480), pt(300)]
    const cum = cumulativeDistanceKm(points)
    expect(computeRangeStats(points, cum, 0, 2).maxElevationM).toBe(480)
    expect(computeRangeStats(points, cum, 0, 0).maxElevationM).toBe(120)
    const flat = [pt(0), pt(0)]
    expect(computeRangeStats(flat, cumulativeDistanceKm(flat), 0, 1).maxElevationM).toBeNull()
  })
})

describe('movingDurationMs', () => {
  // ~111 m per 0.001° of latitude.
  const at = (i: number, t: number, dLat = 0.001 * i) => pt(0, t, 50 + dLat, 15)

  it('counts only the minutes spent moving', () => {
    const points = [
      at(0, 0),
      at(1, 60_000), // 6.7 km/h
      at(2, 120_000),
      at(2, 180_000, 0.002), // standing still for a minute
      at(3, 240_000, 0.003),
    ]
    expect(movingDurationMs(points, cumulativeDistanceKm(points), 0, 4)).toBe(180_000)
  })

  it('drops a long stop but keeps sparse recordings, and skips the jump between days', () => {
    // 111 m in 10 min is 0.7 km/h: a stop. 1.1 km in 10 min is 6.7 km/h: a sparse but moving recording.
    const points = [at(0, 0), at(1, 60_000), at(2, 11 * 60_000), at(12, 21 * 60_000)]
    const cum = cumulativeDistanceKm(points)
    expect(movingDurationMs(points, cum, 0, 3)).toBe(11 * 60_000)
    expect(movingDurationMs(points, cum, 0, 3, [3])).toBe(60_000)
  })

  it('is zero without timestamps', () => {
    const points = [pt(0, null, 50, 15), pt(0, null, 50.01, 15)]
    expect(movingDurationMs(points, cumulativeDistanceKm(points), 0, 1)).toBe(0)
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

describe('multi-day tracks', () => {
  const day = (lat: number, hour: number) => [0, 1].map((i) => ({ lat: lat + i * 0.01, lon: 19, ele: 100, time: Date.UTC(2026, 4, 1, hour + i) }))
  const points = [...day(50, 8), ...day(51, 8 + 24)]

  it('does not count the jump between days as distance', () => {
    const joined = cumulativeDistanceKm(points)
    const split = cumulativeDistanceKm(points, [2])
    expect(joined[3]).toBeGreaterThan(100)
    expect(split[3]).toBeLessThan(5)
  })

  it('adds up the time of each day, not the night in between', () => {
    const cum = cumulativeDistanceKm(points, [2])
    expect(computeRangeStats(points, cum, 0, 3, [2]).durationMs).toBe(2 * 3600_000)
    expect(computeRangeStats(points, cum, 0, 3).durationMs).toBeGreaterThan(24 * 3600_000)
  })
})
