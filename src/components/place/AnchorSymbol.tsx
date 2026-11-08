import { Circle, Line } from 'react-konva'
import type { WaypointKind } from '../../types'
import { DOT_RADIUS, POINT_KINDS } from './pointKinds'
import { DEFAULT_ICON_SIZE } from './placeLayout'
import IconGlyph from './IconGlyph'
import useIconLook from './useIconLook'
import type { IconId } from './icons'

const OUTLINE = { stroke: '#000000', strokeWidth: 1.5, strokeScaleEnabled: false, listening: false }

export default function AnchorSymbol({ kind, color, icon, iconSize = DEFAULT_ICON_SIZE }: { kind: WaypointKind; color: string; icon?: IconId; iconSize?: number }) {
  const look = useIconLook()
  if (kind === 'icon' && icon) return <IconGlyph icon={icon} size={iconSize} color={color} {...look} />
  const { outline } = POINT_KINDS[kind]
  if (outline === 'dot') return <Circle radius={DOT_RADIUS} fill={color} {...OUTLINE} />
  return <Line points={outline} closed fill={color} lineJoin="round" {...OUTLINE} />
}
