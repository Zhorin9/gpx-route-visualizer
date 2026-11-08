import type { WaypointKind } from '../../types'
import type { TKey } from '../../i18n'

export const DOT_RADIUS = 6

export const POINT_KINDS: Record<WaypointKind, { label: TKey; outline: number[] | 'dot' }> = {
  point: { label: 'pointKinds.point', outline: 'dot' },
  peak: { label: 'pointKinds.peak', outline: [-9, 7, 0, -9, 9, 7] },
  pass: { label: 'pointKinds.pass', outline: [-11, 7, -4, -5, 0, 1, 4, -7, 11, 7] },
  lodging: { label: 'pointKinds.lodging', outline: [-9, 7, -9, -2, 0, -9, 9, -2, 9, 7] },
  // Drawn as the waypoint's own icon; the dot stands for it in lists.
  icon: { label: 'pointKinds.icon', outline: 'dot' },
}

export const POINT_KIND_ORDER = Object.keys(POINT_KINDS) as WaypointKind[]
