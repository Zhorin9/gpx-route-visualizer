import { feature, merge } from 'topojson-client'
import type { GeometryCollection, MultiPolygon as TopoMultiPolygon, Polygon as TopoPolygon, Topology } from 'topojson-specification'
import type { Feature, MultiPolygon, Polygon, Position } from 'geojson'

export type LonLat = [number, number]
export type CountryTopology = Topology<{ countries: GeometryCollection<{ name: string }> }>

export interface CountryShape {
  names: string[]
  rings: LonLat[][]
}

const MAX_SAMPLES = 400
const MIN_SHARE = 0.05

let countriesFile: Promise<CountryTopology> | null = null

export function loadCountries(): Promise<CountryTopology> {
  countriesFile ??= fetch(`${import.meta.env.BASE_URL}data/countries-50m.json`).then((r) => {
    if (!r.ok) throw new Error(`countries ${r.status}`)
    return r.json() as Promise<CountryTopology>
  })
  countriesFile.catch(() => (countriesFile = null))
  return countriesFile
}

function inside([x, y]: LonLat, ring: Position[]): boolean {
  let hit = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

const outerRings = (geometry: Polygon | MultiPolygon): Position[][] => (geometry.type === 'Polygon' ? [geometry.coordinates[0]] : geometry.coordinates.map((p) => p[0]))

interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

function boundsOf(rings: Position[][]): Bounds {
  const b = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  for (const ring of rings) {
    for (const [x, y] of ring) {
      b.minX = Math.min(b.minX, x); b.maxX = Math.max(b.maxX, x)
      b.minY = Math.min(b.minY, y); b.maxY = Math.max(b.maxY, y)
    }
  }
  return b
}

const overlaps = (a: Bounds, b: Bounds) => a.minX <= b.maxX && b.minX <= a.maxX && a.minY <= b.maxY && b.minY <= a.maxY

function sampled(route: LonLat[]): LonLat[] {
  const step = Math.max(1, Math.ceil(route.length / MAX_SAMPLES))
  return route.filter((_, i) => i % step === 0)
}

export function countryShape(topo: CountryTopology, route: LonLat[]): CountryShape | null {
  const samples = sampled(route)
  if (!samples.length) return null
  const countries = topo.objects.countries.geometries.filter(
    (g): g is TopoPolygon<{ name: string }> | TopoMultiPolygon<{ name: string }> => g.type === 'Polygon' || g.type === 'MultiPolygon',
  )
  const counts = countries.map((geometry) => {
    const rings = outerRings((feature(topo, geometry) as Feature<Polygon | MultiPolygon>).geometry)
    const box = boundsOf(rings)
    return samples.filter((p) => p[0] >= box.minX && p[0] <= box.maxX && p[1] >= box.minY && p[1] <= box.maxY && rings.some((r) => inside(p, r))).length
  })
  const most = Math.max(...counts)
  if (most === 0) return null
  const chosen = countries.filter((_, i) => counts[i] > 0 && (counts[i] === most || counts[i] >= samples.length * MIN_SHARE))
  const all = outerRings(merge(topo, chosen))
  const onRoute = all.filter((ring) => samples.some((p) => inside(p, ring)))
  const routeBox = boundsOf(onRoute)
  const rings = all.filter((ring) => onRoute.includes(ring) || overlaps(boundsOf([ring]), routeBox))
  return { names: chosen.map((c) => c.properties?.name ?? ''), rings: rings.map((ring) => ring.map(([x, y]) => [x, y] as LonLat)) }
}
