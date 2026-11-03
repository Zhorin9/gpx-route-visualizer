import { describe, expect, it } from 'vitest'
import { fitMercator, mercatorX, mercatorY } from '../../utils/gpx'
import { jitter, routeSeed, wobble, type Pt } from './sketch/pen'
import { clipLine, simplify, sketchShape } from './sketch/shape'
import { readTile, sketchBbox, sketchTiles, type LonLat, type SketchLayers, type TileLayers } from './sketch/tiles'
import type { GpxPoint } from '../../types'

const at = (lat: number, lon: number): GpxPoint => ({ lat, lon, ele: 0, time: null })
const empty = (bbox: SketchLayers['bbox']): SketchLayers => ({ bbox, water: [], rivers: [], roads: [], places: [] })

// A decoded tile as the reader sees it: layers of features in tile units (4096 across).
function tile(layers: Record<string, { type: number; properties: Record<string, unknown>; geometry: [number, number][][] }[]>): TileLayers {
  return {
    layers: Object.fromEntries(
      Object.entries(layers).map(([name, features]) => [
        name,
        {
          length: features.length,
          extent: 4096,
          feature: (i: number) => ({ ...features[i], loadGeometry: () => features[i].geometry.map((l) => l.map(([x, y]) => ({ x, y }))) }),
        },
      ]),
    ),
  }
}

describe('sketch data (D1)', () => {
  it('asks for the route with a margin, tall enough for a story under a wide route', () => {
    const size = (route: GpxPoint[]) => {
      const [s, w, n, e] = sketchBbox(route)
      return { s, n, wide: mercatorX(e) - mercatorX(w), tall: mercatorY(s) - mercatorY(n) }
    }
    const north = size([at(54.0, 18.0), at(54.5, 18.0)])
    expect(north.s).toBeLessThan(54.0)
    expect(north.n).toBeGreaterThan(54.5)
    expect(north.wide / north.tall).toBeCloseTo(1.4, 3)
    const east = size([at(54.0, 18.0), at(54.0, 19.0)])
    expect(east.tall / east.wide).toBeCloseTo(16 / 9, 3)
  })

  it('reads a few tiles, closer in for a short ride than for a long trip', () => {
    const ride = sketchTiles(sketchBbox([at(50.8, 15.5), at(50.9, 15.7)]))
    const trip = sketchTiles(sketchBbox([at(50.0, 14.0), at(54.4, 18.6)]))
    expect(ride.length).toBeLessThanOrEqual(9)
    expect(trip.length).toBeLessThanOrEqual(9)
    expect(ride[0].z).toBeGreaterThan(trip[0].z)
  })

  it('sorts a tile into layers: Polish names, main roads only, shores without the cut edges', () => {
    const into = empty([0, 0, 1, 1])
    const t = tile({
      // A lake cut by the tile's left edge (x < 0 is the buffer).
      water: [{ type: 3, properties: { class: 'lake' }, geometry: [[[-64, 100], [500, 100], [500, 900], [-64, 900], [-64, 100]]] }],
      waterway: [
        { type: 2, properties: { class: 'river' }, geometry: [[[0, 0], [100, 100]]] },
        { type: 2, properties: { class: 'stream' }, geometry: [[[0, 0], [100, 100]]] },
      ],
      transportation: [
        { type: 2, properties: { class: 'primary' }, geometry: [[[0, 0], [100, 0]]] },
        { type: 2, properties: { class: 'tertiary' }, geometry: [[[0, 0], [100, 0]]] },
      ],
      place: [
        { type: 1, properties: { class: 'city', name: 'Köln', 'name:pl': 'Kolonia', rank: 3 }, geometry: [[[2048, 2048]]] },
        { type: 1, properties: { class: 'state', name: 'Nadrenia' }, geometry: [[[100, 100]]] },
      ],
      water_name: [{ type: 2, properties: { class: 'bay', name: 'Zatoka' }, geometry: [[[0, 0], [10, 10], [20, 20]]] }],
    })
    readTile(t, { z: 1, x: 1, y: 0 }, into)
    readTile(t, { z: 1, x: 1, y: 0 }, into)
    expect(into.water[0].ring).toHaveLength(5)
    // Three sides are shore; the edge along the tile's border is not.
    expect(into.water[0].shores).toHaveLength(1)
    expect(into.water[0].shores[0]).toHaveLength(4)
    expect(into.rivers).toHaveLength(2)
    expect(into.roads).toHaveLength(2)
    expect(into.places.map((p) => [p.name, p.kind, p.rank])).toEqual([
      ['Kolonia', 'city', 3],
      ['Zatoka', 'water', 99],
    ])
    // The middle of the tile at z1, x1, y0: 90° E on the equator… of the upper half.
    expect(into.places[0].at[0]).toBeCloseTo(90)
  })
})

