export interface Box {
  x: number
  y: number
  w: number
  h: number
}

// The smallest box holding both.
export const unionBox = (a: Box, b: Box): Box => {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y }
}

// Where a line from the origin, aimed at the box's middle, meets the box's edge;
// null when the origin is inside the box and there is nothing to draw.
export function leaderEnd(box: Box): [number, number] | null {
  const cx = box.x + box.w / 2
  const cy = box.y + box.h / 2
  // The line is inside the box past this far along it (0 = origin, 1 = middle), one axis at a time.
  const enter = (c: number, half: number) => (c === 0 ? -Infinity : 1 - half / Math.abs(c))
  const t = Math.max(enter(cx, box.w / 2), enter(cy, box.h / 2))
  return t > 0 ? [cx * t, cy * t] : null
}
