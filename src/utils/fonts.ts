import type { SelectOption } from '../types'

interface FontDef {
  family: string
  category: string
  // Weight used for "normal" text; some families only look right heavier.
  weight: number
  boldWeight: number
  load: () => Promise<unknown>
}

// Self-hosted via @fontsource and loaded only once a font is actually used —
// no requests to Google's CDN (GDPR) and no 32-family upfront download.
const FONTS: FontDef[] = [
  { family: 'Architects Daughter', category: 'odręczny', weight: 400, boldWeight: 400, load: () => import('@fontsource/architects-daughter/400.css') },
  { family: 'Patrick Hand', category: 'odręczny', weight: 400, boldWeight: 400, load: () => import('@fontsource/patrick-hand/400.css') },
  { family: 'Gochi Hand', category: 'odręczny', weight: 400, boldWeight: 400, load: () => import('@fontsource/gochi-hand/400.css') },
  { family: 'Indie Flower', category: 'odręczny', weight: 400, boldWeight: 400, load: () => import('@fontsource/indie-flower/400.css') },
  { family: 'Shadows Into Light', category: 'odręczny', weight: 400, boldWeight: 400, load: () => import('@fontsource/shadows-into-light/400.css') },
  { family: 'Handlee', category: 'odręczny', weight: 400, boldWeight: 400, load: () => import('@fontsource/handlee/400.css') },
  { family: 'Caveat', category: 'kursywa', weight: 600, boldWeight: 700, load: () => Promise.all([import('@fontsource/caveat/600.css'), import('@fontsource/caveat/700.css')]) },
  { family: 'Dancing Script', category: 'elegancka kursywa', weight: 700, boldWeight: 700, load: () => import('@fontsource/dancing-script/700.css') },
  { family: 'Satisfy', category: 'kursywa', weight: 400, boldWeight: 400, load: () => import('@fontsource/satisfy/400.css') },
  { family: 'Pacifico', category: 'kursywa, zaokrąglona', weight: 400, boldWeight: 400, load: () => import('@fontsource/pacifico/400.css') },
  { family: 'Kalam', category: 'odręczny, pogrubiony', weight: 700, boldWeight: 700, load: () => import('@fontsource/kalam/700.css') },
  { family: 'Permanent Marker', category: 'marker', weight: 400, boldWeight: 400, load: () => import('@fontsource/permanent-marker/400.css') },
  { family: 'Amatic SC', category: 'wąski, plakatowy', weight: 700, boldWeight: 700, load: () => import('@fontsource/amatic-sc/700.css') },
  { family: 'Bebas Neue', category: 'plakatowy', weight: 400, boldWeight: 400, load: () => import('@fontsource/bebas-neue/400.css') },
  { family: 'Anton', category: 'plakatowy, bardzo pogrubiony', weight: 400, boldWeight: 400, load: () => import('@fontsource/anton/400.css') },
  { family: 'Righteous', category: 'plakatowy, zaokrąglony', weight: 400, boldWeight: 400, load: () => import('@fontsource/righteous/400.css') },
  { family: 'Passion One', category: 'plakatowy', weight: 700, boldWeight: 900, load: () => Promise.all([import('@fontsource/passion-one/700.css'), import('@fontsource/passion-one/900.css')]) },
  { family: 'Alfa Slab One', category: 'masywny', weight: 400, boldWeight: 400, load: () => import('@fontsource/alfa-slab-one/400.css') },
  { family: 'Playfair Display', category: 'elegancki', weight: 700, boldWeight: 900, load: () => Promise.all([import('@fontsource/playfair-display/700.css'), import('@fontsource/playfair-display/900.css')]) },
  { family: 'Cormorant', category: 'elegancki, szeryfowy', weight: 600, boldWeight: 700, load: () => Promise.all([import('@fontsource/cormorant/600.css'), import('@fontsource/cormorant/700.css')]) },
  { family: 'Lora', category: 'szeryfowy', weight: 600, boldWeight: 700, load: () => Promise.all([import('@fontsource/lora/600.css'), import('@fontsource/lora/700.css')]) },
  { family: 'Space Grotesk', category: 'nowoczesny', weight: 500, boldWeight: 700, load: () => Promise.all([import('@fontsource/space-grotesk/500.css'), import('@fontsource/space-grotesk/700.css')]) },
  { family: 'Poppins', category: 'nowoczesny', weight: 600, boldWeight: 800, load: () => Promise.all([import('@fontsource/poppins/600.css'), import('@fontsource/poppins/800.css')]) },
  { family: 'Inter', category: 'nowoczesny', weight: 400, boldWeight: 700, load: () => Promise.all([import('@fontsource/inter/400.css'), import('@fontsource/inter/700.css')]) },
  { family: 'Montserrat', category: 'nowoczesny', weight: 600, boldWeight: 800, load: () => Promise.all([import('@fontsource/montserrat/600.css'), import('@fontsource/montserrat/800.css')]) },
  { family: 'DM Sans', category: 'nowoczesny', weight: 500, boldWeight: 700, load: () => Promise.all([import('@fontsource/dm-sans/500.css'), import('@fontsource/dm-sans/700.css')]) },
  { family: 'JetBrains Mono', category: 'monospace', weight: 500, boldWeight: 700, load: () => Promise.all([import('@fontsource/jetbrains-mono/500.css'), import('@fontsource/jetbrains-mono/700.css')]) },
  { family: 'Chakra Petch', category: 'techniczny, ścięte rogi', weight: 600, boldWeight: 700, load: () => Promise.all([import('@fontsource/chakra-petch/600.css'), import('@fontsource/chakra-petch/700.css')]) },
  { family: 'Rajdhani', category: 'techniczny', weight: 600, boldWeight: 700, load: () => Promise.all([import('@fontsource/rajdhani/600.css'), import('@fontsource/rajdhani/700.css')]) },
  { family: 'Orbitron', category: 'futurystyczny', weight: 700, boldWeight: 900, load: () => Promise.all([import('@fontsource/orbitron/700.css'), import('@fontsource/orbitron/900.css')]) },
  { family: 'Russo One', category: 'masywny, sportowy', weight: 400, boldWeight: 400, load: () => import('@fontsource/russo-one/400.css') },
  { family: 'Teko', category: 'wąski, sportowy', weight: 600, boldWeight: 700, load: () => Promise.all([import('@fontsource/teko/600.css'), import('@fontsource/teko/700.css')]) },
]

