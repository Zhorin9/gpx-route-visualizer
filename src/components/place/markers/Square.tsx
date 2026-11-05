import { Group, Rect } from 'react-konva'
import CoverPicture from './CoverPicture'
import type { MarkerProps } from '.'

const INSET = 6

export default function Square({ photo, width, color, crop, onCrop }: MarkerProps) {
  const { w, h } = Square.size(width)
  return (
    <Group>
      <Rect width={w} height={h} stroke={color} strokeWidth={2} />
      <CoverPicture photo={photo} crop={crop} onCrop={onCrop} x={INSET} y={INSET} w={w - INSET * 2} h={h - INSET * 2} />
    </Group>
  )
}

Square.size = (w: number) => ({ w, h: w * 0.78 })
