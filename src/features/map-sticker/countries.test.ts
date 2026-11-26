import { describe, expect, it } from 'vitest'
import { countryShape, type CountryTopology, type LonLat } from './countries'
import countriesFile from '../../../public/data/countries-50m.json?raw'

const topo = JSON.parse(countriesFile) as CountryTopology

function contains(ring: LonLat[], [x, y]: LonLat): boolean {
  let hit = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

const line = (from: LonLat, to: LonLat, n = 50): LonLat[] =>
  Array.from({ length: n }, (_, i) => [from[0] + ((to[0] - from[0]) * i) / (n - 1), from[1] + ((to[1] - from[1]) * i) / (n - 1)])

describe('map sticker country shape', () => {
  it('outlines Poland for a route across Poland', () => {
    const shape = countryShape(topo, line([16.9, 52.4], [21.0, 52.2]))
    expect(shape?.names).toEqual(['Poland'])
    expect(shape?.rings).toHaveLength(1)
  })

  it('joins two countries into one outline for a route over their border', () => {
    const shape = countryShape(topo, line([13.4, 52.5], [16.9, 52.4]))
    expect(shape?.names.sort()).toEqual(['Germany', 'Poland'])
    const holdsBoth = (ring: LonLat[]) => [[13.4, 52.5], [16.9, 52.4]].every((p) => contains(ring, p as LonLat))
    expect(shape?.rings.filter(holdsBoth)).toHaveLength(1)
  })

  it('leaves out overseas parts far from the route', () => {
    const shape = countryShape(topo, line([2.35, 48.85], [4.83, 45.76]))
    expect(shape?.names).toEqual(['France'])
    expect(shape?.rings.every((ring) => ring.every(([lon]) => lon > -10 && lon < 15))).toBe(true)
  })

  it('finds no country for a route at sea', () => {
    expect(countryShape(topo, line([-30, 40], [-29, 41]))).toBeNull()
  })
})
