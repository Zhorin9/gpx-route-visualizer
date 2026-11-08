import { mixHex } from '../../utils/color'
import type { TKey } from '../../i18n'
import { clamp, clamp01 } from '../../utils/math'

export interface Palette {
  id: PaletteId
  label: TKey
  // Low to high.
  stops: string[]
}

export type PaletteId = 'ember' | 'forest' | 'gold'

export const PALETTES: readonly Palette[] = [
  { id: 'ember', label: 'palettes.ember', stops: ['#5a1a1a', '#a6301f', '#e0662a', '#f6a43a', '#ffe07a'] },
  { id: 'forest', label: 'palettes.forest', stops: ['#17302a', '#2f5a47', '#4f8a5e', '#9cc58a', '#e3f2c4'] },
  { id: 'gold', label: 'palettes.gold', stops: ['#4a3518', '#8a6326', '#c28d41', '#facb8d', '#fff4dc'] },
]

export function palette(id: PaletteId): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0]
}

// Colours are quantised: fewer distinct strokes to draw, and no visible difference.
export const COLOR_BINS = 32

function mix(stops: string[], t: number): string {
  const scaled = clamp01(t) * (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(scaled))
  return mixHex(stops[i], stops[i + 1], scaled - i)
}

export function paletteBins(p: Palette, inverted: boolean, bins = COLOR_BINS): string[] {
  const colors = Array.from({ length: bins }, (_, i) => mix(p.stops, bins === 1 ? 0.5 : i / (bins - 1)))
  return inverted ? colors.reverse() : colors
}

// Values outside the domain are clamped.
export function colorScale(p: Palette, domain: [number, number], inverted: boolean): (value: number) => string {
  return binScale(paletteBins(p, inverted), domain)
}

export function binScale(bins: readonly string[], domain: [number, number]): (value: number) => string {
  const [min, max] = domain
  const span = max - min || 1
  return (value) => {
    if (!Number.isFinite(value)) return bins[0]
    const t = (value - min) / span
    return bins[clamp(Math.floor(t * bins.length), 0, bins.length - 1)]
  }
}

export interface GradientStop {
  // 0-1
  at: number
  color: string
}

export const paletteStops = (p: Palette): GradientStop[] => p.stops.map((color, i) => ({ at: i / (p.stops.length - 1), color }))

// `stops` must be sorted by `at`.
export function mixStops(stops: readonly GradientStop[], t: number): string {
  const next = stops.findIndex((s) => s.at >= t)
  if (next <= 0) return (next === 0 ? stops[0] : stops[stops.length - 1]).color
  const a = stops[next - 1]
  const b = stops[next]
  return mix([a.color, b.color], (t - a.at) / (b.at - a.at || 1))
}

export const stopsCss = (stops: readonly GradientStop[]) => `linear-gradient(90deg, ${stops.map((s) => `${s.color} ${Math.round(s.at * 100)}%`).join(', ')})`

export function paletteCss(p: Palette, inverted = false, angle = 90): string {
  const stops = inverted ? [...p.stops].reverse() : p.stops
  return `linear-gradient(${angle}deg, ${stops.join(', ')})`
}
