import { useShallow } from 'zustand/react/shallow'
import { registerCanvasElement } from '../../core/canvas/registry'
import { IconRoute } from '../../components/icons'
import { useHasRoute } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import MapStickerFields from './MapStickerFields'
import MapStickerNode from './MapStickerNode'
import { MAP_STICKER_KIND, stickerIdOf, stickerKind } from './model'

function useStickersShown() {
  const hasRoute = useHasRoute()
  const any = useAppStore((s) => s.mapStickers.length > 0)
  return hasRoute && any
}

function useStickerKinds() {
  const hasRoute = useHasRoute()
  const kinds = useAppStore(useShallow((s) => s.mapStickers.map((m) => stickerKind(m.id))))
  return hasRoute ? kinds : []
}

function useAddSticker() {
  const hasRoute = useHasRoute()
  const add = useAppStore((s) => s.addMapSticker)
  return hasRoute ? add : null
}

function MapStickers() {
  const stickers = useAppStore((s) => s.mapStickers)
  return stickers.map((sticker) => <MapStickerNode key={sticker.id} sticker={sticker} />)
}

export function registerMapSticker() {
  registerCanvasElement({
    kind: MAP_STICKER_KIND,
    label: 'mapSticker.label',
    meta: 'mapSticker.meta',
    icon: <IconRoute />,
    order: 20,
    useIsAvailable: useStickersShown,
    useShowAgain: useAddSticker,
    useInstances: useStickerKinds,
    remove: (kind) => {
      const id = stickerIdOf(kind)
      if (id != null) useAppStore.getState().removeMapSticker(id)
    },
    exists: (doc, kind) => doc.mapStickers.some((m) => m.id === stickerIdOf(kind)),
    Node: MapStickers,
    Editor: MapStickerFields,
    animationTrack: 'route',
  })
}
