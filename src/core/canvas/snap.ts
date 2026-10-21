export interface Box {
  x: number
  y: number
  width: number
  height: number
}

export interface Snap {
  dx: number
  dy: number
  // Guide lines as [x1, y1, x2, y2], spanning the dragged box and the box it lines up with.
  guides: number[][]
}

const AXES = [
  { pos: 'x', size: 'width' },
  { pos: 'y', size: 'height' },
] as const
type Axis = (typeof AXES)[number]

// Where a box can line up along one axis: its start, middle and end.
function stops(start: number, size: number) {
  return [start, start + size / 2, start + size]
}

// The closest line-up within the threshold: middle to middle, or an edge to either edge.
function nearest(box: Box, targets: Box[], { pos, size }: Axis, threshold: number) {
  let best: { delta: number; at: number; target: Box } | null = null
  for (const target of targets) {
    const to = stops(target[pos], target[size])
    for (const [i, from] of stops(box[pos], box[size]).entries()) {
      for (const [j, at] of to.entries()) {
        const delta = at - from
        if ((i === 1) === (j === 1) && Math.abs(delta) < threshold && (!best || Math.abs(delta) < Math.abs(best.delta))) best = { delta, at, target }
      }
    }
  }
  return best
}

// Each axis snaps on its own, so a box can be centred horizontally and still move freely up and down.
export function snapBox(box: Box, targets: Box[], threshold: number): Snap {
  const [sx, sy] = AXES.map((axis) => nearest(box, targets, axis, threshold))
  const moved = { ...box, x: box.x + (sx?.delta ?? 0), y: box.y + (sy?.delta ?? 0) }
  const guides: number[][] = []
  if (sx) guides.push([sx.at, Math.min(moved.y, sx.target.y), sx.at, Math.max(moved.y + moved.height, sx.target.y + sx.target.height)])
  if (sy) guides.push([Math.min(moved.x, sy.target.x), sy.at, Math.max(moved.x + moved.width, sy.target.x + sy.target.width), sy.at])
  return { dx: sx?.delta ?? 0, dy: sy?.delta ?? 0, guides }
}
