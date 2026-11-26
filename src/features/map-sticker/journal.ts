import { FORMATS } from '../../core/formats/registry'
import { elementLayer, framedPhotoLayers, stickersUnderPhotos } from '../../core/canvas/layers'
import type { DocumentState } from '../../store/types'
import { DEFAULT_MAP_STICKER, stickerKind, type MapSticker } from './model'

const WHOLE_SIZE = 0.8
const DAY_SIZE = 0.6
const DAY_ZOOM = 1.6
const TOP = 0.03
const DAY_INSET = 0.04

export type JournalLayout = Pick<DocumentState, 'mapStickers' | 'placements' | 'layerOrder'>

export function journalCarousel(s: Pick<DocumentState, 'aspectKey' | 'slides' | 'mapStickers' | 'placements' | 'carouselKind' | 'layerOrder'>, dayCount: number): JournalLayout {
  const { w, h } = FORMATS[s.aspectKey]
  const look = s.mapStickers[0] ?? { ...DEFAULT_MAP_STICKER, id: 1 }
  let lastId = Math.max(0, ...s.mapStickers.map((m) => m.id))
  const idAt = (i: number) => s.mapStickers[i]?.id ?? ++lastId
  const whole: MapSticker = { ...look, id: idAt(0), scope: { kind: 'all' }, size: WHOLE_SIZE, zoom: 1, pan: { x: 0, y: 0 }, rotation: 0 }
  const dayIndexes = s.slides.map((_, slide) => slide).filter((slide) => slide >= 2 && slide < dayCount)
  const days: MapSticker[] = dayIndexes.map((day, i) => ({ ...look, id: idAt(i + 1), scope: { kind: 'day', day, only: false }, size: DAY_SIZE, zoom: DAY_ZOOM, pan: { x: 0, y: 0 }, rotation: 0 }))
  const arranged = [whole, ...days]
  const mapStickers = [...arranged, ...s.mapStickers.slice(arranged.length)]
  const placements = {
    ...s.placements,
    [stickerKind(whole.id)]: { x: s.carouselKind === 'panorama' ? w * (1 - WHOLE_SIZE / 2) : w * (1 - WHOLE_SIZE - DAY_INSET), y: h * TOP },
    ...Object.fromEntries(days.map((m, i) => [stickerKind(m.id), { x: dayIndexes[i] * w + w * (1 - DAY_SIZE - DAY_INSET), y: h * TOP }])),
  }
  const stickers = arranged.map((m) => elementLayer(stickerKind(m.id)))
  return { mapStickers, placements, layerOrder: stickersUnderPhotos(s.layerOrder, stickers, framedPhotoLayers(s.slides)) }
}
