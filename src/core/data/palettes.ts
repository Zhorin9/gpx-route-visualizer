// Colour scales for values along the route, tuned to the warm look of the templates.
export interface Palette {
  id: PaletteId
  label: string
  // Low to high.
  stops: string[]
}

export type PaletteId = 'ember' | 'forest' | 'gold'

export const PALETTES: readonly Palette[] = [
  { id: 'ember', label: 'Żar', stops: ['#5a1a1a', '#a6301f', '#e0662a', '#f6a43a', '#ffe07a'] },
  { id: 'forest', label: 'Las', stops: ['#17302a', '#2f5a47', '#4f8a5e', '#9cc58a', '#e3f2c4'] },
  { id: 'gold', label: 'Złoto', stops: ['#4a3518', '#8a6326', '#c28d41', '#facb8d', '#fff4dc'] },
]

export function palette(id: PaletteId): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0]
}

// Colours are quantised: fewer distinct strokes to draw, and no visible difference.
export const COLOR_BINS = 32

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function mix(stops: string[], t: number): string {
  const scaled = Math.max(0, Math.min(1, t)) * (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(scaled))
  const f = scaled - i
  const a = hexToRgb(stops[i])
  const b = hexToRgb(stops[i + 1])
  const c = a.map((v, k) => Math.round(v + (b[k] - v) * f))
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

// Evenly spaced colours of the palette, low to high (or reversed).
export function paletteBins(p: Palette, inverted: boolean, bins = COLOR_BINS): string[] {
  const colors = Array.from({ length: bins }, (_, i) => mix(p.stops, bins === 1 ? 0.5 : i / (bins - 1)))
  return inverted ? colors.reverse() : colors
}

// Maps a value to a colour of the palette over [min, max]; values outside are clamped.
export function colorScale(p: Palette, domain: [number, number], inverted: boolean): (value: number) => string {
  const bins = paletteBins(p, inverted)
  const [min, max] = domain
  const span = max - min || 1
  return (value) => {
    if (!Number.isFinite(value)) return bins[0]
    const t = (value - min) / span
    return bins[Math.max(0, Math.min(bins.length - 1, Math.floor(t * bins.length)))]
  }
}

// CSS gradient of a palette, for swatches in the panel.
export function paletteCss(p: Palette, inverted = false, angle = 90): string {
  const stops = inverted ? [...p.stops].reverse() : p.stops
  return `linear-gradient(${angle}deg, ${stops.join(', ')})`
}
