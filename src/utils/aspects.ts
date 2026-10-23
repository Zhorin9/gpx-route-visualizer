import { FORMATS } from '../core/formats/registry'
import type { AspectKey } from '../types'

export function defaultStatsY(aspectKey: AspectKey): number {
  const zone = FORMATS[aspectKey].safeZone
  return zone ? zone.top + 30 : 70
}

// 13% from the top, as on the template previews; clear of the platform's top bar.
export function defaultTitleY(aspectKey: AspectKey): number {
  const { h, safeZone } = FORMATS[aspectKey]
  const y = Math.round(h * 0.13)
  return safeZone ? Math.max(y, safeZone.top + 30) : y
}

// With a title, the stats header sits just below its last line.
export function statsYBelowTitle(title: { y: number; fontSize: number; lines: number }): number {
  return Math.round(title.y + title.fontSize * (title.lines + 0.3) + 16)
}
