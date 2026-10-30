import { mercatorX, mercatorY, type MercatorFit } from '../../../utils/gpx'
import type { LonLat, SketchLayers, SketchPlace } from './tiles'
import type { Pt } from './pen'

// The sketch's features in the route's own frame pixels (before the view transform), simplified.
export interface SketchShape {
  // Rings to fill under the nonzero rule (islands are holes), and their shores to ink.
  water: Pt[][]
  shores: Pt[][]
  rivers: Pt[][]
  roads: Pt[][]
  places: { name: string; at: Pt; kind: SketchPlace['kind'] }[]
}

interface Rect {
  x0: number
  y0: number
  x1: number
  y1: number
}

const MAX_POINTS = 600
const MAX_PLACES = 8
const MIN_PLACES = 3

const closed = (line: Pt[]) => line.length > 2 && line[0][0] === line[line.length - 1][0] && line[0][1] === line[line.length - 1][1]
const inside = (p: Pt, r: Rect) => p[0] >= r.x0 && p[0] <= r.x1 && p[1] >= r.y0 && p[1] <= r.y1

// Liang–Barsky: the part of a→b inside the rectangle, with where along a→b it starts and ends.
function clipSegment(a: Pt, b: Pt, r: Rect): [Pt, Pt, number, number] | null {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  let t0 = 0
  let t1 = 1
  for (const [p, q] of [
    [-dx, a[0] - r.x0],
    [dx, r.x1 - a[0]],
    [-dy, a[1] - r.y0],
    [dy, r.y1 - a[1]],
  ]) {
    if (p === 0) {
      if (q < 0) return null
    } else {
      const t = q / p
      if (p < 0) t0 = Math.max(t0, t)
      else t1 = Math.min(t1, t)
    }
  }
  if (t0 > t1) return null
  return [[a[0] + dx * t0, a[1] + dy * t0], [a[0] + dx * t1, a[1] + dy * t1], t0, t1]
}

// The pieces of a line inside the rectangle. A ring is opened where it is outside first.
export function clipLine(line: Pt[], r: Rect): Pt[][] {
  let pts = line
  if (closed(line)) {
    const out = line.findIndex((p) => !inside(p, r))
    if (out < 0) return [line]
    pts = [...line.slice(out, -1), ...line.slice(0, out + 1)]
  }
  const runs: Pt[][] = []
  let run: Pt[] | null = null
  for (let i = 0; i < pts.length - 1; i++) {
    const c = clipSegment(pts[i], pts[i + 1], r)
    if (!c) {
      run = null
      continue
    }
    if (!run || c[2] > 0) {
      run = [c[0]]
      runs.push(run)
    }
    run.push(c[1])
    if (c[3] < 1) run = null
  }
  return runs.filter((p) => p.length > 1)
}

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
export function simplify(pts: Pt[], tol: number): Pt[] {
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

// The shortest distance from any of the points to the route (sampled, it is only for ranking).
function distanceTo(route: Pt[], pts: Pt[]): number {
  let best = Infinity
  for (const p of pts) for (const q of route) best = Math.min(best, Math.hypot(p[0] - q[0], p[1] - q[1]))
  return best
}

const KIND_RANK = { city: 0, town: 1, village: 2, water: 3 }

// A few places along the route, the largest first, never crowding each other: the towns at both ends
// first when there are any close by.
function pickPlaces(places: { name: string; at: Pt; kind: SketchPlace['kind']; rank: number }[], route: Pt[], short: number) {
  const gap = (p: Pt, q: Pt) => Math.hypot(p[0] - q[0], p[1] - q[1])
  const towns = places
    .filter((p) => p.kind !== 'water')
    .map((p) => ({ ...p, d: distanceTo(route, [p.at]) }))
    .sort((a, b) => KIND_RANK[a.kind] - KIND_RANK[b.kind] || a.rank - b.rank)
  const nearestTo = (end: Pt) => towns.filter((t) => gap(t.at, end) < short * 0.06).sort((a, b) => gap(a.at, end) - gap(b.at, end))[0]
  const chosen: typeof towns = []
  const offer = (t: (typeof towns)[number] | undefined) => {
    if (t && chosen.length < MAX_PLACES && !chosen.some((c) => c === t || gap(c.at, t.at) < short * 0.08)) chosen.push(t)
  }
  if (route.length) [route[0], route[route.length - 1]].forEach((end) => offer(nearestTo(end)))
  towns.filter((t) => t.d < short * 0.2).forEach(offer)
  if (chosen.length < MIN_PLACES) [...towns].sort((a, b) => a.d - b.d).forEach((t) => chosen.length < MIN_PLACES && offer(t))
  return chosen.map((t) => ({ name: t.name, at: t.at, kind: t.kind }))
}

// D2: projected, cut to around the route's area, thinned out, and simplified until the whole map
// stays under MAX_POINTS. `route` is the track in the same pixels; slideW × slideH a slide.
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
  const rivers = cut(lines(layers.rivers)).filter((l) => length(l) >= short * 0.08)
  const roadLines = cut(lines(layers.roads))
  const sample = route.filter((_, i) => i % Math.max(1, Math.floor(route.length / 300)) === 0)
  const roads = roadLines
    .map((l) => ({ l, d: distanceTo(sample, l.filter((_, i) => i % 4 === 0)) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, Math.max(Math.min(roadLines.length, MIN_PLACES), Math.ceil(roadLines.length * 0.2)))
    .map((r) => r.l)
  const near = layers.places.map((p) => ({ ...p, at: project(p.at) })).filter((p) => inside(p.at, rect))
  const places = pickPlaces(near, sample, short)
  const waterName = near.filter((p) => p.kind === 'water').sort((a, b) => a.rank - b.rank)[0]
  if (waterName) places.push({ name: waterName.name, at: waterName.at, kind: 'water' })

  let tol = short * 0.004
  for (;;) {
    const thin = (all: Pt[][]) => all.map((l) => simplify(l, tol)).filter((l) => l.length > 1)
    const shape: SketchShape = {
      water: thin(water.map((wa) => wa.ring)).filter((r) => r.length > 3),
      shores: thin(cut(water.flatMap((wa) => wa.shores))),
      rivers: thin(rivers),
      roads: thin(roads),
      places,
    }
    const count = [shape.water, shape.shores, shape.rivers, shape.roads].flat().reduce((sum, l) => sum + l.length, 0)
    if (count < MAX_POINTS || tol > short * 0.05) return shape
    tol *= 1.5
  }
}
