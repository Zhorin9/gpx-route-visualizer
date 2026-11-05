import { Group, Rect } from 'react-konva'
import { CAST_SHADOW } from '../../../core/canvas/shadows'
import CoverPicture from './CoverPicture'
import type { MarkerProps } from '.'

const PRINT = '#fbf8f1'
const TILT = -3

const margin = (w: number) => w * 0.05
const pictureHeight = (w: number) => ((w - margin(w) * 2) * 3) / 4
const stripHeight = (w: number) => w * 0.15

export default function Polaroid({ photo, width: w, crop, onCrop }: MarkerProps) {
  return (
    <Group rotation={TILT}>
      <Rect width={w} height={Polaroid.size(w).h} fill={PRINT} {...CAST_SHADOW} />
      <CoverPicture photo={photo} crop={crop} onCrop={onCrop} x={margin(w)} y={margin(w)} w={w - margin(w) * 2} h={pictureHeight(w)} />
    </Group>
  )
}

Polaroid.size = (w: number) => ({ w, h: margin(w) + pictureHeight(w) + stripHeight(w) })

Polaroid.nameArea = (w: number) => ({ x: margin(w), y: margin(w) + pictureHeight(w), w: w - margin(w) * 2, h: stripHeight(w), rotation: TILT })
