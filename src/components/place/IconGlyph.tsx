import { Group, Path } from 'react-konva'
import { ICON_GRID, ICON_SHADOW_OFFSET, ICON_STROKE, iconById, iconPaint, type IconFinish, type IconId } from './icons'

export interface IconGlyphProps {
  icon: IconId
  // Width and height on the frame; the icon is centred on the group's origin.
  size: number
  finish: IconFinish
  color: string
  paper: string
}

const ROUND = { lineJoin: 'round', lineCap: 'round', strokeWidth: ICON_STROKE, listening: false, perfectDrawEnabled: false } as const

export default function IconGlyph({ icon, size, finish, color, paper }: IconGlyphProps) {
  const def = iconById(icon)
  if (!def) return null
  const paint = iconPaint(finish, color, paper)
  const half = ICON_GRID / 2
  const shape = (offset: number, fill: string | undefined, stroke: string) => (
    <Group x={offset} y={offset}>
      {def.fill && <Path data={def.fill} fill={fill} stroke={stroke} {...ROUND} />}
      {def.line && <Path data={def.line} stroke={stroke} {...ROUND} />}
    </Group>
  )
  return (
    <Group scaleX={size / ICON_GRID} scaleY={size / ICON_GRID} offsetX={half} offsetY={half}>
      {paint.shadow && shape(ICON_SHADOW_OFFSET, paint.stroke, paint.stroke)}
      {shape(0, paint.fill, paint.stroke)}
    </Group>
  )
}