const FONTS_BY_FAMILY = new Map(FONTS.map((f) => [f.family, f]))

export const DEFAULT_FONT = 'Architects Daughter'

export const FONT_OPTIONS: SelectOption[] = FONTS.map((f) => ({ value: f.family, label: `${f.family} (${f.category})` }))

export function fontWeight(family: string, bold = false): number {
  const def = FONTS_BY_FAMILY.get(family)
  if (!def) return bold ? 700 : 400
  return bold ? def.boldWeight : def.weight
}

// Konva's fontStyle is spliced into the canvas `font` shorthand, so it can carry a numeric weight.
export function konvaFontStyle(family: string, { bold = false, italic = false } = {}): string {
  return `${italic ? 'italic ' : ''}${fontWeight(family, bold)}`
}

// Covers latin-ext, so the Polish-character subset is fetched too.
const SAMPLE_TEXT = 'AaĄąĘęŁłŚśŻżŹźĆćŃńÓó0123'

const loading = new Map<string, Promise<void>>()

export function ensureFontLoaded(family: string): Promise<void> {
  const def = FONTS_BY_FAMILY.get(family)
  if (!def) return Promise.resolve()
  let promise = loading.get(family)
  if (!promise) {
    promise = def
      .load()
      .then(() =>
        Promise.all(
          [...new Set([def.weight, def.boldWeight])].map((w) => document.fonts.load(`${w} 40px "${family}"`, SAMPLE_TEXT)),
        ),
      )
      .then(() => undefined)
      .catch(() => undefined)
    loading.set(family, promise)
  }
  return promise
}
