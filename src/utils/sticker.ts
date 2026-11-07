import { contrastRatio } from './color'

export const STICKER_INK = '#241a26'

export const STICKER_COLORS = [
  { name: 'Róż', hex: '#f2b8f5' },
  { name: 'Limonka', hex: '#d7f25a' },
  { name: 'Pomarańcz', hex: '#ff8a3d' },
  { name: 'Błękit', hex: '#8fd8ff' },
  { name: 'Żółty', hex: '#ffe14d' },
  { name: 'Biały', hex: '#fbf7ee' },
] as const

// One colour for the title, dates, figures, route and icons of a sticker style.
export interface StickerSettings {
  // photo: the set's colour that stands out most from the background; series: the next one on each slide.
  mode: 'manual' | 'photo' | 'series'
  color: string
}

export function mostContrasting(background: string): string {
  return STICKER_COLORS.reduce((best, c) => (contrastRatio(c.hex, background) > contrastRatio(best, background) ? c.hex : best), STICKER_COLORS[0].hex as string)
}

// Without a known background colour (photos under the elements) the chosen colour stays.
export function stickerColor(settings: StickerSettings, slide: number, background: string | null): string {
  if (settings.mode === 'photo') return background ? mostContrasting(background) : settings.color
  if (settings.mode === 'manual') return settings.color
  const start = Math.max(0, STICKER_COLORS.findIndex((c) => c.hex === settings.color))
  return STICKER_COLORS[(start + slide) % STICKER_COLORS.length].hex
}
