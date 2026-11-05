import { computeSlots, type LayoutDef } from '../utils/layouts'
import type { Photo, Slide } from '../types'

interface Props {
  def: LayoutDef
  slide: Slide
  photos: Map<number, Photo>
  width: number
  height: number
  margin: number
  outlineFramed?: boolean
}

export default function LayoutCells({ def, slide, photos, width, height, margin, outlineFramed }: Props) {
  return computeSlots(def, width, height, 2, margin).map((cell) => {
    const photo = photos.get(slide.slots[cell.index]?.photoId ?? -1)
    return (
      <span
        key={cell.index}
        className={outlineFramed && cell.kind === 'framed' ? 'layout-thumb-cell framed' : 'layout-thumb-cell'}
        style={{
          left: cell.x,
          top: cell.y,
          width: cell.w,
          height: cell.h,
          transform: cell.rotation ? `rotate(${cell.rotation}deg)` : undefined,
          backgroundImage: photo ? `url(${photo.thumb})` : undefined,
        }}
      />
    )
  })
}
