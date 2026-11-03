// A pen's tremble that is the same every time: seeded numbers, never Math.random.
export type Pt = [number, number]

// mulberry32
export function rng(seed: number): () => number {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Three sines with seeded phases: smooth along the line, never jagged. About -1 to 1.
// `wave` is the length of the slowest one.
export function noise(seed: number, wave: number): (d: number) => number {
  const r = rng(seed)
  const waves = [0, 1, 2].map((i) => ({ f: ((0.8 + r() * 1.2) * (i + 1) * Math.PI * 2) / wave, p: r() * Math.PI * 2, a: 1 / (i + 1) }))
  return (d) => waves.reduce((v, w) => v + w.a * Math.sin(d * w.f + w.p), 0) / 1.83
}

// The line cut every `step` and each point moved across it by `amp` × noise of the distance so far.
export function jitter(pts: Pt[], seed: number, amp: number, step: number): Pt[] {
  if (pts.length < 2) return pts
  const n = noise(seed, step * 100)
  const out: Pt[] = []
  let d = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[i + 1]
    const len = Math.hypot(x2 - x1, y2 - y1) || 1
    const nx = -(y2 - y1) / len
    const ny = (x2 - x1) / len
    const steps = Math.ceil(len / step)
    for (let j = 0; j < steps; j++) {
      const t = j / steps
      const o = amp * n(d + len * t)
      out.push([x1 + (x2 - x1) * t + nx * o, y1 + (y2 - y1) * t + ny * o])
    }
    d += len
  }
  const [x, y] = pts[pts.length - 1]
  const o = amp * n(d)
  const [px, py] = out[out.length - 1]
  const len = Math.hypot(x - px, y - py) || 1
  out.push([x - ((y - py) / len) * o, y + ((x - px) / len) * o])
  return out
}

// The same tremble on a flat [x0, y0, x1, y1, …] line, point for point (a track keeps its indices).
export function wobble(flat: Float64Array, seed: number, amp: number, wave: number): Float64Array {
  const n = noise(seed, wave)
  const out = new Float64Array(flat.length)
  const count = flat.length / 2
  let d = 0
  for (let i = 0; i < count; i++) {
    const a = Math.max(0, i - 1)
    const b = Math.min(count - 1, i + 1)
    const dx = flat[b * 2] - flat[a * 2]
    const dy = flat[b * 2 + 1] - flat[a * 2 + 1]
    const len = Math.hypot(dx, dy) || 1
    if (i > 0) d += Math.hypot(flat[i * 2] - flat[i * 2 - 2], flat[i * 2 + 1] - flat[i * 2 - 1])
    const o = amp * n(d)
    out[i * 2] = flat[i * 2] - (dy / len) * o
    out[i * 2 + 1] = flat[i * 2 + 1] + (dx / len) * o
  }
  return out
}

// A number for the route (its points, not its place in memory), so the same route sketches the same.
export function routeSeed(points: { lat: number; lon: number }[]): number {
  let h = 2166136261
  const step = Math.max(1, Math.floor(points.length / 64))
  for (let i = 0; i < points.length; i += step) {
    for (const c of `${points[i].lat.toFixed(5)},${points[i].lon.toFixed(5)};`) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  }
  return (h >>> 0) % 100000
}
