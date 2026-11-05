import { Circle, Group, Image as KonvaImage, Rect } from 'react-konva'
import type Konva from 'konva'
import { DEFAULT_SLOT_CROP } from '../store/defaults'
import { coverLayout } from '../utils/image'
import { MARKER_WIDTHS, markerSize } from './photoMarker'
import type { Photo, PointStyle, Waypoint } from '../types'

const PRINT = '#fbf8f1'
const FILM = '#0a0a09'
const SHADOW = { shadowColor: '#000000', shadowBlur: 10, shadowOpacity: 0.35, shadowOffsetY: 3 }
const ZOOM_STEP = 0.1
const MAX_ZOOM = 4

type Crop = NonNullable<Waypoint['photoCrop']>

interface PictureProps {
  photo: Photo
  x: number
  y: number
  w: number
  h: number
  crop: Crop
  onCrop: (crop: Crop) => void
}

// Covers its box, dragged and wheel-zoomed by hand like a photo in a slot.
function Picture({ photo, x, y, w, h, crop, onCrop }: PictureProps) {
  const l = coverLayout(photo.image.width, photo.image.height, w, h, crop.zoom, crop.offsetX * w, crop.offsetY * h)

  // Keeps the photo covering the whole box while it's dragged.
  function clamp(node: Konva.Node) {
    node.x(Math.max(x + w - l.width, Math.min(x, node.x())))
    node.y(Math.max(y + h - l.height, Math.min(y, node.y())))
  }

  return (
    <Group clipX={x} clipY={y} clipWidth={w} clipHeight={h}>
      <KonvaImage
        image={photo.image}
        x={x + l.x}
        y={y + l.y}
        width={l.width}
        height={l.height}
        draggable
        // The label is draggable too: its handlers must not take the photo's drag for its own.
        onDragMove={(e) => {
          e.cancelBubble = true
          clamp(e.target)
        }}
        onDragEnd={(e) => {
          e.cancelBubble = true
          onCrop({ ...crop, offsetX: (e.target.x() - x - (w - l.width) / 2) / w, offsetY: (e.target.y() - y - (h - l.height) / 2) / h })
        }}
        onWheel={(e) => {
          e.evt.preventDefault()
          onCrop({ ...crop, zoom: Math.max(1, Math.min(MAX_ZOOM, crop.zoom + (e.evt.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP))) })
        }}
        onMouseEnter={(e) => e.target.getStage()?.container().classList.add('can-pan')}
        onMouseLeave={(e) => e.target.getStage()?.container().classList.remove('can-pan')}
      />
    </Group>
  )
}

export interface PinnedPhotoProps {
  photo: Photo
  style: PointStyle
  // The place's colour: the line of the ring and the frame, the film's holes.
  color: string
  // Space left between the photo and the name under it.
  gap: number
  // Unset: centred.
  crop?: Crop
  onCrop: (crop: Crop) => void
}

// A photo of a place, standing on the place's name: a print, a round cut-out, a thin frame or a film frame.
export default function PinnedPhoto({ photo, style, color, gap, crop = DEFAULT_SLOT_CROP, onCrop }: PinnedPhotoProps) {
  const { marker } = style
  if (marker === 'label') return null
  const size = markerSize(marker, MARKER_WIDTHS[style.size])
  const { w, h } = size
  const y = -h - gap
  const picture = { photo, crop, onCrop }

  if (marker === 'polaroid') {
    const pad = w * 0.05
    return (
      <Group y={y} rotation={-3}>
        <Rect width={w} height={h} fill={PRINT} {...SHADOW} />
        <Picture {...picture} x={pad} y={pad} w={w - pad * 2} h={((w - pad * 2) * 3) / 4} />
      </Group>
    )
  }
  if (marker === 'circle') {
    const r = w / 2
    return (
      <Group y={y}>
        <Group clipFunc={(ctx) => ctx.arc(r, r, r, 0, Math.PI * 2)}>
          <Picture {...picture} x={0} y={0} w={w} h={h} />
        </Group>
        <Circle x={r} y={r} radius={r} stroke={color} strokeWidth={6} listening={false} />
      </Group>
    )
  }
  if (marker === 'film') {
    const holes = Math.floor(w / 14)
    return (
      <Group y={y}>
        <Rect width={w} height={h} fill={FILM} {...SHADOW} />
        {Array.from({ length: holes }, (_, i) => (
          <Group key={i} x={(w / holes) * (i + 0.5) - 3} listening={false}>
            <Rect y={5} width={6} height={6} fill={color} cornerRadius={1} />
            <Rect y={h - 11} width={6} height={6} fill={color} cornerRadius={1} />
          </Group>
        ))}
        <Picture {...picture} x={6} y={18} w={w - 12} h={h - 36} />
      </Group>
    )
  }
  return (
    <Group y={y}>
      <Rect width={w} height={h} stroke={color} strokeWidth={2} />
      <Picture {...picture} x={6} y={6} w={w - 12} h={h - 12} />
    </Group>
  )
}
