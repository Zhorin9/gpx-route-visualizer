import type { Pt } from './pen'
import type { SketchPlace } from './tiles'

export type Settlement = Exclude<SketchPlace['kind'], 'water'>

export interface Glyph {
  lines: Pt[][]
  halfWidth: number
}

function house(cx: number, width: number, wall: number): Pt[] {
  const l = cx - width / 2
  const r = cx + width / 2
  return [[l, 0], [l, -wall], [cx, -wall - width * 0.6], [r, -wall], [r, 0]]
}

function tower(cx: number, width: number, wall: number): Pt[][] {
  const l = cx - width / 2
  const r = cx + width / 2
  const tip = -wall - width * 1.6
  return [
    [[l, 0], [l, -wall], [cx, tip], [r, -wall], [r, 0]],
    [[cx, tip], [cx, tip - width * 0.7]],
    [[cx - width * 0.3, tip - width * 0.45], [cx + width * 0.3, tip - width * 0.45]],
  ]
}

const SHAPES: Record<Settlement, { lines: Pt[][]; halfWidth: number }> = {
  village: { lines: [house(0, 2, 1.4), [[-1.6, 0], [1.6, 0]]], halfWidth: 1.6 },
  town: { lines: [house(-1.3, 1.8, 1.2), ...tower(1, 1.2, 1.6), [[-2.6, 0], [2.2, 0]]], halfWidth: 2.6 },
  city: { lines: [house(-2.6, 1.6, 1.6), house(-0.9, 1.6, 2.6), ...tower(0.9, 1.3, 3), house(2.6, 1.6, 1.2), [[-3.8, 0], [3.8, 0]]], halfWidth: 3.8 },
}

export function settlementGlyph(kind: Settlement, unit: number): Glyph {
  const { lines, halfWidth } = SHAPES[kind]
  const top = Math.min(...lines.flat().map(([, y]) => y))
  return { lines: lines.map((line) => line.map(([x, y]): Pt => [x * unit, (y - top / 2) * unit])), halfWidth: halfWidth * unit }
}
