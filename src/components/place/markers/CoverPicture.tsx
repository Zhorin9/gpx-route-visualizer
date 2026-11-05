import { Group, Image as KonvaImage } from 'react-konva'
import type Konva from 'konva'
import { coverLayout, coveringPosition, wheelSteps, zoomedBy } from '../../../utils/image'
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

const keepDragFromLabel = (e: Konva.KonvaEventObject<DragEvent>) => {
  e.cancelBubble = true
}

export default function CoverPicture({ photo, crop, onCrop, x, y, w, h }: CoverPictureProps) {
  const l = coverLayout(photo.image.width, photo.image.height, w, h, crop.zoom, crop.offsetX * w, crop.offsetY * h)

  return (
    <Group clipX={x} clipY={y} clipWidth={w} clipHeight={h}>
      <KonvaImage
        image={photo.image}
        x={x + l.x}
        y={y + l.y}
        width={l.width}
        height={l.height}
        draggable
        onDragMove={(e) => {
          keepDragFromLabel(e)
          e.target.position(coveringPosition(e.target.position(), { x, y, w, h }, l))
        }}
        onDragEnd={(e) => {
          keepDragFromLabel(e)
          onCrop({ ...crop, offsetX: (e.target.x() - x - (w - l.width) / 2) / w, offsetY: (e.target.y() - y - (h - l.height) / 2) / h })
        }}
        onWheel={(e) => {
          e.evt.preventDefault()
          onCrop({ ...crop, zoom: zoomedBy(crop.zoom, wheelSteps(e.evt.deltaY)) })
        }}
        onMouseEnter={(e) => e.target.getStage()?.container().classList.add('can-pan')}
        onMouseLeave={(e) => e.target.getStage()?.container().classList.remove('can-pan')}
      />
    </Group>
  )
}