describe('sketch shapes (D2)', () => {
  it('cuts a line to the rectangle', () => {
    const runs = clipLine([[-5, 5], [5, 5], [15, 5], [15, 8], [5, 8]], { x0: 0, y0: 0, x1: 10, y1: 10 })
    expect(runs).toEqual([
      [[0, 5], [5, 5], [10, 5]],
      [[10, 8], [5, 8]],
    ])
  })

  it('simplifies a nearly straight line to its ends', () => {
    expect(simplify([[0, 0], [5, 0.1], [10, 0]], 1)).toEqual([[0, 0], [10, 0]])
  })

  it('keeps the whole map under 600 points and drops ponds', () => {
    const route = [at(39.9, 9.6), at(40.1, 9.7)]
    const coast: LonLat[] = Array.from({ length: 5000 }, (_, i) => [9.3 + i * 0.0002, 40 + Math.sin(i / 7) * 0.03])
    const sea: LonLat[] = [...coast, [10.3, 39.5], [9.3, 39.5], coast[0]]
    const pond: LonLat[] = [[9.65, 40], [9.651, 40], [9.651, 40.001], [9.65, 40]]
    const layers: SketchLayers = { ...empty(sketchBbox(route)), water: [{ ring: sea, shores: [coast] }, { ring: pond, shores: [pond] }] }
    const fit = fitMercator(route, 1080, 1350)
    const shape = sketchShape(layers, fit, [], 1080, 1350)
    const count = [shape.water, shape.shores, shape.rivers, shape.roads].flat().reduce((n, l) => n + l.length, 0)
    expect(shape.water).toHaveLength(1)
    expect(count).toBeGreaterThan(10)
    expect(count).toBeLessThan(600)
  })

  it('names the towns at both ends and the larger places along the way', () => {
    const route = Array.from({ length: 21 }, (_, i) => at(40 + i * 0.01, 9))
    const fit = fitMercator(route, 1080, 1350)
    const town = (name: string, lat: number, kind: 'city' | 'town' | 'village', rank = 99) => ({ name, at: [9, lat] as LonLat, kind, rank })
    const layers: SketchLayers = {
      ...empty(sketchBbox(route)),
      places: [town('Wieś', 40.1, 'village'), town('Start', 40, 'village'), town('Meta', 40.2, 'village'), town('Miasto', 40.13, 'city', 5)],
    }
    const flat = route.map((p): Pt => [(mercatorX(p.lon) - fit.x0) * fit.scale, (mercatorY(p.lat) - fit.y0) * fit.scale])
    expect(sketchShape(layers, fit, flat, 1080, 1350).places.map((p) => p.name)).toEqual(['Start', 'Meta', 'Miasto', 'Wieś'])
  })
})

describe('the pen (D3)', () => {
  const line: Pt[] = [[0, 0], [300, 0], [300, 200]]

  it('trembles the same way every time for the same seed', () => {
    expect(jitter(line, 42, 4, 6)).toEqual(jitter(line, 42, 4, 6))
    expect(jitter(line, 42, 4, 6)).not.toEqual(jitter(line, 43, 4, 6))
  })

  it('moves points across the line by at most the amplitude, smoothly', () => {
    const pts = jitter([[0, 0], [600, 0]], 7, 4, 6)
    expect(Math.max(...pts.map((p) => Math.abs(p[1])))).toBeLessThanOrEqual(4.01)
    for (let i = 1; i < pts.length; i++) expect(Math.abs(pts[i][1] - pts[i - 1][1])).toBeLessThan(1)
  })

  it('trembles a track point for point, so its indices still match', () => {
    const flat = new Float64Array([0, 0, 100, 0, 200, 0, 300, 0])
    const out = wobble(flat, 5, 3, 400)
    expect(out).toHaveLength(flat.length)
    expect(out).toEqual(wobble(flat, 5, 3, 400))
    expect(Array.from(out).filter((_, i) => i % 2 === 0)).toEqual([0, 100, 200, 300])
  })

  it('takes the seed from the route itself', () => {
    const a = [at(54.1, 18.2), at(54.2, 18.3)]
    expect(routeSeed(a)).toBe(routeSeed(a.map((p) => ({ ...p }))))
    expect(routeSeed(a)).not.toBe(routeSeed([at(54.1, 18.2), at(54.2, 18.4)]))
  })
})
