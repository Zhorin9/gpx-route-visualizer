import type { Box } from '../utils/leader'
import type { PhotoMarker, PointStyle } from '../types'

export const MARKER_WIDTHS: Record<PointStyle['size'], number> = { S: 120, M: 180, L: 260 }

// Outer size of each marker for a photo `w` wide.
export function markerSize(marker: PhotoMarker, w: number) {
  if (marker === 'circle') return { w: w * 0.75, h: w * 0.75 }
  if (marker === 'polaroid') return { w, h: w * 0.05 + (w * 0.9 * 3) / 4 + w * 0.15 }
  if (marker === 'film') return { w, h: w * 0.7 }
  return { w, h: w * 0.78 }
}

// Where the photo stands over its name, in the label's own pixels; null without one.
export function photoBox(style: PointStyle, gap: number): Box | null {
  if (style.marker === 'label') return null
  const { w, h } = markerSize(style.marker, MARKER_WIDTHS[style.size])
  return { x: 0, y: -h - gap, w, h }
}
