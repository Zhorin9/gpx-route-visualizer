import { flatBounds } from './gpx'
import type { Point2D } from './geometry'
import { clamp } from './math'

function flatToPoints(flat: ArrayLike<number>): Point2D[] {
  const pts: Point2D[] = []
  for (let i = 0; i + 1 < flat.length; i += 2) pts.push({ x: flat[i], y: flat[i + 1] })
  return pts
}

function pointsToFlat(pts: Point2D[]): number[] {
  const flat: number[] = []
  pts.forEach((p) => flat.push(p.x, p.y))
  return flat
}

function perpendicularDistance(p: Point2D, a: Point2D, b: Point2D): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSq = dx * dx + dy * dy
  if (lengthSq === 0) return Math.hypot(p.x - a.x, p.y - a.y)
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq
  const projX = a.x + t * dx
  const projY = a.y + t * dy
  return Math.hypot(p.x - projX, p.y - projY)
}

// Ramer–Douglas–Peucker.
function simplify(points: Point2D[], epsilon: number): Point2D[] {
  if (points.length < 3) return points
  const first = points[0]
  const last = points[points.length - 1]
  let maxDist = 0
  let index = 0
  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], first, last)
    if (dist > maxDist) {
      maxDist = dist
      index = i
    }
  }
  if (maxDist > epsilon) {
    const left = simplify(points.slice(0, index + 1), epsilon)
    const right = simplify(points.slice(index), epsilon)
    return [...left.slice(0, -1), ...right]
  }
  return [first, last]
}

function dist(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

// An out-and-back spur simplifies differently each way and would become two parallel staircases;
// corners stepping back over covered ground snap to the earlier one (points are never deleted).
function alignRetraces(points: Point2D[], tolerance: number): Point2D[] {
  if (tolerance <= 0 || points.length < 3) return points
  const out = points.map((p) => ({ x: p.x, y: p.y }))
  const indexStack = [0]
  for (let i = 1; i < out.length; i++) {
    if (indexStack.length >= 2) {
      const beforeTop = out[indexStack[indexStack.length - 2]]
      if (dist(out[i], beforeTop) <= tolerance) {
        out[i] = { x: beforeTop.x, y: beforeTop.y }
        indexStack.pop()
        continue
      }
    }
    indexStack.push(i)
  }
  return out
}

function dedupeConsecutive(points: Point2D[]): Point2D[] {
  const out: Point2D[] = []
  for (const p of points) {
    const last = out[out.length - 1]
    if (!last || last.x !== p.x || last.y !== p.y) out.push(p)
  }
  return out
}

// The longer axis goes first, so the path still tracks the direction of travel.
function toOrthogonalPath(points: Point2D[]): Point2D[] {
  if (points.length < 2) return points
  const result: Point2D[] = [points[0]]
  for (let i = 1; i < points.length; i++) {
    const prev = result[result.length - 1]
    const curr = points[i]
    const dx = Math.abs(curr.x - prev.x)
    const dy = Math.abs(curr.y - prev.y)
    if (dx > 0.5 && dy > 0.5) {
      const corner = dx >= dy ? { x: curr.x, y: prev.y } : { x: prev.x, y: curr.y }
      result.push(corner)
    }
    result.push(curr)
  }
  return dedupeConsecutive(result)
}

export interface SchematicOptions {
  // 0-100: how aggressively to simplify. Higher = blockier.
  simplify?: number
}

export function schematicizeRoute(flatPoints: ArrayLike<number>, { simplify: amount = 40 }: SchematicOptions = {}): number[] {
  const points = flatToPoints(flatPoints)
  if (points.length < 2) return Array.from(flatPoints)

  const b = flatBounds(flatPoints)
  const diagonal = Math.hypot(b.maxX - b.minX, b.maxY - b.minY) || 1

  const t = clamp(amount, 0, 100) / 100
  const epsilon = diagonal * (0.01 + t * 0.09)

  const simplified = dedupeConsecutive(simplify(points, epsilon))
  if (simplified.length < 2) return Array.from(flatPoints)
  const aligned = dedupeConsecutive(alignRetraces(simplified, epsilon))
  if (aligned.length < 2) return Array.from(flatPoints)
  const orthogonal = toOrthogonalPath(aligned)
  return pointsToFlat(orthogonal)
}
