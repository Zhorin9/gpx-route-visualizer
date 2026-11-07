import type { TextWarp } from '../types'

export interface Glyph {
  ch: string
  // Centre of the letter's box, relative to the warped text's top-left corner.
  x: number
  y: number
  rotation: number
  scaleY: number
}

export interface WarpedLine {
  glyphs: Glyph[]
  width: number
  height: number
}

// The widest an arc may bend, so its ends never meet.
const MAX_ARC = Math.PI * 1.6

// One line of letters laid on a curve: a wave, an arc or a bulge. `advances` are each letter's widths.
// amount: wave height and bulge growth in % of the font size, arc bend in % of a full circle (negative bends down).
// length: the wave's period, in font sizes.
export function warpLine(chars: string[], advances: number[], fontSize: number, warp: TextWarp): WarpedLine {
  const total = advances.reduce((a, b) => a + b, 0)
  let along = 0
  const raw = chars.map((ch, i) => {
    const s = along + advances[i] / 2 - total / 2
    along += advances[i]
    return { ch, s }
  })

  const placed = raw.map(({ ch, s }) => {
    if (warp.kind === 'wave') {
      const period = Math.max(0.5, warp.length ?? 4) * fontSize
      const k = (2 * Math.PI) / period
      const amp = (warp.amount / 100) * fontSize
      return { ch, x: s, y: -amp * Math.sin(k * s), rotation: (-Math.atan(amp * k * Math.cos(k * s)) * 180) / Math.PI, scaleY: 1 }
    }
    if (warp.kind === 'arc') {
      const bend = Math.max(-MAX_ARC, Math.min(MAX_ARC, (warp.amount / 100) * 2 * Math.PI))
      if (Math.abs(bend) < 1e-3) return { ch, x: s, y: 0, rotation: 0, scaleY: 1 }
      const radius = total / bend
      const phi = s / radius
      return { ch, x: radius * Math.sin(phi), y: radius * (1 - Math.cos(phi)), rotation: (phi * 180) / Math.PI, scaleY: 1 }
    }
    // Bulge: the middle letters grow, the ends stay; the baseline stays put.
    const grow = 1 + (warp.amount / 100) * Math.cos((Math.PI * s) / Math.max(total, 1))
    return { ch, x: s, y: (-(grow - 1) * fontSize) / 2, rotation: 0, scaleY: grow }
  })

  // A letter's box reaches half a font size around its centre (more when it grows).
  const reach = (g: (typeof placed)[number]) => (fontSize * Math.max(1, g.scaleY)) / 2
  const minX = Math.min(...placed.map((g) => g.x - fontSize / 2), -total / 2)
  const maxX = Math.max(...placed.map((g) => g.x + fontSize / 2), total / 2)
  const minY = Math.min(...placed.map((g) => g.y - reach(g)))
  const maxY = Math.max(...placed.map((g) => g.y + reach(g)))
  return {
    glyphs: placed.map((g) => ({ ...g, x: g.x - minX, y: g.y - minY })),
    width: maxX - minX,
    height: maxY - minY,
  }
}
