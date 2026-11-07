import type { WaypointKind } from '../../types'

export const DOT_RADIUS = 6

export const POINT_KINDS: Record<WaypointKind, { label: string; outline: number[] | 'dot' }> = {
  point: { label: 'Punkt', outline: 'dot' },
  peak: { label: 'Szczyt', outline: [-9, 7, 0, -9, 9, 7] },
  pass: { label: 'Przełęcz', outline: [-11, 7, -4, -5, 0, 1, 4, -7, 11, 7] },
  lodging: { label: 'Nocleg', outline: [-9, 7, -9, -2, 0, -9, 9, -2, 9, 7] },
  // Drawn as the waypoint's own icon; the dot stands for it in lists.
  icon: { label: 'Ikona', outline: 'dot' },
}

export const POINT_KIND_ORDER = Object.keys(POINT_KINDS) as WaypointKind[]
