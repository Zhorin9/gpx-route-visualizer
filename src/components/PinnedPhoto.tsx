import { Circle, Group, Image as KonvaImage, Rect } from 'react-konva'
import { coverLayout } from '../utils/image'
import type { Photo, PhotoMarker, PointStyle } from '../types'

const WIDTHS: Record<PointStyle['size'], number> = { S: 120, M: 180, L: 260 }
const PRINT = '#fbf8f1'
const FILM = '#0a0a09'
const SHADOW = { shadowColor: '#000000', shadowBlur: 10, shadowOpacity: 0.35, shadowOffsetY: 3 }

// Outer size of each marker for a photo `w` wide.
function markerSize(marker: PhotoMarker, w: number) {
  if (marker === 'circle') return { w: w * 0.75, h: w * 0.75 }
  if (marker === 'polaroid') return { w, h: w * 0.05 + (w * 0.9 * 3) / 4 + w * 0.15 }
  if (marker === 'film') return { w, h: w * 0.7 }
  return { w, h: w * 0.78 }
}

function Picture({ photo, x, y, w, h }: { photo: Photo; x: number; y: number; w: number; h: number }) {
  const l = coverLayout(photo.image.width, photo.image.height, w, h, 1, 0, 0)
  return (
    <Group clipX={x} clipY={y} clipWidth={w} clipHeight={h}>
      <KonvaImage image={photo.image} x={x + l.x} y={y + l.y} width={l.width} height={l.height} />
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
}

// A photo of a place, standing on the place's name: a print, a round cut-out, a thin frame or a film frame.
export default function PinnedPhoto({ photo, style, color, gap }: PinnedPhotoProps) {
  const { marker } = style
  if (marker === 'label') return null
  const size = markerSize(marker, WIDTHS[style.size])
  const { w, h } = size
  const y = -h - gap

  if (marker === 'polaroid') {
    const pad = w * 0.05
    return (
      <Group y={y} rotation={-3} listening={false}>
        <Rect width={w} height={h} fill={PRINT} {...SHADOW} />
        <Picture photo={photo} x={pad} y={pad} w={w - pad * 2} h={((w - pad * 2) * 3) / 4} />
      </Group>
    )
  }
  if (marker === 'circle') {
    const r = w / 2
    return (
      <Group y={y} listening={false}>
        <Group clipFunc={(ctx) => ctx.arc(r, r, r, 0, Math.PI * 2)}>
          <Picture photo={photo} x={0} y={0} w={w} h={h} />
        </Group>
        <Circle x={r} y={r} radius={r} stroke={color} strokeWidth={6} />
      </Group>
    )
  }
  if (marker === 'film') {
    const holes = Math.floor(w / 14)
    return (
      <Group y={y} listening={false}>
        <Rect width={w} height={h} fill={FILM} {...SHADOW} />
        {Array.from({ length: holes }, (_, i) => (
          <Group key={i} x={(w / holes) * (i + 0.5) - 3}>
            <Rect y={5} width={6} height={6} fill={color} cornerRadius={1} />
            <Rect y={h - 11} width={6} height={6} fill={color} cornerRadius={1} />
          </Group>
        ))}
        <Picture photo={photo} x={6} y={18} w={w - 12} h={h - 36} />
      </Group>
    )
  }
  return (
    <Group y={y} listening={false}>
      <Rect width={w} height={h} stroke={color} strokeWidth={2} />
      <Picture photo={photo} x={6} y={6} w={w - 12} h={h - 12} />
    </Group>
  )
}
