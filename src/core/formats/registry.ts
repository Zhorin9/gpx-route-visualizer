import type { AspectKey } from '../../types'

// Bands of the frame covered by the platform's own interface, in frame pixels.
export interface SafeZone {
  top: number
  bottom: number
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
  // Drawn in the editor (never exported) and kept clear by the automatic layout.
  safeZone: SafeZone | null
}

export const FORMATS: Record<AspectKey, FormatDef> = {
  '4:5': { key: '4:5', w: 1080, h: 1350, label: 'Post 4:5', exportName: 'Post 4:5', note: 'feed', safeZone: null },
  '9:16': {
    key: '9:16',
    w: 1080,
    h: 1920,
    label: 'Story 9:16',
    exportName: 'Story / Reels 9:16',
    note: 'strefy bezpieczne',
    // Instagram's profile bar and reply box.
    safeZone: { top: 250, bottom: 340, topLabel: 'Pasek profilu Instagrama', bottomLabel: 'Pole odpowiedzi' },
  },
  '1:1': { key: '1:1', w: 1080, h: 1080, label: 'Kwadrat 1:1', exportName: 'Kwadrat 1:1', note: 'siatka profilu', safeZone: null },
}

export const FORMAT_ORDER: AspectKey[] = ['4:5', '9:16', '1:1']

// Distance from the bottom edge that elements anchored there keep.
export function bottomInset(key: AspectKey): number {
  const zone = FORMATS[key].safeZone
  return zone ? zone.bottom + 20 : 60
}
