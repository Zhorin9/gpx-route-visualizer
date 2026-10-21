import type { RouteTransform } from '../types'

export interface Point2D {
  x: number
  y: number
}

export interface NearestHit extends Point2D {
  // Fractional point index: segment start index + position along the segment.
  pos: number
}

// Closest point on the polyline (flat [x0, y0, ...]) between point indices
// fromIdx..toIdx, in the same coordinate space.
export function nearestPointOnPolyline(
  flat: ArrayLike<number>,
  x: number,
  y: number,
  fromIdx = 0,
  toIdx = flat.length / 2 - 1,
): NearestHit | null {
  let best: NearestHit | null = null
  let bestDist = Infinity

  for (let i = fromIdx; i < toIdx; i++) {
    const x1 = flat[i * 2]
    const y1 = flat[i * 2 + 1]
    const dx = flat[i * 2 + 2] - x1
    const dy = flat[i * 2 + 3] - y1
    const lenSq = dx * dx + dy * dy
    const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lenSq))
    const px = x1 + t * dx
    const py = y1 + t * dy
    const dist = (px - x) ** 2 + (py - y) ** 2
    if (dist < bestDist) {
      bestDist = dist
      best = { x: px, y: py, pos: i + t }
    }
  }

  return best
}

export function pointAt(flat: ArrayLike<number>, pos: number): Point2D {
  const count = flat.length / 2
  const clamped = Math.max(0, Math.min(count - 1, pos))
  const i = Math.min(Math.floor(clamped), count - 2)
  if (i < 0) return { x: flat[0] ?? 0, y: flat[1] ?? 0 }
  const t = clamped - i
  return {
    x: flat[i * 2] + (flat[i * 2 + 2] - flat[i * 2]) * t,
    y: flat[i * 2 + 1] + (flat[i * 2 + 3] - flat[i * 2 + 1]) * t,
  }
}

export interface IndexedLine {
  points: number[]
  // Track index of each kept vertex, so per-point data (speed, grade) can follow the line.
  positions: number[]
}

// Drops points closer than minDist to the previously kept one. Keeps the
// shape at display resolution while cutting 100k-point tracks down to size.
export function decimateIndexed(flat: ArrayLike<number>, fromIdx: number, toIdx: number, minDist = 1.5): IndexedLine {
  const points: number[] = []
  const positions: number[] = []
  if (toIdx < fromIdx) return { points, positions }
  const minDistSq = minDist * minDist
  let lastX = flat[fromIdx * 2]
  let lastY = flat[fromIdx * 2 + 1]
  points.push(lastX, lastY)
  positions.push(fromIdx)
  for (let i = fromIdx + 1; i < toIdx; i++) {
    const x = flat[i * 2]
    const y = flat[i * 2 + 1]
    if ((x - lastX) ** 2 + (y - lastY) ** 2 >= minDistSq) {
      points.push(x, y)
      positions.push(i)
      lastX = x
      lastY = y
    }
  }
  if (toIdx > fromIdx) {
    points.push(flat[toIdx * 2], flat[toIdx * 2 + 1])
    positions.push(toIdx)
  }
  return { points, positions }
}

// Fractional index where the cumulative distance reaches `target`.
export function posAtDistance(cum: ArrayLike<number>, fromIdx: number, toIdx: number, target: number): number {
  if (target <= cum[fromIdx]) return fromIdx
  if (target >= cum[toIdx]) return toIdx
  let lo = fromIdx
  let hi = toIdx
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (cum[mid] < target) lo = mid
    else hi = mid
  }
  const span = cum[hi] - cum[lo]
  return lo + (span > 0 ? (target - cum[lo]) / span : 0)
}

// Same transform Konva applies to a Group: translate, rotate, then scale.
export function applyTransform(p: Point2D, t: RouteTransform): Point2D {
  const rad = (t.rotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const sx = p.x * t.scaleX
  const sy = p.y * t.scaleY
  return { x: t.x + sx * cos - sy * sin, y: t.y + sx * sin + sy * cos }
}
