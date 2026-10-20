import type { GradientStyle } from '../types'

export const GRADIENT_PRESETS: { name: string; from: string; to: string }[] = [
  { name: 'Złota godzina', from: '#a06f24', to: '#444141' },
  { name: 'Las', from: '#2f5a47', to: '#17302a' },
  { name: 'Morze', from: '#2a7396', to: '#1b3550' },
  { name: 'Zmierzch', from: '#8a3a3d', to: '#2f1f3d' },
  { name: 'Rdza', from: '#b0592a', to: '#552a1f' },
  { name: 'Grafit', from: '#7d7979', to: '#2d2b2b' },
  { name: 'Piasek', from: '#ffe3bf', to: '#e1ad66' },
  { name: 'Mgła', from: '#f8f4f4', to: '#d7d3d3' },
]

export function gradientPresetName(gradient: Pick<GradientStyle, 'from' | 'to'>): string | null {
  const from = gradient.from.toLowerCase()
  const to = gradient.to.toLowerCase()
  return GRADIENT_PRESETS.find((p) => p.from === from && p.to === to)?.name ?? null
}
