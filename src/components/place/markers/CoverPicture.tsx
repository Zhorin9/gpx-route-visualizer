import { Group } from 'react-konva'
import PannableCover from '../../PannableCover'
import type { Photo } from '../../../types'
import type { PhotoCrop } from '.'

interface CoverPictureProps {
  photo: Photo
  crop: PhotoCrop
  onCrop: (crop: PhotoCrop) => void
  x: number
  y: number
  w: number
  h: number
}

export default function CoverPicture({ photo, crop, onCrop, x, y, w, h }: CoverPictureProps) {
  return (
    <Group clipX={x} clipY={y} clipWidth={w} clipHeight={h}>
      <PannableCover
        image={photo.image}
        box={{ x, y, w, h }}
        zoom={crop.zoom}
        offsetX={crop.offsetX * w}
        offsetY={crop.offsetY * h}
        onPan={(dx, dy) => onCrop({ ...crop, offsetX: dx / w, offsetY: dy / h })}
        onZoom={(zoom) => onCrop({ ...crop, zoom })}
        keepDragFromParent
      />
    </Group>
  )
}
