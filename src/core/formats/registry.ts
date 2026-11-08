import { columnLayout, insetBelow, stretchLayout, type LayoutStrategy } from './layouts'
import type { AspectKey } from '../../types'
import type { TKey } from '../../i18n'

// Bands of the frame covered by the platform's own interface, in frame pixels.
export interface SafeZone {
  top: number
  right: number
  bottom: number
  left: number
  // What covers the top and bottom bands, shown on them in the editor.
  topLabel: TKey
  bottomLabel: TKey
}

export interface FormatDef {
  key: AspectKey
  w: number
  h: number
  // Format switcher above the frame.
  label: TKey
  // Export panels.
  exportName: TKey
  note: TKey
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
  '4:5': { key: '4:5', w: 1080, h: 1350, label: 'formats.post', exportName: 'formats.postExport', note: 'formats.postNote', carousel: true, safeZone: null, columns: null, layout: stretchLayout },
  '9:16': {
    key: '9:16',
    w: 1080,
    h: 1920,
    label: 'formats.story',
    exportName: 'formats.storyExport',
    note: 'formats.storyNote',
    carousel: true,
    // Instagram's profile bar and reply box.
    safeZone: { top: 250, right: 0, bottom: 340, left: 0, topLabel: 'formats.storyTop', bottomLabel: 'formats.storyBottom' },
    columns: null,
    layout: stretchLayout,
  },
  '1:1': { key: '1:1', w: 1080, h: 1080, label: 'formats.square', exportName: 'formats.squareExport', note: 'formats.squareNote', carousel: true, safeZone: null, columns: null, layout: stretchLayout },
  '16:9': {
    key: '16:9',
    w: 1920,
    h: 1080,
    label: 'formats.youtube',
    exportName: 'formats.youtubeExport',
    note: 'formats.youtubeNote',
    carousel: false,
    // Title-safe margin of 5% on every side; the player bar covers the bottom ~12%.
    safeZone: { top: 54, right: 96, bottom: 130, left: 96, topLabel: 'formats.youtubeTop', bottomLabel: 'formats.youtubeBottom' },
    columns: { routeW: 1152, side: { x: 1152, y: 140, w: 672 }, footH: 270 },
    layout: columnLayout,
  },
}

export const FORMAT_ORDER: AspectKey[] = ['4:5', '9:16', '1:1', '16:9']

export const bottomInset = (key: AspectKey) => insetBelow(FORMATS[key])

// Horizontal span of the title and the stats header: the whole frame, or the side column.
export function textColumn(key: AspectKey): { x: number; w: number } {
  const { w, columns } = FORMATS[key]
  return columns ? columns.side : { x: 0, w }
}
