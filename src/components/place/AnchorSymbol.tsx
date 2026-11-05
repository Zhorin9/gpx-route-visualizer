import { Circle, Line } from 'react-konva'
import type { WaypointKind } from '../../types'
import { DOT_RADIUS, POINT_KINDS } from './pointKinds'

const OUTLINE = { stroke: '#000000', strokeWidth: 1.5, strokeScaleEnabled: false, listening: false }

export default function AnchorSymbol({ kind, color }: { kind: WaypointKind; color: string }) {
  const { outline } = POINT_KINDS[kind]
  if (outline === 'dot') return <Circle radius={DOT_RADIUS} fill={color} {...OUTLINE} />
  return <Line points={outline} closed fill={color} lineJoin="round" {...OUTLINE} />
}
