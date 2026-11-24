import { mercatorX, mercatorY, type MercatorFit } from '../../../utils/gpx'
import type { LonLat, SketchLayers, SketchPlace } from './tiles'
import type { Pt } from './pen'
import { clipLine, inside, joinLines, rounded, withoutParallels } from './lines'

// In the route's frame pixels, before the view transform.
export interface SketchShape {
  // Rings to fill under the nonzero rule (islands are holes), and their shores to ink.
  water: Pt[][]
  shores: Pt[][]
  rivers: Pt[][]
  roads: Pt[][]
  places: { name: string; at: Pt; kind: SketchPlace['kind'] }[]
}

const MAX_ROAD_POINTS = 250
const MAX_WATER_POINTS = 350
const RIVER_ROUNDING = 2
const MAX_PLACES = 8
const MIN_PLACES = 3


function simplifyInto(pts: Pt[], first: number, last: number, tol: number, keep: boolean[]) {
  const [ax, ay] = pts[first]
  const [bx, by] = pts[last]
  const len = Math.hypot(bx - ax, by - ay)
  let far = -1
  let farD = tol
  for (let i = first + 1; i < last; i++) {
    const [px, py] = pts[i]
    const d = len ? Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / len : Math.hypot(px - ax, py - ay)
    if (d > farD) {
      farD = d
      far = i
    }
  }
  if (far < 0) return
  keep[far] = true
  simplifyInto(pts, first, far, tol, keep)
  simplifyInto(pts, far, last, tol, keep)
}

// Douglas–Peucker.
function simplify(pts: Pt[], tol: number): Pt[] {
  if (pts.length < 3) return pts
  const keep = pts.map((_, i) => i === 0 || i === pts.length - 1)
  simplifyInto(pts, 0, pts.length - 1, tol, keep)
  return pts.filter((_, i) => keep[i])
}

const length = (pts: Pt[]) => pts.reduce((sum, p, i) => (i ? sum + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0)

function area(ring: Pt[]): number {
  let a = 0
  for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
  return Math.abs(a / 2)
}

// Sampled: it only ranks places.
function distanceTo(route: Pt[], pts: Pt[]): number {
  let best = Infinity
  for (const p of pts) for (const q of route) best = Math.min(best, Math.hypot(p[0] - q[0], p[1] - q[1]))
  return best
}

const KIND_RANK = { city: 0, town: 1, village: 2, water: 3 }

// The towns at both ends first when close by, then the largest, never crowding each other.
function pickPlaces(places: { name: string; at: Pt; kind: SketchPlace['kind']; rank: number }[], route: Pt[], short: number) {
  const gap = (p: Pt, q: Pt) => Math.hypot(p[0] - q[0], p[1] - q[1])
  const towns = places
    .filter((p) => p.kind !== 'water')
    .map((p) => ({ ...p, d: distanceTo(route, [p.at]) }))
    .sort((a, b) => KIND_RANK[a.kind] - KIND_RANK[b.kind] || a.rank - b.rank)
  // A town's point is its centre, which can lie well off a route ending in its streets.
  const nearestTo = (end: Pt) => towns.filter((t) => gap(t.at, end) < short * 0.15).sort((a, b) => gap(a.at, end) - gap(b.at, end))[0]
  const chosen: typeof towns = []
  const offer = (t: (typeof towns)[number] | undefined) => {
    if (t && chosen.length < MAX_PLACES && !chosen.some((c) => c === t || gap(c.at, t.at) < short * 0.08)) chosen.push(t)
  }
  if (route.length) [route[0], route[route.length - 1]].forEach((end) => offer(nearestTo(end)))
  towns.filter((t) => t.d < short * 0.2).forEach(offer)
  if (chosen.length < MIN_PLACES) [...towns].sort((a, b) => a.d - b.d).forEach((t) => chosen.length < MIN_PLACES && offer(t))
  return chosen.map((t) => ({ name: t.name, at: t.at, kind: t.kind }))
}

export function sketchShape(layers: SketchLayers, fit: MercatorFit, route: Pt[], slideW: number, slideH: number): SketchShape {
  const short = Math.min(slideW, slideH)
  const project = ([lon, lat]: LonLat): Pt => [(mercatorX(lon) - fit.x0) * fit.scale, (mercatorY(lat) - fit.y0) * fit.scale]
  const lines = (ways: LonLat[][]) => ways.map((w) => w.map(project))
  const [s, w, n, e] = layers.bbox
  const [x0, y1] = project([w, s])
  const [x1, y0] = project([e, n])
  const rect = { x0, y0, x1, y1 }
  // Lines are kept a little past the area, where a moved route can still show them.
  const pad = Math.max(x1 - x0, y1 - y0) * 0.25
  const reach = { x0: x0 - pad, y0: y0 - pad, x1: x1 + pad, y1: y1 + pad }
  const cut = (all: Pt[][]) => all.flatMap((l) => clipLine(l, reach))

  const water = layers.water
    .map((wa) => ({ ring: wa.ring.map(project), shores: lines(wa.shores) }))
    .filter((wa) => area(wa.ring) >= slideW * slideH * 0.003 && wa.ring.some((p) => inside(p, reach)))
  const meetWithin = short * 0.002
  const rivers = cut(joinLines(lines(layers.rivers), meetWithin)).filter((l) => length(l) >= short * 0.08)
  const roadLines = cut(withoutParallels(joinLines(lines(layers.roads), meetWithin), short * 0.012))
  // The last point is kept: the town at the very end is named after it.
  const sample = route.filter((_, i) => i % Math.max(1, Math.floor(route.length / 300)) === 0 || i === route.length - 1)
  const roads = roadLines
    .map((l) => ({ l, d: distanceTo(sample, l.filter((_, i) => i % 4 === 0)) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, Math.max(Math.min(roadLines.length, MIN_PLACES), Math.ceil(roadLines.length * 0.2)))
    .map((r) => r.l)
  const near = layers.places.map((p) => ({ ...p, at: project(p.at) })).filter((p) => inside(p.at, rect))
  const places = pickPlaces(near, sample, short)
  const waterName = near.filter((p) => p.kind === 'water').sort((a, b) => a.rank - b.rank)[0]
  if (waterName) places.push({ name: waterName.name, at: waterName.at, kind: 'water' })

  const [rings, shores, riverLines] = thinToBudget([water.map((wa) => wa.ring), cut(water.flatMap((wa) => wa.shores)), rivers], MAX_WATER_POINTS, short)
  const [roadsDrawn] = thinToBudget([roads], MAX_ROAD_POINTS, short)
  return { water: rings.filter((r) => r.length > 3), shores, rivers: riverLines.map((l) => rounded(l, RIVER_ROUNDING)), roads: roadsDrawn, places }
}

function thinToBudget(groups: Pt[][][], budget: number, short: number): Pt[][][] {
  for (let tol = short * 0.004; ; tol *= 1.5) {
    const thinned = groups.map((all) => all.map((l) => simplify(l, tol)).filter((l) => l.length > 1))
    const count = thinned.flat().reduce((sum, l) => sum + l.length, 0)
    if (count < budget || tol > short * 0.05) return thinned
  }
}
