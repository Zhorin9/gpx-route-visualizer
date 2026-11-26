export type Pt = [number, number]

// Andrew's monotone chain: the convex hull of a route's points, counter-clockwise.
export function convexHull(flat: ArrayLike<number>): Pt[] {
  const pts: Pt[] = []
  for (let i = 0; i < flat.length; i += 2) pts.push([flat[i], flat[i + 1]])
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (pts.length < 3) return pts
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const half = (list: Pt[]) => {
    const out: Pt[] = []
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop()
      out.push(p)
    }
    out.pop()
    return out
  }
  return [...half(pts), ...half([...pts].reverse())]
}

// The hull pushed out from its centre by `margin`, so the route keeps some land around it.
export function grown(hull: Pt[], margin: number): Pt[] {
  const cx = hull.reduce((s, p) => s + p[0], 0) / hull.length
  const cy = hull.reduce((s, p) => s + p[1], 0) / hull.length
  return hull.map(([x, y]) => {
    const d = Math.hypot(x - cx, y - cy) || 1
    return [x + ((x - cx) / d) * margin, y + ((y - cy) / d) * margin]
  })
}

type Inside = (p: Pt) => boolean
type Crossing = (a: Pt, b: Pt) => Pt

function clipEdge(points: Pt[], inside: Inside, crossing: Crossing): Pt[] {
  const out: Pt[] = []
  points.forEach((p, i) => {
    const prev = points[(i + points.length - 1) % points.length]
    if (inside(p)) {
      if (!inside(prev)) out.push(crossing(prev, p))
      out.push(p)
    } else if (inside(prev)) out.push(crossing(prev, p))
  })
  return out
}

const atX = (x: number) => (a: Pt, b: Pt): Pt => [x, a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0])]
const atY = (y: number) => (a: Pt, b: Pt): Pt => [a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]), y]

export function clippedToBox(flat: number[], w: number, h: number): number[] {
  let pts: Pt[] = []
  for (let i = 0; i < flat.length; i += 2) pts.push([flat[i], flat[i + 1]])
  pts = clipEdge(pts, (p) => p[0] >= 0, atX(0))
  pts = clipEdge(pts, (p) => p[0] <= w, atX(w))
  pts = clipEdge(pts, (p) => p[1] >= 0, atY(0))
  pts = clipEdge(pts, (p) => p[1] <= h, atY(h))
  return pts.flat()
}
