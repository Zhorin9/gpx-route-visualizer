import { columnLayout, insetBelow, stretchLayout, type LayoutStrategy } from './layouts'
import type { AspectKey } from '../../types'

// Bands of the frame covered by the platform's own interface, in frame pixels.
export interface SafeZone {
  top: number
  right: number
  bottom: number
  left: number
  // What covers the top and bottom bands, shown on them in the editor.
  topLabel: string
  bottomLabel: string
}

// Everything that differs between frame formats. A new format is a new entry here.
export interface FormatDef {
  key: AspectKey
  w: number
  h: number
  // Format switcher above the frame.
  label: string
  // Export panels.
  exportName: string
  note: string
  // Several slides side by side; without it only the first slide is shown and exported.
  carousel: boolean
  // Drawn in the editor (never exported) and kept clear by the automatic layout.
  safeZone: SafeZone | null
  // Landscape composition, null in portrait formats.
  columns: Columns | null
  layout: LayoutStrategy
}

// In frame pixels: the route is projected into the left area, title, stats and texts share the
// column on the right. Elements anchored to the bottom (profile, legend) span the whole width.
export interface Columns {
  routeW: number
  side: { x: number; y: number; w: number }
  // Kept free above the bottom inset for the elevation profile; the texts stack above it.
  footH: number
}

export const FORMATS: Record<AspectKey, FormatDef> = {
  '4:5': { key: '4:5', w: 1080, h: 1350, label: 'Post 4:5', exportName: 'Post 4:5', note: 'feed', carousel: true, safeZone: null, columns: null, layout: stretchLayout },
  '9:16': {
    key: '9:16',
    w: 1080,
    h: 1920,
    label: 'Story 9:16',
    exportName: 'Story / Reels 9:16',
    note: 'strefy bezpieczne',
    carousel: true,
    // Instagram's profile bar and reply box.
    safeZone: { top: 250, right: 0, bottom: 340, left: 0, topLabel: 'Pasek profilu Instagrama', bottomLabel: 'Pole odpowiedzi' },
    columns: null,
    layout: stretchLayout,
  },
  '1:1': { key: '1:1', w: 1080, h: 1080, label: 'Kwadrat 1:1', exportName: 'Kwadrat 1:1', note: 'siatka profilu', carousel: true, safeZone: null, columns: null, layout: stretchLayout },
  '16:9': {
    key: '16:9',
    w: 1920,
    h: 1080,
    label: 'YouTube 16:9',
    exportName: 'YouTube / film 16:9',
    note: 'strefa odtwarzacza',
    carousel: false,
    // Title-safe margin of 5% on every side; the player bar covers the bottom ~12%.
    safeZone: { top: 54, right: 96, bottom: 130, left: 96, topLabel: 'Margines tytułowy', bottomLabel: 'Pasek odtwarzacza YouTube' },
    columns: { routeW: 1152, side: { x: 1152, y: 140, w: 672 }, footH: 270 },
    layout: columnLayout,
  },
}

export const FORMAT_ORDER: AspectKey[] = ['4:5', '9:16', '1:1', '16:9']

// Distance from the bottom edge that elements anchored there keep.
export const bottomInset = (key: AspectKey) => insetBelow(FORMATS[key])

// Horizontal span of the title and the stats header: the whole frame, or the side column.
export function textColumn(key: AspectKey): { x: number; w: number } {
  const { w, columns } = FORMATS[key]
  return columns ? columns.side : { x: 0, w }
}
