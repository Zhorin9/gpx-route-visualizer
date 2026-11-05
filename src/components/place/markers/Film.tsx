import { Group, Rect } from 'react-konva'
import { CAST_SHADOW } from '../../../core/canvas/shadows'
import CoverPicture from './CoverPicture'
import type { MarkerProps } from '.'

const FILM = '#0a0a09'
const HOLE = 6
const HOLE_EDGE = 5
const HOLE_SPACING = 14
const BORDER = 18
const SIDE = 6

export default function Film({ photo, width, color, crop, onCrop }: MarkerProps) {
  const { w, h } = Film.size(width)
  const holes = Math.floor(w / HOLE_SPACING)
  return (
    <Group>
      <Rect width={w} height={h} fill={FILM} {...CAST_SHADOW} />
      {Array.from({ length: holes }, (_, i) => (
        <Group key={i} x={(w / holes) * (i + 0.5) - HOLE / 2} listening={false}>
          <Rect y={HOLE_EDGE} width={HOLE} height={HOLE} fill={color} cornerRadius={1} />
          <Rect y={h - HOLE_EDGE - HOLE} width={HOLE} height={HOLE} fill={color} cornerRadius={1} />
        </Group>
      ))}
      <CoverPicture photo={photo} crop={crop} onCrop={onCrop} x={SIDE} y={BORDER} w={w - SIDE * 2} h={h - BORDER * 2} />
    </Group>
  )
}

Film.size = (w: number) => ({ w, h: w * 0.7 })
