import { FORMATS } from '../core/formats/registry'
import type { AspectKey } from '../types'

export function defaultStatsY(aspectKey: AspectKey): number {
  const { safeZone, columns } = FORMATS[aspectKey]
  if (columns) return columns.side.y
  return safeZone ? safeZone.top + 30 : 70
}

// 13% down clears the platform's top bar; in landscape, atop the side column.
export function defaultTitlePlace(aspectKey: AspectKey): { x: number; y: number } {
  const { h, safeZone, columns } = FORMATS[aspectKey]
  if (columns) return { x: columns.side.x, y: columns.side.y }
  const y = Math.round(h * 0.13)
  return { x: 0, y: safeZone ? Math.max(y, safeZone.top + 30) : y }
}

export function statsYBelowTitle(title: { y: number; fontSize: number; lines: number }): number {
  return Math.round(title.y + title.fontSize * (title.lines + 0.3) + 16)
}
