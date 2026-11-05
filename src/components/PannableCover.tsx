import { Image as KonvaImage } from 'react-konva'
import type Konva from 'konva'
import { coverLayout, coveringPosition, wheelSteps, zoomedBy } from '../utils/image'

interface Props {
  image: HTMLImageElement | ImageBitmap | HTMLCanvasElement
  box: { x: number; y: number; w: number; h: number }
  zoom: number
  offsetX: number
  offsetY: number
  onPan: (offsetX: number, offsetY: number) => void
  onZoom: (zoom: number) => void
  keepDragFromParent?: boolean
}

export default function PannableCover({ image, box, zoom, offsetX, offsetY, onPan, onZoom, keepDragFromParent }: Props) {
  const layout = coverLayout(image.width, image.height, box.w, box.h, zoom, offsetX, offsetY)
  const stopBubble = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (keepDragFromParent) e.cancelBubble = true
  }

  return (
    <KonvaImage
      image={image}
      x={box.x + layout.x}
      y={box.y + layout.y}
      width={layout.width}
      height={layout.height}
      draggable
      onDragMove={(e) => {
        stopBubble(e)
        e.target.position(coveringPosition(e.target.position(), box, layout))
      }}
      onDragEnd={(e) => {
        stopBubble(e)
        onPan(e.target.x() - box.x - (box.w - layout.width) / 2, e.target.y() - box.y - (box.h - layout.height) / 2)
      }}
      onWheel={(e) => {
        e.evt.preventDefault()
        onZoom(zoomedBy(zoom, wheelSteps(e.evt.deltaY)))
      }}
      onMouseEnter={(e) => e.target.getStage()?.container().classList.add('can-pan')}
      onMouseLeave={(e) => e.target.getStage()?.container().classList.remove('can-pan')}
    />
  )
}
