import { registerCanvasElement } from '../../core/canvas/registry'
import { IconRoute } from '../../components/icons'
import { useHasRoute } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import MapStickerFields from './MapStickerFields'
import MapStickerNode from './MapStickerNode'
import { MAP_STICKER_KIND } from './model'

function useStickerShown() {
  const hasRoute = useHasRoute()
  const shown = useAppStore((s) => s.mapSticker.shown)
  return hasRoute && shown
}

export function registerMapSticker() {
  registerCanvasElement({
    kind: MAP_STICKER_KIND,
    label: 'mapSticker.label',
    meta: 'mapSticker.meta',
    icon: <IconRoute />,
    order: 20,
    useIsAvailable: useStickerShown,
    Node: MapStickerNode,
    Editor: MapStickerFields,
    animationTrack: 'route',
  })
}
