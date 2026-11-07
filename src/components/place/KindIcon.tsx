import type { WaypointKind } from '../../types'
import { DOT_RADIUS, POINT_KINDS } from './pointKinds'
import IconSvg from './IconSvg'
import type { IconId } from './icons'

export default function KindIcon({ kind, icon }: { kind: WaypointKind; icon?: IconId }) {
  if (kind === 'icon' && icon) return <IconSvg icon={icon} />
  const { outline } = POINT_KINDS[kind]
  return (
    <svg viewBox="-12 -12 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" aria-hidden="true">
      {outline === 'dot' ? <circle r={DOT_RADIUS} /> : <polygon points={outline.join(' ')} />}
    </svg>
  )
}
