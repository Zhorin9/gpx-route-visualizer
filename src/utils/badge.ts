import type { BadgeShape } from '../types'

// The outline of a badge around a w×h text box, centred on (0, 0), as flat x,y pairs.
// Generated from the shape alone, so the same badge is drawn the same every time.
export function badgeOutline(shape: BadgeShape, w: number, h: number): number[] {
  if (shape === 'ribbon') {
    // A band wider than the text, its ends cut in a notch.
    const hw = w / 2 + h * 0.9
    const hh = h / 2 + h * 0.25
    const notch = hh * 0.9
    return [-hw, -hh, hw, -hh, hw - notch, 0, hw, hh, -hw, hh, -hw + notch, 0]
  }
  // Round shapes are ellipses through the text box's corners, with a little room to spare.
  const rx = (w / 2) * Math.SQRT2 * 1.08
  const ry = (h / 2) * Math.SQRT2 * 1.25
  const spikes = shape === 'burst' ? 14 : shape === 'star' ? 5 : 0
  if (!spikes) return ellipse(rx, ry, 48)
  // Spikes reach out from the ellipse; a star's dips go deeper than a burst's.
  const dip = shape === 'burst' ? 0.82 : 0.62
  const out = shape === 'burst' ? 1.22 : 1.35
  const points: number[] = []
  for (let k = 0; k < spikes * 2; k++) {
    const a = (k / (spikes * 2)) * Math.PI * 2 - Math.PI / 2
    const r = k % 2 ? dip : out
    points.push(Math.cos(a) * rx * r, Math.sin(a) * ry * r)
  }
  return points
}

function ellipse(rx: number, ry: number, steps: number): number[] {
  const points: number[] = []
  for (let k = 0; k < steps; k++) {
    const a = (k / steps) * Math.PI * 2
    points.push(Math.cos(a) * rx, Math.sin(a) * ry)
  }
  return points
}
