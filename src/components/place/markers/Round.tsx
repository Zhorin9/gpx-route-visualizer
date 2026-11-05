import { Circle, Group } from 'react-konva'
import CoverPicture from './CoverPicture'
import type { MarkerProps } from '.'

export default function Round({ photo, width, color, crop, onCrop }: MarkerProps) {
  const r = Round.size(width).w / 2
  return (
    <Group>
      <Group clipFunc={(ctx) => ctx.arc(r, r, r, 0, Math.PI * 2)}>
        <CoverPicture photo={photo} crop={crop} onCrop={onCrop} x={0} y={0} w={r * 2} h={r * 2} />
      </Group>
      <Circle x={r} y={r} radius={r} stroke={color} strokeWidth={6} listening={false} />
    </Group>
  )
}

Round.size = (w: number) => ({ w: w * 0.75, h: w * 0.75 })
