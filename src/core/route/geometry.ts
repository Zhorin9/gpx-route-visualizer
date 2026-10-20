import { decimateIndexed, pointAt, posAtDistance, type IndexedLine } from '../../utils/geometry'
import { memoOne } from '../../utils/memo'
import { schematicizeRoute } from '../../utils/schematicRoute'
import type { RouteDay, RouteRange, RouteShape } from '../../types'

// One stroke of the route, in route-group coordinates.
export interface RouteSegment extends IndexedLine {
  // completed: drawn with the route style; remaining: the faint "ghost" ahead of the head.
  role: 'completed' | 'remaining'
  // Set on multi-day routes: the day supplies colour and dash.
  day?: RouteDay
  // Schematic routes have sharp corners.
  square: boolean
}

export interface RouteGeometry {
  // Whole visible range, decimated: hit testing and the route's bounds.
  active: number[]
  segments: RouteSegment[]
  // End of the drawn part, while it is shorter than the whole range.
  head: { x: number; y: number; pos: number } | null
}

export interface RouteGeometryInput {
  projected: Float64Array | null
  cum: Float64Array | null
  range: RouteRange
  // 0-100 by distance; the static "progress" setting.
  progress: number
  days: RouteDay[]
  shape: RouteShape
  simplify: number
  // Fractional track index the route is drawn up to (animation); overrides `progress`.
  head: number | null
}

const EMPTY: RouteGeometry = { active: [], segments: [], head: null }

// Cut point on a line by track position; vertices keep their own positions.
function splitLine(line: IndexedLine, pos: number): [IndexedLine, IndexedLine] {
  const { points, positions } = line
  const n = positions.length
  if (n === 0 || pos <= positions[0]) return [{ points: [], positions: [] }, line]
  if (pos >= positions[n - 1]) return [line, { points: [], positions: [] }]
  let i = 0
  while (i + 1 < n && positions[i + 1] <= pos) i++
  const t = (pos - positions[i]) / (positions[i + 1] - positions[i] || 1)
  const x = points[i * 2] + (points[i * 2 + 2] - points[i * 2]) * t
  const y = points[i * 2 + 1] + (points[i * 2 + 3] - points[i * 2 + 1]) * t
  return [
    { points: [...points.slice(0, (i + 1) * 2), x, y], positions: [...positions.slice(0, i + 1), pos] },
    { points: [x, y, ...points.slice((i + 1) * 2)], positions: [pos, ...positions.slice(i + 1)] },
  ]
}

// Schematic output has its own vertices; their track positions are spread by length along the line.
function schematicLine(line: IndexedLine, simplify: number): IndexedLine {
  if (line.points.length < 4) return line
  const points = schematicizeRoute(line.points, { simplify })
  const from = line.positions[0]
  const to = line.positions[line.positions.length - 1]
  const lengths = [0]
  for (let i = 2; i < points.length; i += 2) {
    lengths.push(lengths[lengths.length - 1] + Math.hypot(points[i] - points[i - 2], points[i + 1] - points[i - 1]))
  }
  const total = lengths[lengths.length - 1] || 1
  return { points, positions: lengths.map((l) => from + ((to - from) * l) / total) }
}

function headPoint(projected: Float64Array, pos: number) {
  return { ...pointAt(projected, pos), pos }
}

// Natural single-day route split by the static progress or the animation head.
// Kept vertex for vertex as before: the drawn part is decimated up to the split, the rest after it.
function naturalSegments(projected: Float64Array, cum: Float64Array, input: RouteGeometryInput, active: IndexedLine): RouteGeometry {
  const { start, end } = input.range
  const square = false
  const progressHead = input.progress >= 100 ? null : input.progress <= 0 ? start : posAtDistance(cum, start, end, cum[start] + ((cum[end] - cum[start]) * input.progress) / 100)
  const head = input.head ?? progressHead
  if (head == null || head >= end) {
    return { active: active.points, segments: [{ ...active, role: 'completed', square }], head: null }
  }
  if (head <= start) {
    return { active: active.points, segments: [{ ...active, role: 'remaining', square }], head: headPoint(projected, start) }
  }
  const splitIdx = Math.floor(head)
  const split = pointAt(projected, head)
  const done = decimateIndexed(projected, start, splitIdx)
  done.points.push(split.x, split.y)
  done.positions.push(head)
  const rest = splitIdx + 1 <= end ? decimateIndexed(projected, splitIdx + 1, end) : { points: [], positions: [] }
  const ahead = { points: [split.x, split.y, ...rest.points], positions: [head, ...rest.positions] }
  return {
    active: active.points,
    segments: [
      { ...ahead, role: 'remaining', square },
      { ...done, role: 'completed', square },
    ],
    head: headPoint(projected, head),
  }
}

// Lines to draw for the visible range. Multi-day and schematic routes follow only the
// animation head; the static progress setting applies to a natural single route, as before.
export function buildRouteGeometry(input: RouteGeometryInput): RouteGeometry {
  const { projected, cum, range, days, shape, simplify, head } = input
  if (!projected || !cum || range.end <= range.start) return EMPTY
  const active = decimateIndexed(projected, range.start, range.end)
  const square = shape === 'schematic'

  const lines: { line: IndexedLine; day?: RouteDay }[] =
    days.length >= 2
      ? days
          .filter((d) => d.visible)
          .map((day) => {
            const from = Math.max(range.start, day.startIdx)
            const to = Math.min(range.end, day.endIdx)
            const line = to > from ? decimateIndexed(projected, from, to) : { points: [], positions: [] }
            return { line: square ? schematicLine(line, simplify) : line, day }
          })
      : square
        ? [{ line: schematicLine(active, simplify) }]
        : []

  if (!lines.length) return naturalSegments(projected, cum, input, active)

  const segments: RouteSegment[] = []
  const drawn: RouteSegment[] = []
  for (const { line, day } of lines) {
    if (line.points.length < 4) continue
    if (head == null) {
      drawn.push({ ...line, role: 'completed', day, square })
      continue
    }
    const [done, ahead] = splitLine(line, head)
    if (ahead.points.length >= 4) segments.push({ ...ahead, role: 'remaining', day, square })
    if (done.points.length >= 4) drawn.push({ ...done, role: 'completed', day, square })
  }
  // Ghosts first, so every drawn line sits on top of them.
  return {
    active: active.points,
    segments: [...segments, ...drawn],
    head: head != null && head < range.end ? headPoint(projected, Math.max(head, range.start)) : null,
  }
}

export const routeGeometry = memoOne(
  (
    projected: Float64Array | null,
    cum: Float64Array | null,
    range: RouteRange,
    progress: number,
    days: RouteDay[],
    shape: RouteShape,
    simplify: number,
    head: number | null,
  ): RouteGeometry => buildRouteGeometry({ projected, cum, range, progress, days, shape, simplify, head }),
)
