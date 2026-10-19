import type { SelectOption } from '../types'

type FontGroup = 'handwritten' | 'script' | 'display' | 'serif' | 'sans' | 'tech'

const GROUP_LABELS: Record<FontGroup, string> = {
  handwritten: 'Odręczne',
  script: 'Kaligrafia i kursywa',
  display: 'Plakatowe i nagłówkowe',
  serif: 'Szeryfowe, eleganckie',
  sans: 'Nowoczesne bezszeryfowe',
  tech: 'Techniczne i futurystyczne',
}

interface FontDef {
  family: string
  group: FontGroup
  // Weight used for "normal" text; some families only look right heavier.
  weight: number
  boldWeight: number
  load: () => Promise<unknown>
}

// Self-hosted via @fontsource and loaded only once a font is actually used —
// no requests to Google's CDN (GDPR) and no 32-family upfront download.
const FONTS: FontDef[] = [
  { family: 'Architects Daughter', group: 'handwritten', weight: 400, boldWeight: 400, load: () => import('@fontsource/architects-daughter/400.css') },
  { family: 'Patrick Hand', group: 'handwritten', weight: 400, boldWeight: 400, load: () => import('@fontsource/patrick-hand/400.css') },
  { family: 'Gochi Hand', group: 'handwritten', weight: 400, boldWeight: 400, load: () => import('@fontsource/gochi-hand/400.css') },
  { family: 'Indie Flower', group: 'handwritten', weight: 400, boldWeight: 400, load: () => import('@fontsource/indie-flower/400.css') },
  { family: 'Shadows Into Light', group: 'handwritten', weight: 400, boldWeight: 400, load: () => import('@fontsource/shadows-into-light/400.css') },
  { family: 'Handlee', group: 'handwritten', weight: 400, boldWeight: 400, load: () => import('@fontsource/handlee/400.css') },
  { family: 'Caveat', group: 'script', weight: 600, boldWeight: 700, load: () => Promise.all([import('@fontsource/caveat/600.css'), import('@fontsource/caveat/700.css')]) },
  { family: 'Dancing Script', group: 'script', weight: 700, boldWeight: 700, load: () => import('@fontsource/dancing-script/700.css') },
  { family: 'Satisfy', group: 'script', weight: 400, boldWeight: 400, load: () => import('@fontsource/satisfy/400.css') },
  { family: 'Pacifico', group: 'script', weight: 400, boldWeight: 400, load: () => import('@fontsource/pacifico/400.css') },
  { family: 'Kalam', group: 'handwritten', weight: 700, boldWeight: 700, load: () => import('@fontsource/kalam/700.css') },
  { family: 'Permanent Marker', group: 'handwritten', weight: 400, boldWeight: 400, load: () => import('@fontsource/permanent-marker/400.css') },
  { family: 'Amatic SC', group: 'display', weight: 700, boldWeight: 700, load: () => import('@fontsource/amatic-sc/700.css') },
  { family: 'Bebas Neue', group: 'display', weight: 400, boldWeight: 400, load: () => import('@fontsource/bebas-neue/400.css') },
  { family: 'Anton', group: 'display', weight: 400, boldWeight: 400, load: () => import('@fontsource/anton/400.css') },
  { family: 'Righteous', group: 'display', weight: 400, boldWeight: 400, load: () => import('@fontsource/righteous/400.css') },
  { family: 'Passion One', group: 'display', weight: 700, boldWeight: 900, load: () => Promise.all([import('@fontsource/passion-one/700.css'), import('@fontsource/passion-one/900.css')]) },
  { family: 'Alfa Slab One', group: 'display', weight: 400, boldWeight: 400, load: () => import('@fontsource/alfa-slab-one/400.css') },
  { family: 'Cinzel', group: 'serif', weight: 600, boldWeight: 800, load: () => Promise.all([import('@fontsource/cinzel/600.css'), import('@fontsource/cinzel/800.css')]) },
  { family: 'Charis SIL', group: 'serif', weight: 400, boldWeight: 700, load: () => Promise.all([import('@fontsource/charis-sil/400.css'), import('@fontsource/charis-sil/700.css')]) },
  { family: 'Playfair Display', group: 'serif', weight: 700, boldWeight: 900, load: () => Promise.all([import('@fontsource/playfair-display/700.css'), import('@fontsource/playfair-display/900.css')]) },
  { family: 'Cormorant', group: 'serif', weight: 600, boldWeight: 700, load: () => Promise.all([import('@fontsource/cormorant/600.css'), import('@fontsource/cormorant/700.css')]) },
  { family: 'Lora', group: 'serif', weight: 600, boldWeight: 700, load: () => Promise.all([import('@fontsource/lora/600.css'), import('@fontsource/lora/700.css')]) },
  { family: 'Space Grotesk', group: 'sans', weight: 500, boldWeight: 700, load: () => Promise.all([import('@fontsource/space-grotesk/500.css'), import('@fontsource/space-grotesk/700.css')]) },
  { family: 'Poppins', group: 'sans', weight: 600, boldWeight: 800, load: () => Promise.all([import('@fontsource/poppins/600.css'), import('@fontsource/poppins/800.css')]) },
  { family: 'Inter', group: 'sans', weight: 400, boldWeight: 700, load: () => Promise.all([import('@fontsource/inter/400.css'), import('@fontsource/inter/700.css')]) },
  { family: 'Montserrat', group: 'sans', weight: 600, boldWeight: 800, load: () => Promise.all([import('@fontsource/montserrat/600.css'), import('@fontsource/montserrat/800.css')]) },
  { family: 'DM Sans', group: 'sans', weight: 500, boldWeight: 700, load: () => Promise.all([import('@fontsource/dm-sans/500.css'), import('@fontsource/dm-sans/700.css')]) },
  { family: 'JetBrains Mono', group: 'tech', weight: 500, boldWeight: 700, load: () => Promise.all([import('@fontsource/jetbrains-mono/500.css'), import('@fontsource/jetbrains-mono/700.css')]) },
  { family: 'Chakra Petch', group: 'tech', weight: 600, boldWeight: 700, load: () => Promise.all([import('@fontsource/chakra-petch/600.css'), import('@fontsource/chakra-petch/700.css')]) },
  { family: 'Rajdhani', group: 'tech', weight: 600, boldWeight: 700, load: () => Promise.all([import('@fontsource/rajdhani/600.css'), import('@fontsource/rajdhani/700.css')]) },
  { family: 'Orbitron', group: 'tech', weight: 700, boldWeight: 900, load: () => Promise.all([import('@fontsource/orbitron/700.css'), import('@fontsource/orbitron/900.css')]) },
  { family: 'Russo One', group: 'display', weight: 400, boldWeight: 400, load: () => import('@fontsource/russo-one/400.css') },
  { family: 'Teko', group: 'display', weight: 600, boldWeight: 700, load: () => Promise.all([import('@fontsource/teko/600.css'), import('@fontsource/teko/700.css')]) },
]

const FONTS_BY_FAMILY = new Map(FONTS.map((f) => [f.family, f]))

export const DEFAULT_FONT = 'Architects Daughter'

const GROUP_ORDER = Object.keys(GROUP_LABELS) as FontGroup[]

// Grouped by style, alphabetical within a group, so a look is easy to find.
export const FONT_OPTIONS: SelectOption[] = [...FONTS]
  .sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || a.family.localeCompare(b.family))
  .map((f) => ({ value: f.family, label: f.family, group: GROUP_LABELS[f.group] }))

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
