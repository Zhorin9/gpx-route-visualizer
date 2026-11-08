import type { GradientStyle } from '../types'
import type { TKey } from '../i18n'

export const GRADIENT_PRESETS: { name: TKey; from: string; to: string }[] = [
  { name: 'gradients.goldenHour', from: '#a06f24', to: '#444141' },
  { name: 'gradients.forest', from: '#2f5a47', to: '#17302a' },
  { name: 'gradients.sea', from: '#2a7396', to: '#1b3550' },
  { name: 'gradients.dusk', from: '#8a3a3d', to: '#2f1f3d' },
  { name: 'gradients.rust', from: '#b0592a', to: '#552a1f' },
  { name: 'gradients.graphite', from: '#7d7979', to: '#2d2b2b' },
  { name: 'gradients.sand', from: '#ffe3bf', to: '#e1ad66' },
  { name: 'gradients.mist', from: '#f8f4f4', to: '#d7d3d3' },
]

export function gradientPresetName(gradient: Pick<GradientStyle, 'from' | 'to'>): TKey | null {
  const from = gradient.from.toLowerCase()
  const to = gradient.to.toLowerCase()
  return GRADIENT_PRESETS.find((p) => p.from === from && p.to === to)?.name ?? null
}
