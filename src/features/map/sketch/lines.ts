import type { Pt } from './pen'

export interface Rect {
  x0: number
  y0: number
  x1: number
  y1: number
}

const closed = (line: Pt[]) => line.length > 2 && line[0][0] === line[line.length - 1][0] && line[0][1] === line[line.length - 1][1]
export const inside = (p: Pt, r: Rect) => p[0] >= r.x0 && p[0] <= r.x1 && p[1] >= r.y0 && p[1] <= r.y1

// Liang–Barsky; also where along a→b the clipped part starts and ends.
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

// A ring is opened where it is first outside.
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

function addTo<T>(map: Map<string, T[]>, key: string, value: T) {
  const list = map.get(key)
  if (list) list.push(value)
  else map.set(key, [value])
}

const cellOf = (p: Pt, size: number) => `${Math.floor(p[0] / size)},${Math.floor(p[1] / size)}`

function neighbourCells(p: Pt, size: number): string[] {
  const cx = Math.floor(p[0] / size)
  const cy = Math.floor(p[1] / size)
  const cells: string[] = []
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) cells.push(`${cx + dx},${cy + dy}`)
  return cells
}

export function joinLines(lines: Pt[][], within: number): Pt[][] {
  const endsByCell = new Map<string, { line: number; head: boolean }[]>()
  const file = (line: number, head: boolean) => {
    const at = head ? lines[line][0] : lines[line][lines[line].length - 1]
    addTo(endsByCell, cellOf(at, within), { line, head })
  }
  lines.forEach((_, i) => {
    file(i, true)
    file(i, false)
  })
  const used = lines.map(() => false)
  const meeting = (at: Pt) => {
    for (const key of neighbourCells(at, within)) {
      for (const end of endsByCell.get(key) ?? []) {
        if (used[end.line]) continue
        const p = end.head ? lines[end.line][0] : lines[end.line][lines[end.line].length - 1]
        if (Math.hypot(p[0] - at[0], p[1] - at[1]) <= within) return end
      }
    }
    return null
  }
  const joined: Pt[][] = []
  lines.forEach((first, i) => {
    if (used[i]) return
    used[i] = true
    let line = first
    for (let tail = meeting(line[line.length - 1]); tail; tail = meeting(line[line.length - 1])) {
      used[tail.line] = true
      const next = tail.head ? lines[tail.line] : [...lines[tail.line]].reverse()
      line = [...line, ...next.slice(1)]
    }
    for (let head = meeting(line[0]); head; head = meeting(line[0])) {
      used[head.line] = true
      const before = head.head ? [...lines[head.line]].reverse() : lines[head.line]
      line = [...before.slice(0, -1), ...line]
    }
    joined.push(line)
  })
  return joined
}

function alongEvery(line: Pt[], spacing: number): Pt[] {
  const out: Pt[] = [line[0]]
  for (let i = 1; i < line.length; i++) {
    const [ax, ay] = line[i - 1]
    const [bx, by] = line[i]
    const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / spacing))
    for (let j = 1; j <= steps; j++) out.push([ax + ((bx - ax) * j) / steps, ay + ((by - ay) * j) / steps])
  }
  return out
}

const MOSTLY_ALONGSIDE = 0.7

export function withoutParallels(lines: Pt[][], gap: number): Pt[][] {
  const lengthOf = (l: Pt[]) => l.reduce((sum, p, i) => (i ? sum + Math.hypot(p[0] - l[i - 1][0], p[1] - l[i - 1][1]) : 0), 0)
  const keptByCell = new Map<string, Pt[]>()
  const nearKept = (p: Pt) => neighbourCells(p, gap).some((key) => (keptByCell.get(key) ?? []).some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) <= gap))
  const kept: Pt[][] = []
  for (const line of [...lines].sort((a, b) => lengthOf(b) - lengthOf(a))) {
    const along = alongEvery(line, gap / 2)
    if (along.filter(nearKept).length >= along.length * MOSTLY_ALONGSIDE) continue
    kept.push(line)
    for (const p of along) addTo(keptByCell, cellOf(p, gap), p)
  }
  return kept
}

export function rounded(line: Pt[], passes: number): Pt[] {
  let pts = line
  for (let k = 0; k < passes && pts.length > 2; k++) {
    const next: Pt[] = [pts[0]]
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i]
      const [bx, by] = pts[i + 1]
      next.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75])
    }
    next.push(pts[pts.length - 1])
    pts = next
  }
  return pts
}
