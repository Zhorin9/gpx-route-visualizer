import { Group, Line } from 'react-konva'
import { badgeOutline } from '../utils/badge'
import { measureTextWidth } from '../utils/measureText'
import { STICKER_INK } from '../utils/sticker'
import type { TextBadge } from '../types'

export interface BadgeBackProps {
  badge: TextBadge
  color: string
  text: string
  // The text's own placement and look, so the badge sits under its letters.
  x: number
  y: number
  rotation: number
  opacity: number
  fontSize: number
  fontFamily: string
  fontStyle: string
  letterSpacing: number
  // A title is laid out across this width, centred.
  width?: number
}

// The shape under a badge's text: a hard ink shadow, then the shape in its colour with an ink outline.
export default function BadgeBack({ badge, color, text, x, y, rotation, opacity, fontSize, fontFamily, fontStyle, letterSpacing, width }: BadgeBackProps) {
  const lines = text.split('\n')
  const w = Math.max(...lines.map((line) => measureTextWidth(line, fontFamily, fontSize, fontStyle) + letterSpacing * line.length))
  const h = lines.length * fontSize
  const points = badgeOutline(badge.shape, w, h)
  const cx = (width ?? w) / 2
  const cy = h / 2
  const shadow = fontSize * 0.12
  return (
    <Group x={x} y={y} rotation={rotation} opacity={opacity} listening={false}>
      <Line points={points} closed x={cx + shadow} y={cy + shadow} fill={STICKER_INK} perfectDrawEnabled={false} />
      <Line points={points} closed x={cx} y={cy} fill={color} stroke={STICKER_INK} strokeWidth={Math.max(2, fontSize * 0.08)} lineJoin="round" perfectDrawEnabled={false} />
    </Group>
  )
}
