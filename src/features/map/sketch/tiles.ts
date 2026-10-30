import { VectorTile } from '@mapbox/vector-tile'
import { PbfReader } from 'pbf'
import { mercatorX, mercatorY } from '../../../utils/gpx'
import type { GpxPoint } from '../../../types'

// What the sketch is drawn from, fetched once per route from the same vector tiles as the
// ordinary map (OpenFreeMap): plain features in longitude/latitude.
export type LonLat = [number, number]

export interface SketchPlace {
  name: string
  at: LonLat
  // 'water' names a sea, bay or lake.
  kind: 'city' | 'town' | 'village' | 'water'
  // The tiles' importance, 1 first; places without one come last.
  rank: number
}

export interface SketchLayers {
  // South, west, north, east: the route's area.
  bbox: [number, number, number, number]
  // Sea, lakes and wide rivers. Rings turn as in the tiles (holes the other way), so they fill
  // under the nonzero rule; `shores` are their edges without the seams where tiles are cut.
  water: { ring: LonLat[]; shores: LonLat[][] }[]
  rivers: LonLat[][]
  roads: LonLat[][]
  places: SketchPlace[]
}

const TILEJSON = 'https://tiles.openfreemap.org/planet'
const MARGIN = 0.15
// A wide route on a story (9:16) shows far more above and below it; a tall one in the 16:9 route
// area (left of the side column) more to its sides. The area covers both.
const STORY = 16 / 9
const LANDSCAPE = 1.4
const ROADS = new Set(['motorway', 'trunk', 'primary'])
const PLACES = new Set(['city', 'town', 'village'])

const toLat = (y: number) => (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI
const toLon = (x: number) => x * 360 - 180

// The route's area with a margin, widened to a slide's proportions.
export function sketchBbox(points: GpxPoint[]): [number, number, number, number] {
  let x0 = Infinity
  let x1 = -Infinity
  let y0 = Infinity
  let y1 = -Infinity
  for (const p of points) {
    const x = mercatorX(p.lon)
    const y = mercatorY(p.lat)
    x0 = Math.min(x0, x)
    x1 = Math.max(x1, x)
    y0 = Math.min(y0, y)
    y1 = Math.max(y1, y)
  }
  const routeW = (x1 - x0 || 1e-5) * (1 + MARGIN * 2)
  const routeH = (y1 - y0 || 1e-5) * (1 + MARGIN * 2)
  const w = Math.max(routeW, routeH * LANDSCAPE)
  const h = Math.max(routeH, routeW * STORY)
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  return [toLat(cy + h / 2), toLon(cx - w / 2), toLat(cy - h / 2), toLon(cx + w / 2)]
}

// The tiles covering the area at a zoom where a tile is about half its size: at most 3 × 3,
// detailed enough for villages on a day's ride and for cities across a country.
export function sketchTiles([s, w, n, e]: SketchLayers['bbox']): { z: number; x: number; y: number }[] {
  const x0 = mercatorX(w)
  const x1 = mercatorX(e)
  const y0 = mercatorY(n)
  const y1 = mercatorY(s)
  const z = Math.max(3, Math.min(13, Math.floor(Math.log2(1 / Math.max(x1 - x0, y1 - y0))) + 1))
  const n2 = 2 ** z
  const tiles = []
  for (let x = Math.floor(x0 * n2); x <= Math.floor(x1 * n2); x++) for (let y = Math.floor(y0 * n2); y <= Math.floor(y1 * n2); y++) tiles.push({ z, x, y })
  return tiles
}

interface TilePoint {
  x: number
  y: number
}

// Just what is read of a decoded tile, so tests can hand one in.
export interface TileLayers {
  layers: Record<string, { length: number; extent: number; feature: (i: number) => { type: number; properties: Record<string, unknown>; loadGeometry: () => TilePoint[][] } }>
}

// Adds a tile's features to the layers. Places on two tiles are kept once.
export function readTile(tile: TileLayers, { z, x, y }: { z: number; x: number; y: number }, into: SketchLayers) {
  const each = (name: string, fn: (props: Record<string, unknown>, geometry: TilePoint[][], extent: number) => void) => {
    const layer = tile.layers[name]
    for (let i = 0; i < (layer?.length ?? 0); i++) {
      const f = layer.feature(i)
      fn(f.properties, f.loadGeometry(), layer.extent)
    }
  }
  const lonLat = (extent: number) => (p: TilePoint): LonLat => [toLon((x + p.x / extent) / 2 ** z), toLat((y + p.y / extent) / 2 ** z)]
  const name = (props: Record<string, unknown>) => String(props['name:pl'] ?? props.name ?? '')

  each('water', (_, rings, extent) => {
    const at = lonLat(extent)
    // A tile cuts a lake along its (buffered) edge; that edge is no shore.
    const seam = (a: TilePoint, b: TilePoint) =>
      (a.x <= 0 && b.x <= 0) || (a.x >= extent && b.x >= extent) || (a.y <= 0 && b.y <= 0) || (a.y >= extent && b.y >= extent)
    for (const ring of rings) {
      const shores: LonLat[][] = []
      let run: LonLat[] | null = null
      for (let i = 0; i < ring.length - 1; i++) {
        if (seam(ring[i], ring[i + 1])) {
          run = null
          continue
        }
        if (!run) {
          run = [at(ring[i])]
          shores.push(run)
        }
        run.push(at(ring[i + 1]))
      }
      into.water.push({ ring: ring.map(at), shores })
    }
  })
  each('waterway', (props, lines, extent) => {
    if (props.class === 'river') into.rivers.push(...lines.map((l) => l.map(lonLat(extent))))
  })
  each('transportation', (props, lines, extent) => {
    if (ROADS.has(String(props.class))) into.roads.push(...lines.map((l) => l.map(lonLat(extent))))
  })
  const place = (kind: SketchPlace['kind'], props: Record<string, unknown>, geometry: TilePoint[][], extent: number) => {
    const line = geometry[0]
    const label = name(props)
    if (!label || !line?.length || into.places.some((p) => p.name === label && p.kind === kind)) return
    into.places.push({ name: label, at: lonLat(extent)(line[Math.floor(line.length / 2)]), kind, rank: Number(props.rank) || 99 })
  }
  each('place', (props, geometry, extent) => PLACES.has(String(props.class)) && place(props.class as SketchPlace['kind'], props, geometry, extent))
  each('water_name', (props, geometry, extent) => place('water', props, geometry, extent))
}

let tileUrl: Promise<string> | null = null

// Once per route. Throws when the tiles can't be loaded (no network).
export async function fetchSketchLayers(points: GpxPoint[]): Promise<SketchLayers> {
  const bbox = sketchBbox(points)
  tileUrl ??= fetch(TILEJSON)
    .then((r) => r.json())
    .then((j: { tiles: string[] }) => j.tiles[0])
    .catch((err) => {
      tileUrl = null
      throw err
    })
  const template = await tileUrl
  const layers: SketchLayers = { bbox, water: [], rivers: [], roads: [], places: [] }
  const tiles = sketchTiles(bbox)
  const buffers = await Promise.all(
    tiles.map(async (t) => {
      const res = await fetch(template.replace('{z}', `${t.z}`).replace('{x}', `${t.x}`).replace('{y}', `${t.y}`))
      if (!res.ok) throw new Error(`OpenFreeMap ${res.status}`)
      return res.arrayBuffer()
    }),
  )
  buffers.forEach((buf, i) => readTile(new VectorTile(new PbfReader(buf)), tiles[i], layers))
  return layers
}
